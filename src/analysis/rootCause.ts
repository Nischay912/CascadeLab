import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { ServiceOnset } from './types';

/**
 * Scans simulation history to identify the exact onset second and primary trigger metric
 * for every service that degraded during the scenario.
 */
export function detectServiceOnsets(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): Map<string, ServiceOnset> {
  const onsets = new Map<string, ServiceOnset>();
  if (history.length === 0) return onsets;

  // Establish baseline metrics from t=0
  const baselineTick = history[0];
  const baselines = new Map<string, { latency: number; instances: number }>();

  spec.services.forEach((s) => {
    const svcState = baselineTick?.services[s.id];
    baselines.set(s.id, {
      latency: svcState ? svcState.meanLatencyMs : s.service_time_ms,
      instances: s.instances.initial,
    });
  });

  // Scan chronological history
  for (const tick of history) {
    for (const s of spec.services) {
      if (onsets.has(s.id)) continue; // Already marked onset

      const state = tick.services[s.id];
      if (!state) continue;

      const base = baselines.get(s.id)!;

      // Condition 1: Latency jump > 2.5x baseline and > 100ms
      if (state.meanLatencyMs > Math.max(100, base.latency * 2.5)) {
        onsets.set(s.id, {
          serviceId: s.id,
          time: tick.t,
          metric: 'latency',
          value: state.meanLatencyMs,
          baselineValue: base.latency,
        });
        continue;
      }

      // Condition 2: Queue backlog accumulation
      if (state.queue > 25) {
        onsets.set(s.id, {
          serviceId: s.id,
          time: tick.t,
          metric: 'queue',
          value: state.queue,
          baselineValue: 0,
        });
        continue;
      }

      // Condition 3: Error / failure rate > 5%
      if (state.successRate < 95.0 && state.arrivalRate > 5) {
        onsets.set(s.id, {
          serviceId: s.id,
          time: tick.t,
          metric: 'error',
          value: 100 - state.successRate,
          baselineValue: 0,
        });
        continue;
      }

      // Condition 4: Instance crash or 0 ready replicas
      if (state.instancesCrashed > 0 || state.instancesReady === 0) {
        onsets.set(s.id, {
          serviceId: s.id,
          time: tick.t,
          metric: 'crash',
          value: state.instancesCrashed > 0 ? state.instancesCrashed : 1,
          baselineValue: 0,
        });
        continue;
      }

      // Condition 5: Concurrency saturation with queue growth
      if (state.utilization >= 0.98 && state.queue > 15) {
        onsets.set(s.id, {
          serviceId: s.id,
          time: tick.t,
          metric: 'utilization',
          value: state.utilization * 100,
          baselineValue: 20,
        });
        continue;
      }
    }
  }

  return onsets;
}

/**
 * Identifies the root-cause origin service by walking downstream dependencies.
 * In a synchronous microservice graph, delay and worker exhaustion cascade UPSTREAM,
 * so the root cause is either the explicit fault target or the deepest downstream
 * dependency terminus that failed.
 */
export function identifyOriginService(
  spec: ArchitectureSpec,
  onsets: Map<string, ServiceOnset>
): {
  origin: string;
  originTime: number | null;
  explanation: string;
} {
  if (onsets.size === 0) {
    return {
      origin: 'none',
      originTime: null,
      explanation: 'No service degradation observed across the entire scenario.',
    };
  }

  // 1. If an active fault target is among the degraded services, that is the ground-truth root cause!
  for (const fault of spec.faults) {
    if (fault.target && fault.target !== 'all' && onsets.has(fault.target)) {
      const effectiveTime = fault.start_s;
      return {
        origin: fault.target,
        originTime: effectiveTime,
        explanation: `Fault injection '${fault.type}' directly targeted '${fault.target}' at t=${fault.start_s}s, initiating the failure cascade.`,
      };
    }
  }

  // 2. Otherwise, find the deepest downstream degraded service along the critical dependency graph.
  // Callers wait on callees, so the terminus sink service is the root bottleneck!
  const downstreamSync = new Map<string, string[]>();
  spec.services.forEach((s) => downstreamSync.set(s.id, []));
  spec.edges
    .filter((e) => e.mode === 'sync')
    .forEach((e) => {
      downstreamSync.get(e.from)?.push(e.to);
    });

  // Find degraded services that have NO degraded downstream dependencies (the bottom of the funnel)
  const candidateCulprits = Array.from(onsets.keys()).filter((svcId) => {
    const deps = downstreamSync.get(svcId) || [];
    return !deps.some((depId) => onsets.has(depId));
  });

  if (candidateCulprits.length > 0) {
    candidateCulprits.sort(
      (a, b) => (onsets.get(a)?.time || 0) - (onsets.get(b)?.time || 0)
    );
    const culpritId = candidateCulprits[0];
    const onset = onsets.get(culpritId)!;

    return {
      origin: culpritId,
      originTime: onset.time,
      explanation: `Service '${culpritId}' was the downstream terminus of the failure cascade (onset t=${onset.time}s, metric: ${onset.metric}), causing upstream callers to stall.`,
    };
  }

  // Fallback to earliest onset
  const sortedOnsets = Array.from(onsets.values()).sort((a, b) => a.time - b.time);
  const earliest = sortedOnsets[0];
  return {
    origin: earliest.serviceId,
    originTime: earliest.time,
    explanation: `Earliest observed failure was on service '${earliest.serviceId}' at t=${earliest.time}s.`,
  };
}
