import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { PatternDetectionResult } from './types';
import { findArticulationPoints } from '../lint/graph';

/**
 * Evaluates all 7 distinct distributed failure patterns against the simulation history.
 */
export function detectIncidentPatterns(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[],
  originNodeId: string | null
): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  // 1. Pattern: Retry Storm
  results.push(detectRetryStorm(spec, history));

  // 2. Pattern: Concurrency Exhaustion
  results.push(detectConcurrencyExhaustion(spec, history));

  // 3. Pattern: Queue Buildup
  results.push(detectQueueBuildup(spec, history));

  // 4. Pattern: Crash Loop
  results.push(detectCrashLoop(spec, history));

  // 5. Pattern: Cache Stampede
  results.push(detectCacheStampede(spec, history));

  // 6. Pattern: Single Point of Failure (SPOF)
  results.push(detectSPOF(spec, history, originNodeId));

  // 7. Pattern: Metastable Failure
  results.push(detectMetastableFailure(spec, history));

  return results;
}

function detectRetryStorm(
  _spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  if (history.length === 0) {
    return { pattern: 'retry_storm', detected: false, confidence: 0.1, evidence: [] };
  }

  // Baseline fan-out at t=0
  const baselineFanout = history[0].entryRps > 0
    ? Math.max(1.0, history[0].totalInternalRps / history[0].entryRps)
    : 4.2;

  let peakRetryAmp = 1.0;
  let worstEdge: { id: string; from: string; to: string; attempts: number } | null = null;
  let stormTicks = 0;

  for (const tick of history) {
    const baselineExpectedInternal = Math.max(1, tick.entryRps * baselineFanout);
    const retryAmp = tick.totalInternalRps / baselineExpectedInternal;
    if (retryAmp > peakRetryAmp) {
      peakRetryAmp = retryAmp;
    }
    if (retryAmp >= 1.25 && tick.userSuccessRate < 90) {
      stormTicks++;
    }

    for (const [edgeId, edgeState] of Object.entries(tick.edges)) {
      if (!worstEdge || edgeState.retryAttempts > worstEdge.attempts) {
        worstEdge = {
          id: edgeId,
          from: edgeState.from,
          to: edgeState.to,
          attempts: edgeState.retryAttempts,
        };
      }
    }
  }

  const detected = peakRetryAmp >= 1.3 && stormTicks >= 4;
  // B2: Heuristic formula based on true retry amplification
  const confidence = detected
    ? Math.min(0.98, Math.max(0.60, 0.60 + (peakRetryAmp - 1.0) * 0.30))
    : 0.1;

  const evidence: string[] = [];
  if (detected && worstEdge) {
    evidence.push(
      `Retry amplification surged to ${peakRetryAmp.toFixed(1)}× nominal internal load (baseline fan-out: ${baselineFanout.toFixed(1)}×).`
    );
    evidence.push(
      `Edge '${worstEdge.from} → ${worstEdge.to}' generated ${worstEdge.attempts.toFixed(1)}× attempt multiplication under failure.`
    );
    evidence.push(
      `Unbounded retry storm sustained high latency for ${stormTicks} seconds.`
    );
  }

  return {
    pattern: 'retry_storm',
    detected,
    confidence,
    evidence,
    culpritServiceId: worstEdge?.from,
  };
}

function detectConcurrencyExhaustion(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  let maxRatio = 1.0;
  let culprit: string | null = null;
  let heldTime = 0;

  for (const tick of history) {
    for (const s of spec.services) {
      const state = tick.services[s.id];
      if (!state) continue;

      const ratio = state.serviceEffectiveMs / Math.max(1, s.service_time_ms);
      if (ratio > maxRatio && state.utilization >= 0.85) {
        maxRatio = ratio;
        culprit = s.id;
        heldTime = state.serviceEffectiveMs;
      }
    }
  }

  const detected = maxRatio >= 2.5 && culprit !== null;
  const confidence = detected ? Math.min(0.95, 0.5 + maxRatio / 10) : 0.15;

  const evidence: string[] = [];
  if (detected && culprit) {
    const svc = spec.services.find((s) => s.id === culprit);
    evidence.push(
      `Service '${culprit}' effective service time surged from ${svc?.service_time_ms}ms to ${Math.round(heldTime)}ms (${maxRatio.toFixed(1)}× increase).`
    );
    evidence.push(
      `Synchronous downstream waits held worker slots until caller concurrency pools were exhausted.`
    );
  }

  return {
    pattern: 'concurrency_exhaustion',
    detected,
    confidence,
    evidence,
    culpritServiceId: culprit || undefined,
  };
}

function detectQueueBuildup(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  let maxQueueRatio = 0;
  let culprit: string | null = null;
  let peakQueue = 0;
  let limit = 0;

  for (const tick of history) {
    for (const s of spec.services) {
      const state = tick.services[s.id];
      if (!state) continue;

      const queueRatio = state.queue / Math.max(1, s.queue_limit);
      if (queueRatio > maxQueueRatio) {
        maxQueueRatio = queueRatio;
        culprit = s.id;
        peakQueue = state.queue;
        limit = s.queue_limit;
      }
    }
  }

  const detected = maxQueueRatio >= 0.65;
  const confidence = detected ? Math.min(0.96, maxQueueRatio * 0.95) : 0.1;

  const evidence: string[] = [];
  if (detected && culprit) {
    evidence.push(
      `Queue on service '${culprit}' filled to ${Math.round(maxQueueRatio * 100)}% of limit (${Math.round(peakQueue)} / ${limit} requests).`
    );
    evidence.push(
      `Arrivals exceeded service capacity without sufficient early load shedding, causing latency explosion.`
    );
  }

  return {
    pattern: 'queue_buildup',
    detected,
    confidence,
    evidence,
    culpritServiceId: culprit || undefined,
  };
}

function detectCrashLoop(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  let totalCrashes = 0;
  let culprit: string | null = null;
  let maxServiceCrashes = 0;

  const crashCounts = new Map<string, number>();

  for (const tick of history) {
    for (const s of spec.services) {
      const state = tick.services[s.id];
      if (state && state.instancesCrashed > 0) {
        const count = (crashCounts.get(s.id) || 0) + 1;
        crashCounts.set(s.id, count);
        totalCrashes++;

        if (count > maxServiceCrashes) {
          maxServiceCrashes = count;
          culprit = s.id;
        }
      }
    }
  }

  const detected = maxServiceCrashes >= 3;
  const confidence = detected ? Math.min(0.95, 0.6 + maxServiceCrashes * 0.05) : 0.05;

  const evidence: string[] = [];
  if (detected && culprit) {
    evidence.push(
      `Service '${culprit}' experienced repeated crash events (${maxServiceCrashes} crash seconds) under sustained overload.`
    );
    evidence.push(
      `Cold restarting instances were immediately re-crushed by existing queue backlogs.`
    );
  }

  return {
    pattern: 'crash_loop',
    detected,
    confidence,
    evidence,
    culpritServiceId: culprit || undefined,
  };
}

function detectCacheStampede(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  // Check if cache flush fault exists or backing store had massive arrival spike
  const hasCacheFault = spec.faults.some((f) => f.type === 'cache_flush');
  const cacheEdge = spec.edges.find((e) => e.cache && e.cache.hit_ratio >= 0.7);

  let detected = false;
  let culprit: string | null = null;
  let arrivalJump = 1.0;

  if (cacheEdge && history.length > 30) {
    const backingStoreId = cacheEdge.to;
    const initialArrival = history[0]?.services[backingStoreId]?.arrivalRate || 1;
    let peakArrival = initialArrival;

    for (const tick of history) {
      const arr = tick.services[backingStoreId]?.arrivalRate || 0;
      if (arr > peakArrival) {
        peakArrival = arr;
      }
    }

    arrivalJump = peakArrival / Math.max(1, initialArrival);
    if ((hasCacheFault && arrivalJump >= 2.0) || arrivalJump >= 4.0) {
      detected = true;
      culprit = backingStoreId;
    }
  }

  const confidence = detected ? Math.min(0.95, 0.65 + arrivalJump * 0.05) : 0.1;
  const evidence: string[] = [];
  if (detected && culprit) {
    evidence.push(
      `Backing store '${culprit}' arrival rate jumped ${arrivalJump.toFixed(1)}× following cache bypass.`
    );
    evidence.push(
      `Loss of cache buffering caused an unmitigated thundering herd on transactional data stores.`
    );
  }

  return {
    pattern: 'cache_stampede',
    detected,
    confidence,
    evidence,
    culpritServiceId: culprit || undefined,
  };
}

function detectSPOF(
  spec: ArchitectureSpec,
  _history: SimulationTickMetrics[],
  originNodeId: string | null
): PatternDetectionResult {
  const articulationPoints = findArticulationPoints(spec);
  let detected = false;
  let culprit: string | null = null;

  if (originNodeId) {
    const originSvc = spec.services.find((s) => s.id === originNodeId);
    if (originSvc && (originSvc.instances.initial <= 1 || originSvc.instances.min <= 1)) {
      const isCriticalCallee = spec.edges.some(
        (e) => e.to === originNodeId && e.critical && e.mode === 'sync'
      );
      if (articulationPoints.includes(originNodeId) || originSvc.entry || isCriticalCallee) {
        detected = true;
        culprit = originNodeId;
      }
    }
  }

  const confidence = detected ? 0.94 : 0.1;
  const evidence: string[] = [];
  if (detected && culprit) {
    evidence.push(
      `Origin failure node '${culprit}' is a Single Point of Failure (1 replica) with no redundancy.`
    );
    evidence.push(
      `Structural graph cut-vertex failure caused catastrophic disconnection of downstream flows.`
    );
  }

  return {
    pattern: 'spof_failure',
    detected,
    confidence,
    evidence,
    culpritServiceId: culprit || undefined,
  };
}

function detectMetastableFailure(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): PatternDetectionResult {
  // Find latest trigger end time across all faults
  let triggerEnd = -1;
  for (const f of spec.faults) {
    if (f.end_s > triggerEnd) triggerEnd = f.end_s;
  }

  // If no fault with explicit end, look at workload peak end
  if (triggerEnd <= 0) {
    triggerEnd = 120;
  }

  // Look at ticks 20s or more after triggerEnd
  const postTriggerTicks = history.filter((h) => h.t >= triggerEnd + 15);
  let failedPostTriggerTicks = 0;
  let avgPostTriggerSuccess = 100;

  if (postTriggerTicks.length > 0) {
    const sumSuccess = postTriggerTicks.reduce((acc, h) => acc + h.userSuccessRate, 0);
    avgPostTriggerSuccess = sumSuccess / postTriggerTicks.length;
    failedPostTriggerTicks = postTriggerTicks.filter((h) => h.userSuccessRate < 80).length;
  }

  const detected = postTriggerTicks.length >= 10 && failedPostTriggerTicks >= 10;
  const confidence = detected
    ? Math.min(0.97, Math.max(0.7, 1 - avgPostTriggerSuccess / 100 + 0.3))
    : 0.1;

  const evidence: string[] = [];
  if (detected) {
    evidence.push(
      `System remained failed (${avgPostTriggerSuccess.toFixed(1)}% mean success) for ${failedPostTriggerTicks}s after the trigger fault ended at t=${triggerEnd}s.`
    );
    evidence.push(
      `Self-sustaining retry loop keeps queues full even when upstream traffic and external dependencies return to nominal conditions (Metastable).`
    );
  }

  return {
    pattern: 'metastable_failure',
    detected,
    confidence,
    evidence,
  };
}
