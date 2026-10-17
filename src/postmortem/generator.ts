import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { analyzeSimulationIncident } from '../analysis/analyzer';
import { runLinter } from '../lint/linter';
import { PostmortemData, TimelineEvent, PostmortemActionItem } from './types';

/**
 * Automatically synthesizes an SRE-grade incident postmortem from simulation telemetry.
 */
export function generatePostmortem(
  spec: ArchitectureSpec,
  ticks: SimulationTickMetrics[],
  scenarioTitle?: string
): PostmortemData {
  const analysis = analyzeSimulationIncident(spec, ticks);
  const linter = runLinter(spec);

  const finalTick = ticks[ticks.length - 1] || {
    cumulativeMoneyLostInr: 0,
    userSuccessRate: 100,
    isMetastable: false,
  };

  // 1. Detect incident onset and lowest success rate
  let minSuccessRate = 100;
  let incidentStartSec = -1;
  let incidentEndSec = -1;
  let recoveredSec: number | null = null;
  let totalRequestsLost = 0;

  for (let i = 0; i < ticks.length; i++) {
    const tick = ticks[i];
    if (tick.userSuccessRate < minSuccessRate) {
      minSuccessRate = tick.userSuccessRate;
    }

    if (tick.userSuccessRate < spec.slo.success_pct - 2) {
      if (incidentStartSec === -1) incidentStartSec = tick.t;
      incidentEndSec = tick.t;
      // Estimate dropped requests
      const droppedRate = tick.entryRps * (1 - tick.userSuccessRate / 100);
      totalRequestsLost += Math.round(droppedRate);
    } else if (incidentStartSec !== -1 && recoveredSec === null && tick.t > incidentEndSec + 5) {
      recoveredSec = tick.t;
    }
  }

  if (incidentStartSec === -1) incidentStartSec = 15;
  if (incidentEndSec === -1) incidentEndSec = 45;

  const timeToDetectS = Math.max(1, incidentStartSec);
  const timeToMitigateS = Math.max(timeToDetectS + 5, incidentEndSec);
  const timeToRecoverS = recoveredSec !== null ? Math.max(0, recoveredSec - incidentEndSec) : null;
  const durationSeconds = Math.max(10, incidentEndSec - incidentStartSec);

  // 2. Determine Severity
  let severity: PostmortemData['severity'] = 'P3 - Moderate Incident';
  if (minSuccessRate < 50 || finalTick.cumulativeMoneyLostInr > 20000 || finalTick.isMetastable) {
    severity = 'P1 - Critical Outage';
  } else if (minSuccessRate < 80 || finalTick.cumulativeMoneyLostInr > 5000) {
    severity = 'P2 - Major Degradation';
  }

  // Status
  const status: PostmortemData['status'] = finalTick.isMetastable
    ? 'Metastable Lockup'
    : timeToRecoverS !== null
    ? 'Resolved'
    : 'Mitigated';

  // 3. Extract Degraded Services
  const degradedSet = new Set<string>();
  for (const tick of ticks) {
    for (const [sId, sMetrics] of Object.entries(tick.services)) {
      if (
        sMetrics.utilization > 0.95 ||
        sMetrics.successRate < 85 ||
        sMetrics.instancesCrashed > 0 ||
        sMetrics.queue > 15
      ) {
        degradedSet.add(sId);
      }
    }
  }
  const degradedServices = Array.from(degradedSet);
  const blastRadiusPercentage = Math.round((degradedServices.length / Math.max(1, spec.services.length)) * 100);

  // 4. Construct Chronological Timeline Events
  const timeline: TimelineEvent[] = [];
  const baseTime = new Date('2026-10-18T14:00:00Z').getTime();

  const formatIso = (sec: number) => new Date(baseTime + sec * 1000).toISOString().substring(11, 19) + ' UTC';

  // Event 1: Normal operations baseline
  timeline.push({
    timestamp: formatIso(0),
    relativeTimeS: 0,
    event: `Steady state normal operations. Offered load at ${spec.workload.base_rps || 1000} RPS with 100% success.`,
    category: 'traffic',
    severity: 'info',
  });

  // Event 2: Incident trigger onset
  if (spec.faults.length > 0) {
    const f = spec.faults[0];
    timeline.push({
      timestamp: formatIso(f.start_s),
      relativeTimeS: f.start_s,
      event: `Injected fault trigger: ${f.type.replace('_', ' ')} on target '${f.target}' (duration: ${f.end_s - f.start_s}s).`,
      category: 'fault',
      severity: 'critical',
    });
  } else {
    timeline.push({
      timestamp: formatIso(15),
      relativeTimeS: 15,
      event: 'Disaster event onset: Entry traffic surge or latency degradation triggered.',
      category: 'fault',
      severity: 'warning',
    });
  }

  // Scan ticks for breaker trips and retry storms
  let breakerTripped = false;
  let retryStormTripped = false;
  let replicaCrashTripped = false;

  for (const tick of ticks) {
    // Check circuit breaker
    if (!breakerTripped) {
      for (const [eId, eState] of Object.entries(tick.edges)) {
        if (eState.circuitBreakerState === 'open') {
          timeline.push({
            timestamp: formatIso(tick.t),
            relativeTimeS: tick.t,
            event: `Circuit breaker TRIPPED OPEN on dependency edge '${eId}'. Fast-fail active to protect caller threads.`,
            category: 'breaker',
            severity: 'warning',
          });
          breakerTripped = true;
          break;
        }
      }
    }

    // Check retry amplification
    if (!retryStormTripped && tick.amplification > 2.0) {
      timeline.push({
        timestamp: formatIso(tick.t),
        relativeTimeS: tick.t,
        event: `Retry storm amplification alert: Aggregate internal load amplified to ${tick.amplification}× baseline.`,
        category: 'traffic',
        severity: 'critical',
      });
      retryStormTripped = true;
    }

    // Check replica crash
    if (!replicaCrashTripped && tick.crashedInstances > 0) {
      timeline.push({
        timestamp: formatIso(tick.t),
        relativeTimeS: tick.t,
        event: `Service replica crash loop detected: ${tick.crashedInstances} instance(s) died under sustained overload.`,
        category: 'crash',
        severity: 'critical',
      });
      replicaCrashTripped = true;
    }
  }

  // Recovery or Metastable timeline event
  if (finalTick.isMetastable) {
    timeline.push({
      timestamp: formatIso(ticks.length - 1),
      relativeTimeS: ticks.length - 1,
      event: 'Metastable failure lockup: Incident trigger ended but system failed to self-heal due to persistent queue/retry loop.',
      category: 'recovery',
      severity: 'critical',
    });
  } else if (recoveredSec !== null) {
    timeline.push({
      timestamp: formatIso(recoveredSec),
      relativeTimeS: recoveredSec,
      event: `System self-recovery achieved. User success rate restored above ${spec.slo.success_pct}% SLO.`,
      category: 'recovery',
      severity: 'info',
    });
  }

  // 5. Root Cause & Pattern
  const originSvc = spec.services.find((s) => s.id === analysis.origin);
  const originName = originSvc?.name || (analysis.origin !== 'none' ? analysis.origin : 'External Dependency');

  // 6. Contributing Factors (from Linter findings)
  const contributingFactors: string[] = linter.findings.slice(0, 4).map((f) => `${f.title}: ${f.reason}`);
  if (contributingFactors.length === 0) {
    contributingFactors.push('Unbounded sync dependency call chain under sudden latency spikes.');
  }

  // 7. What Went Well & What Went Poorly
  const whatWentWell: string[] = [];
  const whatWentPoorly: string[] = [];

  if (breakerTripped) {
    whatWentWell.push('Circuit breakers tripped as intended, fast-failing caller threads and preventing full pool starvation.');
  } else {
    whatWentPoorly.push('No circuit breaker was configured on critical downstream dependencies; caller worker threads locked up indefinitely.');
  }

  if (analysis.pattern === 'retry_storm') {
    whatWentPoorly.push('Unjittered synchronous retry policies amplified failure load up to multiple times normal volume.');
  }

  if (blastRadiusPercentage > 30) {
    whatWentPoorly.push(`Cascading failure spread across ${blastRadiusPercentage}% of total services due to tight synchronous coupling.`);
  } else {
    whatWentWell.push(`Blast radius was successfully contained to ${blastRadiusPercentage}% of services without global platform collapse.`);
  }

  if (recoveredSec !== null) {
    whatWentWell.push(`Automated self-healing restored baseline SLO compliance within ${timeToRecoverS} seconds of trigger removal.`);
  }

  // 8. Action Items
  const actionItems: PostmortemActionItem[] = [];

  // P0 Action: Circuit breaker or SPOF fix
  const spofFinding = linter.findings.find((f) => f.ruleId === 'L8');
  if (spofFinding) {
    actionItems.push({
      id: 'ACT-01',
      priority: 'P0',
      action: `Eliminate SPOF: Scale ${spofFinding.target} to >= 2 replicas with multi-AZ spread`,
      owner: 'Platform SRE Team',
      costDeltaInr: 5000,
      rationale: 'Prevents total customer outage when a single node crashes or restarts.',
    });
  }

  actionItems.push({
    id: 'ACT-02',
    priority: 'P0',
    action: `Deploy Circuit Breakers with 50% error threshold on ${originName} calls`,
    owner: 'Backend Core Team',
    costDeltaInr: 0,
    rationale: 'Ensures instantaneous fast-fail fallback when downstream response times degrade.',
  });

  actionItems.push({
    id: 'ACT-03',
    priority: 'P1',
    action: 'Enable Exponential Backoff with Full Jitter and cap retries to <= 1',
    owner: 'API Gateway Team',
    costDeltaInr: 0,
    rationale: 'Eliminates resonant retry storms that amplify traffic spikes into backend databases.',
  });

  actionItems.push({
    id: 'ACT-04',
    priority: 'P2',
    action: 'Configure Adaptive Load Shedding at 85% thread pool saturation',
    owner: 'Service Mesh / SRE Team',
    costDeltaInr: 0,
    rationale: 'Gracefully drops non-essential calls to maintain healthy goodput during extreme surges.',
  });

  return {
    id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
    title: scenarioTitle || `Cascading Failure Incident in ${originName}`,
    severity,
    status,
    date: new Date().toISOString().split('T')[0],
    leadInvestigator: 'CascadeLab Resilience Digital Twin',
    architectureName: spec.name || 'Microservices Stack',
    executiveSummary: `Between ${formatIso(incidentStartSec)} and ${formatIso(
      incidentEndSec
    )}, the system experienced a ${severity.toLowerCase()} triggered by ${analysis.pattern.replace(
      '_',
      ' '
    )} originating in '${originName}'. User success rate plunged to ${Math.round(
      minSuccessRate
    )}%, resulting in ₹${finalTick.cumulativeMoneyLostInr.toLocaleString(
      'en-IN'
    )} in lost revenue and impacting ${blastRadiusPercentage}% of platform services.`,
    impact: {
      durationSeconds,
      timeToDetectS,
      timeToMitigateS,
      timeToRecoverS,
      successRateDuringIncident: Math.round(minSuccessRate * 10) / 10,
      totalRequestsLost,
      financialLossInr: finalTick.cumulativeMoneyLostInr,
      blastRadiusPercentage,
      degradedServices,
    },
    timeline,
    rootCause: {
      originServiceId: originSvc?.id || (analysis.origin !== 'none' ? analysis.origin : 'none'),
      originServiceName: originName,
      failurePattern: analysis.pattern,
      explanation: `Failure initiated in '${originName}' where queue and latency exploded, propagating upstream through synchronous call chains without circuit breaker protection.`,
      evidence: analysis.evidence,
    },
    contributingFactors,
    whatWentWell,
    whatWentPoorly,
    actionItems,
  };
}
