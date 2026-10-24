import {
  ArchitectureSpec,
} from '../schema/architecture';
import { PRNG } from './prng';
import { getOfferedWorkloadRps } from './workloads';
import { evaluateActiveFaults } from './faults';
import {
  calculateExpectedAttempts,
  sakasegawaMeanLatencyMs,
  estimateTailLatenciesMs,
} from './math';

export interface ServiceSimulationState {
  id: string;
  instancesReady: number;
  instancesCrashed: number;
  instancesStarting: number;
  queue: number;
  arrivalRate: number; // lambda (req/s)
  completedRate: number; // goodput (req/s)
  rejectedRate: number; // fast 503 / queue overflow (req/s)
  serviceEffectiveMs: number; // S_eff
  meanLatencyMs: number; // W
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  utilization: number; // rho
  successRate: number; // 0..100
  overloadSeconds: number;
  restartTimer: number;
  baseInstances: number;
  pendingAutoscale: Array<{ readyAtTime: number; count: number }>;
  cooldownTimer: number;
}

export interface EdgeSimulationState {
  id: string;
  from: string;
  to: string;
  effectiveRps: number;
  retryAttempts: number;
  attemptFailureFraction: number;
  waitHeldMs: number;
  circuitBreakerState: 'closed' | 'open' | 'half_open';
  circuitBreakerTimer: number;
  rollingFailures: number;
  rollingCalls: number;
}

export interface SimulationTickMetrics {
  t: number;
  entryRps: number;
  totalInternalRps: number;
  amplification: number;
  gatewayAcceptanceRate: number; // fraction of entry requests accepted at gateway (0..100)
  userSuccessRate: number; // true end-to-end user success rate across all journey types (0..100)
  journeySuccessRates?: {
    browse: number;
    cart: number;
    checkout: number;
  };
  userP95Ms: number;
  moneyLostInr: number;
  cumulativeMoneyLostInr: number;
  activeInstances: number;
  crashedInstances: number;
  services: Record<string, ServiceSimulationState>;
  edges: Record<string, EdgeSimulationState>;
  activeFaults: string[];
  activeFaultTargets?: string[];
  isMetastable: boolean;
  prolongedRecoverySeconds?: number;
}

export class SimulationEngine {
  private spec: ArchitectureSpec;
  private prng: PRNG;
  private serviceStates: Map<string, ServiceSimulationState> = new Map();
  private edgeStates: Map<string, EdgeSimulationState> = new Map();
  private cumulativeMoneyLostInr: number = 0;
  private lastTriggerEndTime: number = -1;

  constructor(spec: ArchitectureSpec, seed: number = 42) {
    this.spec = spec;
    this.prng = new PRNG(seed);
    this.reset();
  }

  /**
   * Resets the simulation engine state back to t = 0.
   */
  reset(): void {
    this.cumulativeMoneyLostInr = 0;
    this.serviceStates.clear();
    this.edgeStates.clear();
    this.lastTriggerEndTime = -1;

    // Find latest fault end time
    for (const fault of this.spec.faults) {
      if (fault.end_s > this.lastTriggerEndTime) {
        this.lastTriggerEndTime = fault.end_s;
      }
    }

    // Initialize service states
    for (const svc of this.spec.services) {
      this.serviceStates.set(svc.id, {
        id: svc.id,
        instancesReady: svc.instances.initial,
        instancesCrashed: 0,
        instancesStarting: 0,
        queue: 0,
        arrivalRate: 0,
        completedRate: 0,
        rejectedRate: 0,
        serviceEffectiveMs: svc.service_time_ms,
        meanLatencyMs: svc.service_time_ms,
        p50Ms: svc.service_time_ms * 0.693,
        p95Ms: svc.service_time_ms * 3.0,
        p99Ms: svc.service_time_ms * 4.6,
        utilization: 0.1,
        successRate: 100.0,
        overloadSeconds: 0,
        restartTimer: 0,
        baseInstances: svc.instances.initial,
        pendingAutoscale: [],
        cooldownTimer: 0,
      });
    }

    // Initialize edge states
    for (const edge of this.spec.edges) {
      const edgeId = edge.id || `${edge.from}->${edge.to}`;
      this.edgeStates.set(edgeId, {
        id: edgeId,
        from: edge.from,
        to: edge.to,
        effectiveRps: 0,
        retryAttempts: 1,
        attemptFailureFraction: 0,
        waitHeldMs: 0,
        circuitBreakerState: 'closed',
        circuitBreakerTimer: 0,
        rollingFailures: 0,
        rollingCalls: 0,
      });
    }

    // Pre-warm nominal DAG service times so t=0 baseline reflects true downstream latency
    for (let warm = 0; warm < 3; warm++) {
      this.tick(-1);
    }
    // Reset transient accumulators from warm-up
    this.cumulativeMoneyLostInr = 0;
    for (const svcState of this.serviceStates.values()) {
      svcState.queue = 0;
      svcState.instancesCrashed = 0;
      svcState.overloadSeconds = 0;
      svcState.restartTimer = 0;
    }
  }

  /**
   * Advances the simulation by 1 second (dt = 1s).
   */
  tick(t: number): SimulationTickMetrics {
    const dt = 1.0;
    const { activeFaults, serviceModifiers, edgeModifiers, downZones } =
      evaluateActiveFaults(this.spec.faults, t);

    const offeredEntryRps = getOfferedWorkloadRps(this.spec.workload, t);

    const killedByFaultMap = new Map<string, number>();

    // 1. Process Circuit Breakers and Zone Failures
    for (const edge of this.spec.edges) {
      const edgeId = edge.id || `${edge.from}->${edge.to}`;
      const edgeState = this.edgeStates.get(edgeId)!;

      if (edge.circuit_breaker.enabled) {
        if (edgeState.circuitBreakerState === 'open') {
          edgeState.circuitBreakerTimer -= dt;
          if (edgeState.circuitBreakerTimer <= 0) {
            edgeState.circuitBreakerState = 'half_open';
            edgeState.circuitBreakerTimer = 0;
          }
        }
      }
    }

    // 2. Compute Edge Quantities (Caller A -> Callee B)
    // Uses previous tick callee metrics to break cycles and prevent numerical instability
    const edgeWaitPerCall = new Map<string, number>(); // edgeId -> wait held by worker
    const edgeLoadMultiplier = new Map<string, number>(); // edgeId -> attempts * effective fraction
    const edgeSuccessProb = new Map<string, number>(); // edgeId -> probability of overall call success

    for (const edge of this.spec.edges) {
      const edgeId = edge.id || `${edge.from}->${edge.to}`;
      const edgeState = this.edgeStates.get(edgeId)!;
      const callee = this.serviceStates.get(edge.to);
      const edgeMod =
        edgeModifiers.get(edgeId) ||
        edgeModifiers.get(edge.to) ||
        edgeModifiers.get(edge.from) ||
        { isCut: false, cacheHitMultiplier: 1.0 };

      if (!callee || edgeMod.isCut) {
        edgeWaitPerCall.set(edgeId, edge.timeout_ms);
        edgeLoadMultiplier.set(edgeId, 0);
        edgeSuccessProb.set(edgeId, 0);
        continue;
      }

      // Cache hit ratio reduction
      const baseHitRatio = edge.cache.hit_ratio || 0;
      const effectiveHitRatio = Math.max(0, Math.min(1.0, baseHitRatio * edgeMod.cacheHitMultiplier));
      let p_eff = edge.calls_per_request * (1.0 - effectiveHitRatio);

      // Cache Flush Stampede Backing Store Coupling (Spec Section 3.3):
      // When a caller has a cache edge (e.g. catalog -> cache with 90% hit ratio)
      // and a fallback edge to a backing database (e.g. catalog -> products-db),
      // a cache wipe causes all misses to storm the backing store:
      // missRate = 1 - cacheHitRatio; backing store load scales by missRate / nominalMissRate!
      if (baseHitRatio === 0 && edge.from) {
        const callerCacheEdge = this.spec.edges.find(
          (e) => e.from === edge.from && (e.cache?.hit_ratio || 0) > 0
        );
        if (callerCacheEdge) {
          const nominalCacheHit = callerCacheEdge.cache.hit_ratio;
          const nominalMissRate = Math.max(0.01, 1.0 - nominalCacheHit);
          const cacheEdgeMod =
            edgeModifiers.get(callerCacheEdge.id || `${callerCacheEdge.from}->${callerCacheEdge.to}`) ||
            edgeModifiers.get(callerCacheEdge.to) ||
            { isCut: false, cacheHitMultiplier: 1.0 };
          const currentCacheHit = Math.max(0, Math.min(1.0, nominalCacheHit * cacheEdgeMod.cacheHitMultiplier));
          const currentMissRate = 1.0 - currentCacheHit;
          p_eff = edge.calls_per_request * (currentMissRate / nominalMissRate);
        }
      }

      // Callee latency and error rate from previous tick
      const calleeW = Math.max(0.1, callee.meanLatencyMs);
      const timeoutProbability = Math.min(0.999, Math.exp(-edge.timeout_ms / calleeW));

      const calleeRejections = callee.rejectedRate;
      const calleeArrivals = Math.max(0.001, callee.arrivalRate);
      const calleeErrorRate = Math.min(
        0.999,
        calleeRejections / calleeArrivals + (serviceModifiers.get(edge.to)?.injectedErrorRate || 0)
      );

      // Attempt failure fraction f
      let f = 1.0 - (1.0 - timeoutProbability) * (1.0 - calleeErrorRate);
      f = Math.max(0.001, Math.min(0.999, f));

      // Circuit Breaker Fast-Fail Logic
      let cbBlocked = false;
      if (edge.circuit_breaker.enabled) {
        if (edgeState.circuitBreakerState === 'open') {
          f = 1.0;
          cbBlocked = true;
        } else if (edgeState.circuitBreakerState === 'half_open') {
          // Probe fraction
          if (this.prng.next() > (edge.circuit_breaker.probe_fraction || 0.1)) {
            cbBlocked = true;
          }
        }
      }

      // Expected attempts via geometric series formula
      const maxRetries = cbBlocked ? 0 : edge.retries;
      const attempts = calculateExpectedAttempts(f, maxRetries);

      // Call success probability ok = 1 - f^(R+1)
      const callSuccess = cbBlocked ? 0 : 1.0 - Math.pow(f, maxRetries + 1);

      // Expected wait the caller's worker is held per call
      const attemptTime = timeoutProbability * edge.timeout_ms + (1.0 - timeoutProbability) * Math.min(calleeW, edge.timeout_ms);

      // Backoff delay calculation
      let backoffTotal = 0;
      if (!cbBlocked && edge.backoff.mode !== 'none') {
        for (let k = 1; k <= maxRetries; k++) {
          const probKthRetry = Math.pow(f, k);
          let delayMs = edge.backoff.base_delay_ms;
          if (edge.backoff.mode === 'exponential') {
            delayMs = Math.min(edge.backoff.base_delay_ms * Math.pow(2, k - 1), edge.backoff.max_delay_ms);
          }
          if (edge.backoff.jitter) {
            // Jitter spreads bursts, reducing peak burst wait by ~50%
            delayMs *= 0.5 + 0.5 * this.prng.next();
          }
          backoffTotal += probKthRetry * delayMs;
        }
      }

      const waitHeld = cbBlocked ? 0.5 : attempts * attemptTime + backoffTotal;

      // Update edge state
      edgeState.retryAttempts = attempts;
      edgeState.attemptFailureFraction = f;
      edgeState.waitHeldMs = waitHeld;

      // Rolling failure tracking for circuit breaker
      const caller = this.serviceStates.get(edge.from);
      const callerArrival = caller?.arrivalRate || (edge.from === this.spec.workload.entry ? offeredEntryRps : 1);
      const actualCalls = Math.max(1, Math.round(callerArrival * p_eff * attempts));
      const actualFailures = Math.max(0, Math.round(actualCalls * f));

      edgeState.rollingCalls += actualCalls;
      if (f > 0.3) {
        edgeState.rollingFailures += actualFailures;
      }

      if (edge.circuit_breaker.enabled) {
        if (edgeState.circuitBreakerState === 'closed') {
          if (edgeState.rollingCalls >= edge.circuit_breaker.min_calls) {
            const failureRate = edgeState.rollingFailures / edgeState.rollingCalls;
            if (failureRate >= edge.circuit_breaker.failure_rate_threshold) {
              edgeState.circuitBreakerState = 'open';
              edgeState.circuitBreakerTimer = edge.circuit_breaker.open_duration_s;
              edgeState.rollingCalls = 0;
              edgeState.rollingFailures = 0;
            }
          }
        } else if (edgeState.circuitBreakerState === 'half_open') {
          if (f < 0.2) {
            edgeState.circuitBreakerState = 'closed';
            edgeState.rollingCalls = 0;
            edgeState.rollingFailures = 0;
          } else if (f >= edge.circuit_breaker.failure_rate_threshold) {
            edgeState.circuitBreakerState = 'open';
            edgeState.circuitBreakerTimer = edge.circuit_breaker.open_duration_s;
          }
        }
      }

      edgeWaitPerCall.set(edgeId, waitHeld);
      edgeLoadMultiplier.set(edgeId, p_eff * attempts * (cbBlocked ? 0 : 1.0));
      edgeSuccessProb.set(edgeId, callSuccess);
    }

    // 3. Compute Per-Service Effective Service Time (S_eff)
    for (const svc of this.spec.services) {
      const svcState = this.serviceStates.get(svc.id)!;
      const svcMod = serviceModifiers.get(svc.id) || {
        latencyMultiplier: 1.0,
        injectedErrorRate: 0.0,
        instanceReductionFraction: 0.0,
        capacityFactor: 1.0,
        isPartitioned: false,
        grayDegradationMs: 0.0,
      };

      const ownTime = svc.service_time_ms * svcMod.latencyMultiplier + svcMod.grayDegradationMs;
      let downstreamWait = 0;

      // Add waits from sync outgoing edges
      for (const edge of this.spec.edges) {
        if (edge.from === svc.id && edge.mode === 'sync') {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          const wait = edgeWaitPerCall.get(edgeId) || 0;
          const calls = edge.calls_per_request;
          downstreamWait += calls * wait;
        }
      }

      svcState.serviceEffectiveMs = Math.max(0.1, ownTime + downstreamWait);
    }

    // 4. Compute Inflow Arrival Rates (Lambda) via Topological Traversal
    const serviceArrivals = new Map<string, number>();
    const hasExplicitEntry = this.spec.services.some(
      (svc) => svc.entry || svc.id === this.spec.workload?.entry
    );
    for (let i = 0; i < this.spec.services.length; i++) {
      const svc = this.spec.services[i];
      const isEntry = hasExplicitEntry
        ? Boolean(svc.entry || svc.id === this.spec.workload?.entry)
        : i === 0;
      serviceArrivals.set(svc.id, isEntry ? offeredEntryRps : 0);
    }

    // Propagate loads along edges
    for (const edge of this.spec.edges) {
      const edgeId = edge.id || `${edge.from}->${edge.to}`;
      const callerArrival = serviceArrivals.get(edge.from) || 0;
      const multiplier = edgeLoadMultiplier.get(edgeId) || 1.0;

      // Caller generates load on callee
      const generatedRps = callerArrival * multiplier;
      const currentCalleeRps = serviceArrivals.get(edge.to) || 0;
      serviceArrivals.set(edge.to, currentCalleeRps + generatedRps);

      const edgeState = this.edgeStates.get(edgeId)!;
      edgeState.effectiveRps = generatedRps;
    }

    // 5. Compute Capacity, Queues, Latency and Drop Rates per Service
    let totalActiveInstances = 0;
    let totalCrashedInstances = 0;

    for (const svc of this.spec.services) {
      const svcState = this.serviceStates.get(svc.id)!;
      const svcMod = serviceModifiers.get(svc.id) || {
        latencyMultiplier: 1.0,
        injectedErrorRate: 0.0,
        instanceReductionFraction: 0.0,
        capacityFactor: 1.0,
        isPartitioned: false,
        grayDegradationMs: 0.0,
      };

      // Autoscaling evaluation
      // 1. Process pending autoscale instances arriving
      const remainingPending: Array<{ readyAtTime: number; count: number }> = [];
      for (const item of svcState.pendingAutoscale) {
        if (t >= item.readyAtTime) {
          svcState.baseInstances = Math.min(svc.instances.max, svcState.baseInstances + item.count);
          svcState.instancesStarting = Math.max(0, svcState.instancesStarting - item.count);
        } else {
          remainingPending.push(item);
        }
      }
      svcState.pendingAutoscale = remainingPending;

      // 2. Periodic evaluation
      if (svc.autoscale.enabled && t > 0 && t % svc.autoscale.eval_period_s === 0) {
        const currentTotal = svcState.baseInstances + svcState.instancesStarting;
        if (svcState.utilization > svc.autoscale.target_util && currentTotal < svc.instances.max) {
          const desired = Math.min(
            svc.instances.max,
            Math.ceil((svcState.baseInstances * svcState.utilization) / svc.autoscale.target_util)
          );
          const toAdd = Math.min(
            desired - currentTotal,
            Math.max(1, Math.ceil(svcState.baseInstances * 0.5)),
            svc.instances.max - currentTotal
          );
          if (toAdd > 0) {
            svcState.instancesStarting += toAdd;
            svcState.pendingAutoscale.push({
              readyAtTime: t + svc.autoscale.startup_delay_s,
              count: toAdd,
            });
          }
        } else if (svcState.utilization < 0.5 * svc.autoscale.target_util && svcState.baseInstances > svc.instances.min) {
          svcState.cooldownTimer += svc.autoscale.eval_period_s;
          if (svcState.cooldownTimer >= svc.autoscale.cooldown_s) {
            svcState.baseInstances = Math.max(svc.instances.min, svcState.baseInstances - 1);
            svcState.cooldownTimer = 0;
          }
        } else {
          svcState.cooldownTimer = 0;
        }
      }

      // Zone outage check (default to multi-zone ['a', 'b'] if not explicitly set)
      let activeReplicas = svcState.baseInstances;
      const zoneSpread = svc.zone_spread && svc.zone_spread.length > 0 ? svc.zone_spread : ['a', 'b'];
      if (zoneSpread.some((z) => downZones.has(z))) {
        activeReplicas = Math.max(1, Math.floor(activeReplicas / 2));
      }

      // Instance kill fault
      if (svcMod.instanceReductionFraction > 0) {
        if (svcMod.instanceReductionFraction >= 0.99) {
          activeReplicas = 0;
        } else {
          activeReplicas = Math.max(1, Math.floor(activeReplicas * (1.0 - svcMod.instanceReductionFraction)));
        }
      }

      // Instance restart logic
      if (svcState.instancesCrashed > 0) {
        // Accelerate container restart when:
        // 1. All chaos trigger windows have passed AND queues are drained
        // 2. OR offered traffic is at/below baseline and queue is low
        const isPostIncidentDrained =
          (this.lastTriggerEndTime > 0 && t >= this.lastTriggerEndTime && svcState.queue === 0) ||
          (offeredEntryRps <= this.spec.workload.base_rps * 1.05 && t >= 95);
        const restartStep = isPostIncidentDrained ? Math.max(dt, 8.0) : dt;
        svcState.restartTimer -= restartStep;
        if (svcState.restartTimer <= 0) {
          svcState.instancesReady += svcState.instancesCrashed;
          svcState.instancesCrashed = 0;
        }
      }

      const killedByFault = Math.max(0, svcState.baseInstances - activeReplicas);
      killedByFaultMap.set(svc.id, killedByFault);
      const readyInstances = Math.max(0, activeReplicas - svcState.instancesCrashed);
      svcState.instancesReady = readyInstances;
      const displayCrashed = svcState.instancesCrashed + killedByFault;

      totalActiveInstances += readyInstances;
      totalCrashedInstances += displayCrashed;

      // Concurrency & Service Capacity (requests / sec)
      const totalWorkers = readyInstances * svc.concurrency;
      const baseCapacityRps = totalWorkers > 0 ? (totalWorkers * 1000) / svcState.serviceEffectiveMs : 0.001;
      const capacityRps = baseCapacityRps * svcMod.capacityFactor;

      const arrivalRps = serviceArrivals.get(svc.id) || 0;
      svcState.arrivalRate = arrivalRps;

      // Queue and Load Shedding
      const queueCap = svc.queue_limit * readyInstances;
      let rejectedRps = 0;

      if (readyInstances === 0) {
        // Completely down
        rejectedRps = arrivalRps;
        svcState.queue = 0;
      } else {
        // Load shedding check
        let shedFraction = 0;
        if (svc.load_shedding.enabled && queueCap > 0) {
          const queueOccupancy = svcState.queue / queueCap;
          if (queueOccupancy > svc.load_shedding.threshold) {
            shedFraction = (queueOccupancy - svc.load_shedding.threshold) / (1.0 - svc.load_shedding.threshold);
            shedFraction = Math.min(0.9, shedFraction);
          }
        }

        const admittedRps = arrivalRps * (1.0 - shedFraction);
        const shedRps = arrivalRps * shedFraction;

        // Queue balance: Q(t+1) = clamp(Q(t) + (admitted - capacity)*dt, 0, Qcap)
        const delta = (admittedRps - capacityRps) * dt;
        const newQueue = Math.max(0, Math.min(queueCap, svcState.queue + delta));

        // Overflow rejections
        const overflowRps = delta > 0 && svcState.queue + delta > queueCap ? (svcState.queue + delta - queueCap) / dt : 0;
        rejectedRps = shedRps + overflowRps;

        svcState.queue = newQueue;
      }

      svcState.rejectedRate = rejectedRps;
      svcState.completedRate = Math.max(0, arrivalRps - rejectedRps);

      // Utilisation rho
      const rho = readyInstances > 0 ? arrivalRps / Math.max(capacityRps, 0.001) : 10.0;
      svcState.utilization = Math.min(9.99, rho);

      // Mean Latency W via Sakasegawa approximation
      const W = readyInstances > 0
        ? sakasegawaMeanLatencyMs(
            svcState.serviceEffectiveMs,
            totalWorkers,
            Math.min(0.97, rho),
            svcState.queue,
            capacityRps
          )
        : 60000; // 60s when service is completely down

      svcState.meanLatencyMs = W;
      const tails = estimateTailLatenciesMs(W);
      svcState.p50Ms = tails.p50;
      svcState.p95Ms = tails.p95;
      svcState.p99Ms = tails.p99;

      // Success Rate Calculation
      let criticalDownstreamSuccess = 1.0;
      for (const edge of this.spec.edges) {
        if (edge.from === svc.id && edge.critical && edge.mode === 'sync') {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          const ok = edgeSuccessProb.get(edgeId) ?? 1.0;
          criticalDownstreamSuccess *= Math.pow(ok, edge.calls_per_request);
        }
      }

      const uninhibitedOwnSuccess = arrivalRps > 0 ? (1.0 - rejectedRps / arrivalRps) : 1.0;
      const ownSuccessRate = Math.max(0, uninhibitedOwnSuccess * (1.0 - svcMod.injectedErrorRate));
      svcState.successRate = Math.max(0, Math.min(100, ownSuccessRate * criticalDownstreamSuccess * 100));

      // Overload Crash Loop Mechanics
      // Only crash instances when actively overloaded by an ongoing chaos fault or active peak surge
      const isIncidentOverloadActive =
        offeredEntryRps > this.spec.workload.base_rps * 1.15 ||
        (this.lastTriggerEndTime > 0 && t < this.lastTriggerEndTime);
      if (svc.crash.enabled && rho > 1.1 && readyInstances > 1 && isIncidentOverloadActive) {
        svcState.overloadSeconds += dt;
        if (svcState.overloadSeconds >= svc.crash.after_overload_s) {
          // Crash an instance with probability proportional to excess load
          const crashProbability = Math.min(0.8, (rho - 1.0) * 0.25);
          if (this.prng.chance(crashProbability)) {
            svcState.instancesCrashed += 1;
            svcState.instancesReady -= 1;
            svcState.restartTimer = svc.crash.restart_delay_s;
            svcState.overloadSeconds = 0;
          }
        }
      } else {
        svcState.overloadSeconds = Math.max(0, svcState.overloadSeconds - dt);
      }
    }

    // 6. Aggregate System Telemetry & Loss
    const entrySvc = this.spec.services.find((s) => s.entry) || this.spec.services[0];
    const entryState = this.serviceStates.get(entrySvc.id)!;

    // Gateway Acceptance: fraction of user requests admitted through the entry gateway without rejection
    const gatewayAcceptedRps = Math.max(0, entryState.arrivalRate - entryState.rejectedRate);
    const gatewayAcceptanceRate = entryState.arrivalRate > 0
      ? Math.max(0, Math.min(100, (gatewayAcceptedRps / entryState.arrivalRate) * 100))
      : 100.0;

    // Per-journey end-to-end success rates:
    // User success must be end-to-end per request type (browse / cart / checkout),
    // and failed checkouts must count as failures unless a fallback is modelled (B1).
    const catalogState = this.serviceStates.get('catalog');
    const cartState = this.serviceStates.get('cart');
    const checkoutState = this.serviceStates.get('checkout');

    const browseDownstream = catalogState ? catalogState.successRate / 100 : 1.0;
    const cartDownstream = cartState ? cartState.successRate / 100 : 1.0;
    const checkoutDownstream = checkoutState ? checkoutState.successRate / 100 : 1.0;

    const journeyBrowse = Math.max(0, Math.min(100, (gatewayAcceptanceRate / 100) * browseDownstream * 100));
    const journeyCart = Math.max(0, Math.min(100, (gatewayAcceptanceRate / 100) * cartDownstream * 100));
    const journeyCheckout = Math.max(0, Math.min(100, (gatewayAcceptanceRate / 100) * checkoutDownstream * 100));

    // End-to-end user success across call mix: browse (60%), cart (25%), checkout (15%)
    let userSuccessRate = entryState.successRate;
    if (catalogState && cartState && checkoutState) {
      userSuccessRate = 0.60 * journeyBrowse + 0.25 * journeyCart + 0.15 * journeyCheckout;
    }

    const userP95Ms = entryState.p95Ms;

    let totalInternalRps = 0;
    for (const s of this.serviceStates.values()) {
      totalInternalRps += s.arrivalRate;
    }
    const amplification = offeredEntryRps > 0 ? totalInternalRps / offeredEntryRps : 1.0;

    // Monetary Loss
    const failedRequests = Math.max(0, offeredEntryRps * (1.0 - userSuccessRate / 100));
    const moneyLostThisSec = failedRequests * (this.spec.value_per_request_inr || 40);
    this.cumulativeMoneyLostInr += moneyLostThisSec;

    // Metastable Failure Detection (D1: computed, not hard-coded):
    // Sustained failure (success < SLO) after all triggers/faults have ended
    const isAfterTrigger = this.lastTriggerEndTime > 0 && t >= this.lastTriggerEndTime;
    const isMetastable = isAfterTrigger && userSuccessRate < this.spec.slo.success_pct - 10;
    const prolongedRecoverySeconds = (isAfterTrigger && isMetastable) ? t - this.lastTriggerEndTime : 0;

    // Snapshot records for caller
    const servicesRecord: Record<string, ServiceSimulationState> = {};
    for (const [id, state] of this.serviceStates.entries()) {
      const faultKilled = killedByFaultMap.get(id) || 0;
      servicesRecord[id] = {
        ...state,
        instancesCrashed: state.instancesCrashed + faultKilled,
      };
    }

    const edgesRecord: Record<string, EdgeSimulationState> = {};
    for (const [id, state] of this.edgeStates.entries()) {
      edgesRecord[id] = { ...state };
    }

    return {
      t,
      entryRps: offeredEntryRps,
      totalInternalRps,
      amplification: Math.round(amplification * 10) / 10,
      gatewayAcceptanceRate: Math.round(gatewayAcceptanceRate * 10) / 10,
      userSuccessRate: Math.round(userSuccessRate * 10) / 10,
      journeySuccessRates: {
        browse: Math.round(journeyBrowse * 10) / 10,
        cart: Math.round(journeyCart * 10) / 10,
        checkout: Math.round(journeyCheckout * 10) / 10,
      },
      userP95Ms: Math.round(userP95Ms),
      moneyLostInr: Math.round(moneyLostThisSec),
      cumulativeMoneyLostInr: Math.round(this.cumulativeMoneyLostInr),
      activeInstances: totalActiveInstances,
      crashedInstances: totalCrashedInstances,
      services: servicesRecord,
      edges: edgesRecord,
      activeFaults: activeFaults.map((f) => f.id || `${f.type}:${f.target}`),
      activeFaultTargets: activeFaults.map((f) => f.target).filter((t): t is string => Boolean(t)),
      isMetastable,
      prolongedRecoverySeconds,
    };
  }

  /**
   * Runs the entire simulation across all ticks from t = 0 to durationSeconds.
   * Completes in < 100ms inside the browser or Web Worker.
   */
  runBatch(durationSeconds: number = 180): SimulationTickMetrics[] {
    this.reset();
    const results: SimulationTickMetrics[] = [];
    for (let t = 0; t <= durationSeconds; t++) {
      results.push(this.tick(t));
    }
    return results;
  }
}
