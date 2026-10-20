import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { RootCauseReport } from '../analysis/types';
import {
  DefconLevel,
  CommanderMitigation,
  CommanderEvaluationResult,
  TacticalLogEntry,
} from './types';

/**
 * Format simulation seconds to mission-control timestamp (e.g. T+01:24)
 */
export function formatMissionTime(timeS: number): string {
  const mins = Math.floor(timeS / 60);
  const secs = Math.floor(timeS % 60);
  return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Evaluates the current digital twin telemetry stream and returns tactical SRE threat intelligence.
 */
export function evaluateIncidentCommander(
  spec: ArchitectureSpec,
  currentMetrics: SimulationTickMetrics | null,
  currentTime: number,
  rootCause: RootCauseReport | null
): CommanderEvaluationResult {
  const timestamp = formatMissionTime(currentTime);

  // Default nominal baseline
  if (!currentMetrics) {
    return {
      threatLevel: 'DEFCON_5',
      threatTitle: 'All Systems Operational',
      threatDescription: 'Digital Twin telemetry nominal. Zero anomaly signatures detected.',
      rootCauseService: null,
      failurePattern: 'Nominal Steady State',
      blastRadiusPct: 0,
      prescribedMitigation: null,
      newLogs: [],
    };
  }

  const successRate = currentMetrics.userSuccessRate;
  const p95 = currentMetrics.userP95Ms;

  // Determine DEFCON Level based on enterprise SRE error budget metrics
  let threatLevel: DefconLevel = 'DEFCON_5';
  let threatTitle = 'All Systems Operational';
  let threatDescription = 'Digital Twin telemetry nominal. Zero anomaly signatures detected.';

  if (successRate < 65 || currentMetrics.crashedInstances >= 3) {
    threatLevel = 'DEFCON_1';
    threatTitle = 'CRITICAL SEV-1 SYSTEM OUTAGE';
    threatDescription = `Severe cascading blackout detected! User success plummeted to ${successRate.toFixed(1)}%. Core SLO breached.`;
  } else if (successRate < 80 || p95 > 800) {
    threatLevel = 'DEFCON_2';
    threatTitle = 'HIGH SEV-2 INCIDENT ALERT';
    threatDescription = `Major degradation in progress. P95 latency reached ${Math.round(p95)}ms with ${currentMetrics.crashedInstances} crashed replicas.`;
  } else if (successRate < 92 || p95 > 450) {
    threatLevel = 'DEFCON_3';
    threatTitle = 'ELEVATED SEV-3 RISK';
    threatDescription = `Worker queue saturation observed. User success degraded to ${successRate.toFixed(1)}%. Upstream thread starvation imminent.`;
  } else if (successRate < 98 || p95 > 250) {
    threatLevel = 'DEFCON_4';
    threatTitle = 'GUARDED SEV-4 JITTER';
    threatDescription = `Minor latency spikes detected (${Math.round(p95)}ms). Monitoring callee connection pools.`;
  }

  // Identify primary culprit service
  let culpritId: string | null = null;
  let culpritService = null;
  if (rootCause && rootCause.origin && rootCause.origin !== 'none') {
    culpritId = rootCause.origin;
  } else {
    // Find service with highest latency or crashed instances
    let worstScore = 0;
    for (const [id, sData] of Object.entries(currentMetrics.services)) {
      const score = sData.instancesCrashed * 100 + sData.p95Ms + sData.queue;
      if (score > worstScore) {
        worstScore = score;
        culpritId = id;
      }
    }
  }

  if (culpritId) {
    culpritService = spec.services.find((s) => s.id === culpritId) || null;
  }

  const blastRadiusPct = rootCause ? rootCause.blastRadiusPct : 0;
  const failurePattern = rootCause ? rootCause.pattern.replace(/_/g, ' ').toUpperCase() : 'TELEMETRY ANOMALY';

  // Formulate tactical SRE mitigation
  let prescribedMitigation: CommanderMitigation | null = null;
  const newLogs: TacticalLogEntry[] = [];

  if (threatLevel !== 'DEFCON_5' && culpritId) {
    const targetEdge = spec.edges.find((e) => e.to === culpritId);
    const hasBreaker = targetEdge?.circuit_breaker?.enabled;
    const hasBackoff = targetEdge?.backoff?.jitter;

    if (targetEdge && !hasBreaker) {
      // Mitigation 1: Trip Circuit Breaker to isolate failing callee
      prescribedMitigation = {
        id: `mitigate_cb_${culpritId}`,
        title: `Trip Circuit Breaker on [${targetEdge.from} ➔ ${culpritId}]`,
        description: `Isolate failing dependency '${culpritId}' with an immediate fast-fail circuit breaker.`,
        targetType: 'edge',
        targetId: `${targetEdge.from}->${culpritId}`,
        mechanism: 'circuit_breaker',
        estimatedRecoveryPct: 35,
        explanation: `By Little's Law (L = λ × W), waiting on slow callee '${culpritId}' exhausts upstream caller worker threads. Opening a circuit breaker converts 1500ms blocking timeouts into 2ms fast-fails, instantly freeing upstream threads.`,
        apply: (architecture: ArchitectureSpec) => {
          const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(architecture));
          const edge = cloned.edges.find(
            (e) => e.from === targetEdge.from && e.to === culpritId
          );
          if (edge) {
            edge.circuit_breaker = {
              enabled: true,
              failure_rate_threshold: 0.35,
              min_calls: 5,
              open_duration_s: 20,
              probe_fraction: 0.1,
            };
          }
          return cloned;
        },
      };
    } else if (targetEdge && !hasBackoff) {
      // Mitigation 2: Quench Retry Storm with Exponential Jitter Backoff
      prescribedMitigation = {
        id: `mitigate_backoff_${culpritId}`,
        title: `Deploy Exponential Jitter Backoff on [${targetEdge.from} ➔ ${culpritId}]`,
        description: `Quench harmonic retry storm targeting '${culpritId}' by de-synchronizing retries with full randomization.`,
        targetType: 'edge',
        targetId: `${targetEdge.from}->${culpritId}`,
        mechanism: 'retry_backoff',
        estimatedRecoveryPct: 28,
        explanation: `Unjittered retries create constructive interference waves (thundering herd). Adding full randomized jitter decorrelates retry pulses, allowing the database queue to drain.`,
        apply: (architecture: ArchitectureSpec) => {
          const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(architecture));
          const edge = cloned.edges.find(
            (e) => e.from === targetEdge.from && e.to === culpritId
          );
          if (edge) {
            edge.backoff = {
              mode: 'exponential',
              jitter: true,
              base_delay_ms: 50,
              max_delay_ms: 400,
            };
          }
          return cloned;
        },
      };
    } else if (culpritService && culpritService.instances) {
      // Mitigation 3: Rapid Horizontal Pod Burst Autoscale
      const currentInitial = culpritService.instances.initial;
      prescribedMitigation = {
        id: `mitigate_burst_${culpritId}`,
        title: `Execute Horizontal Pod Burst (+4 Replicas on '${culpritId}')`,
        description: `Rapid-provision 4 standby worker pods to absorb queue backlog on '${culpritService.name}'.`,
        targetType: 'service',
        targetId: culpritId,
        mechanism: 'autoscale_burst',
        estimatedRecoveryPct: 30,
        explanation: `Worker concurrency capacity is saturated at >90% utilization. Adding 4 replica containers increases throughput capacity (c × concurrency), immediately clearing backlog queues.`,
        apply: (architecture: ArchitectureSpec) => {
          const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(architecture));
          const svc = cloned.services.find((s) => s.id === culpritId);
          if (svc) {
            svc.instances.initial = currentInitial + 4;
            svc.instances.max = Math.max(svc.instances.max, currentInitial + 8);
          }
          return cloned;
        },
      };
    } else {
      // Mitigation 4: Global Adaptive Load Shedding on Entry
      const entrySvc = spec.services.find((s) => s.entry) || spec.services[0];
      prescribedMitigation = {
        id: `mitigate_loadshed_${entrySvc.id}`,
        title: `Activate Adaptive Load Shedding on Entry [${entrySvc.name}]`,
        description: `Drop bottom 15% non-critical requests at edge to protect core checkout transaction processing.`,
        targetType: 'service',
        targetId: entrySvc.id,
        mechanism: 'load_shedding',
        estimatedRecoveryPct: 25,
        explanation: `Ingress offered load exceeds aggregate fleet processing capacity. Shedding low-priority requests preserves SLA for paying transactions and prevents cascading cluster brownout.`,
        apply: (architecture: ArchitectureSpec) => {
          const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(architecture));
          const svc = cloned.services.find((s) => s.id === entrySvc.id);
          if (svc) {
            svc.load_shedding = {
              enabled: true,
              threshold: 0.85,
            };
          }
          return cloned;
        },
      };
    }

    // Generate Tactical Log
    newLogs.push({
      id: `log_${currentTime}_${Math.random().toString(36).substring(2, 6)}`,
      time: currentTime,
      timestamp,
      level: threatLevel === 'DEFCON_1' ? 'critical' : 'warning',
      title: threatTitle,
      message: `${threatDescription} Culprit node: '${culpritService?.name || culpritId}'. Prescribed tactical countermeasure: ${prescribedMitigation.title}.`,
      serviceId: culpritId,
    });
  }

  return {
    threatLevel,
    threatTitle,
    threatDescription,
    rootCauseService: culpritService?.name || culpritId,
    failurePattern,
    blastRadiusPct,
    prescribedMitigation,
    newLogs,
  };
}
