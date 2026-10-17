import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from '../sim/engine';
import { findArticulationPoints } from '../lint/graph';
import {
  ChaosScenario,
  ChaosScenarioResult,
  ChaosMatrixCell,
  FragileServiceSummary,
  ChaosSuiteReport,
} from './types';

/**
 * Generates the standard suite of >= 40 chaos scenarios:
 * 5 per-service fault types for all services, plus 5 system-wide faults.
 */
export function generateChaosScenarios(spec: ArchitectureSpec): ChaosScenario[] {
  const scenarios: ChaosScenario[] = [];

  // Per-service fault permutations
  for (const svc of spec.services) {
    scenarios.push({
      id: `${svc.id}_kill_50`,
      name: `${svc.name}: Kill 50% Replicas`,
      category: 'service',
      faultType: 'kill_50',
      targetServiceId: svc.id,
      description: `Sudden termination of 50% active instances in ${svc.name}`,
      weight: 1.2,
    });

    scenarios.push({
      id: `${svc.id}_kill_100`,
      name: `${svc.name}: Total Node Outage (Kill 100%)`,
      category: 'service',
      faultType: 'kill_100',
      targetServiceId: svc.id,
      description: `Complete replica crash of ${svc.name} (testing failover & fallback)`,
      weight: 1.5,
    });

    scenarios.push({
      id: `${svc.id}_latency_5x`,
      name: `${svc.name}: 5× Latency Spike`,
      category: 'service',
      faultType: 'latency_5x',
      targetServiceId: svc.id,
      description: `Service time jumps 5× (simulating thread pool congestion)`,
      weight: 1.0,
    });

    scenarios.push({
      id: `${svc.id}_latency_20x`,
      name: `${svc.name}: 20× Latency Hang`,
      category: 'service',
      faultType: 'latency_20x',
      targetServiceId: svc.id,
      description: `Extreme 20× degradation (testing client-side timeouts & circuit breakers)`,
      weight: 1.1,
    });

    scenarios.push({
      id: `${svc.id}_error_30`,
      name: `${svc.name}: 30% Injected HTTP 500s`,
      category: 'service',
      faultType: 'error_30',
      targetServiceId: svc.id,
      description: `30% intermittent request failures (testing retry storm vulnerability)`,
      weight: 1.0,
    });
  }

  // System-wide & edge faults
  scenarios.push({
    id: 'system_traffic_3x',
    name: 'Global: 3× Flash Crowd Surge',
    category: 'system',
    faultType: 'traffic_3x',
    description: '300% sudden entry traffic spike across ingress (testing load shedding and autoscaler ramp)',
    weight: 1.5,
  });

  const cacheSvc = spec.services.find(
    (s) => s.id.includes('cache') || s.id.includes('redis') || s.id.includes('db')
  ) || spec.services[0];

  scenarios.push({
    id: 'system_cache_flush',
    name: 'Global: Backing Cache Flush',
    category: 'system',
    faultType: 'cache_flush',
    targetServiceId: cacheSvc.id,
    description: '100% cache invalidation (thundering herd test on backing store)',
    weight: 1.3,
  });

  scenarios.push({
    id: 'system_az_outage',
    name: 'Global: Availability Zone Outage',
    category: 'system',
    faultType: 'az_outage',
    description: 'Complete failure of primary Availability Zone (testing multi-AZ survivability)',
    weight: 1.4,
  });

  const criticalSvc = spec.services.find(
    (s) => s.entry || s.id.includes('gateway') || s.id.includes('api')
  ) || spec.services[0];

  scenarios.push({
    id: 'system_bad_deploy',
    name: `Global: Bad Deployment on ${criticalSvc.name || criticalSvc.id}`,
    category: 'system',
    faultType: 'bad_deploy',
    targetServiceId: criticalSvc.id,
    description: 'Faulty release injecting 25% errors and 3× latency simultaneously',
    weight: 1.3,
  });

  const backendSvc = spec.services.find(
    (s) => s.id.includes('db') || s.id.includes('provider')
  ) || spec.services[spec.services.length - 1];

  scenarios.push({
    id: 'system_gray_failure',
    name: `Global: Gray Creeping Degradation on ${backendSvc.name || backendSvc.id}`,
    category: 'system',
    faultType: 'gray_failure',
    targetServiceId: backendSvc.id,
    description: 'Subtle non-fatal resource leak slowly increasing latency without crashing',
    weight: 1.2,
  });

  return scenarios;
}

/**
 * Executes a single chaos scenario simulation and evaluates the resilience score.
 */
export function evaluateChaosScenario(
  spec: ArchitectureSpec,
  scenario: ChaosScenario,
  durationSeconds: number = 90
): ChaosScenarioResult {
  // Deep clone spec
  const clonedSpec: ArchitectureSpec = JSON.parse(JSON.stringify(spec));
  const incidentStart = 15;
  const incidentEnd = 45;

  // Build specific fault configuration for this scenario
  clonedSpec.faults = [];

  switch (scenario.faultType) {
    case 'kill_50':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'kill_instances',
          target: scenario.targetServiceId,
          percentage: 50,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'kill_100':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'kill_instances',
          target: scenario.targetServiceId,
          percentage: 100,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'latency_5x':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'latency',
          target: scenario.targetServiceId,
          factor: 5,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'latency_20x':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'latency',
          target: scenario.targetServiceId,
          factor: 20,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'error_30':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'error',
          target: scenario.targetServiceId,
          percentage: 30,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'traffic_3x':
      clonedSpec.workload.pattern = 'spike';
      clonedSpec.workload.multiplier = 3.0;
      break;

    case 'cache_flush':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'cache_flush',
          target: scenario.targetServiceId,
          warm_time_s: 30,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'az_outage':
      clonedSpec.faults.push({
        type: 'az_outage',
        zone: 'us-east-1a',
        target: 'all',
        start_s: incidentStart,
        end_s: incidentEnd,
      });
      break;

    case 'bad_deploy':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'bad_deployment',
          target: scenario.targetServiceId,
          percentage: 25,
          factor: 3,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;

    case 'gray_failure':
      if (scenario.targetServiceId) {
        clonedSpec.faults.push({
          type: 'gray_failure',
          target: scenario.targetServiceId,
          factor: 4,
          start_s: incidentStart,
          end_s: incidentEnd,
        });
      }
      break;
  }

  // Run deterministic batch simulation
  const engine = new SimulationEngine(clonedSpec, 42);
  const ticks: SimulationTickMetrics[] = engine.runBatch(durationSeconds);

  // 1. Avg user success during incident [15, 45)
  let sumSuccessDuringIncident = 0;
  let incidentTicksCount = 0;
  for (let t = incidentStart; t < incidentEnd && t < ticks.length; t++) {
    sumSuccessDuringIncident += ticks[t].userSuccessRate;
    incidentTicksCount++;
  }
  const avgSuccessPct = incidentTicksCount > 0 ? sumSuccessDuringIncident / incidentTicksCount : 100;
  const avgSuccessDuringIncident = Math.max(0, Math.min(1.0, avgSuccessPct / 100));

  // 2. Recovery score and time to recover
  // Target recovery threshold = SLO - 2%
  const sloThreshold = Math.max(70, clonedSpec.slo.success_pct - 2);
  let recoveredAtSec: number | null = null;
  const maxPostIncidentTime = durationSeconds - incidentEnd;

  for (let t = incidentEnd; t < ticks.length; t++) {
    if (ticks[t].userSuccessRate >= sloThreshold) {
      // Check if it stays recovered until end of run
      let staysHealthy = true;
      for (let future = t; future < Math.min(t + 10, ticks.length); future++) {
        if (ticks[future].userSuccessRate < sloThreshold - 5) {
          staysHealthy = false;
          break;
        }
      }
      if (staysHealthy) {
        recoveredAtSec = t;
        break;
      }
    }
  }

  const timeToRecoverS = recoveredAtSec !== null ? Math.max(0, recoveredAtSec - incidentEnd) : null;
  const recoveryScore = timeToRecoverS !== null
    ? Math.max(0, Math.min(1.0, 1 - (timeToRecoverS / maxPostIncidentTime)))
    : 0.0;

  // 3. Blast radius fraction
  // Identify degraded services during incident
  const totalServices = Math.max(1, spec.services.length);
  const degradedServices = new Set<string>();

  for (let t = incidentStart; t < incidentEnd && t < ticks.length; t++) {
    const tick = ticks[t];
    for (const [sId, sMetrics] of Object.entries(tick.services)) {
      if (
        sMetrics.utilization > 0.98 ||
        sMetrics.successRate < 90 ||
        sMetrics.instancesCrashed > 0 ||
        sMetrics.queue > 10
      ) {
        degradedServices.add(sId);
      }
    }
  }
  const blastFraction = Math.min(1.0, degradedServices.size / totalServices);

  // 4. Metastability check
  // Sustained failure after incident end
  const finalTicks = ticks.slice(Math.max(0, ticks.length - 10));
  const finalAvgSuccess = finalTicks.reduce((acc, tk) => acc + tk.userSuccessRate, 0) / finalTicks.length;
  const isMetastable = finalAvgSuccess < sloThreshold - 10 || ticks[ticks.length - 1].isMetastable;

  // 5. Peak amplification and money lost
  let peakAmplification = 1.0;
  for (const tick of ticks) {
    if (tick.amplification > peakAmplification) {
      peakAmplification = tick.amplification;
    }
  }
  const moneyLostInr = ticks[ticks.length - 1].cumulativeMoneyLostInr;

  // Resilience score formula from Proposal:
  // score = 100 * (0.5 * avgSuccess + 0.3 * recoveryScore + 0.2 * (1 - blastFraction)) - 30 * [metastable]
  let rawScore = 100 * (0.5 * avgSuccessDuringIncident + 0.3 * recoveryScore + 0.2 * (1 - blastFraction));
  if (isMetastable) {
    rawScore -= 30;
  }
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    scenario,
    score,
    avgSuccessDuringIncident: Math.round(avgSuccessDuringIncident * 100) / 100,
    recoveryScore: Math.round(recoveryScore * 100) / 100,
    timeToRecoverS,
    blastFraction: Math.round(blastFraction * 100) / 100,
    isMetastable,
    peakAmplification: Math.round(peakAmplification * 10) / 10,
    moneyLostInr,
  };
}

/**
 * Runs the full chaos suite and aggregates matrix cells, scores, and fragile services.
 */
export function runChaosSuite(
  spec: ArchitectureSpec,
  onProgress?: (completed: number, total: number) => void
): ChaosSuiteReport {
  const startTime = performance.now();
  const scenarios = generateChaosScenarios(spec);
  const results: ChaosScenarioResult[] = [];
  const matrixCells: ChaosMatrixCell[] = [];

  const articulationPoints = new Set(findArticulationPoints(spec));

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let worstCaseScore = 100;

  const criticalCallees = new Set<string>();
  spec.edges.forEach((e) => {
    if (e.critical && e.mode === 'sync') {
      criticalCallees.add(e.to);
    }
  });

  const isSPOFService = (serviceId: string) => {
    const svc = spec.services.find((s) => s.id === serviceId);
    if (!svc) return false;
    const isSingleInstance = svc.instances.initial <= 1 || svc.instances.min <= 1;
    const isCritical =
      criticalCallees.has(svc.id) ||
      svc.entry ||
      articulationPoints.has(svc.id) ||
      svc.id.includes('db');
    return isSingleInstance && isCritical;
  };

  for (let i = 0; i < scenarios.length; i++) {
    const sc = scenarios[i];
    const res = evaluateChaosScenario(spec, sc, 90);
    results.push(res);

    totalWeight += sc.weight;
    weightedScoreSum += res.score * sc.weight;
    if (res.score < worstCaseScore) {
      worstCaseScore = res.score;
    }

    // Populate matrix cells for per-service faults
    if (
      sc.category === 'service' &&
      sc.targetServiceId &&
      ['kill_50', 'kill_100', 'latency_5x', 'latency_20x', 'error_30'].includes(sc.faultType)
    ) {
      const isSPOF = isSPOFService(sc.targetServiceId);

      matrixCells.push({
        serviceId: sc.targetServiceId,
        faultType: sc.faultType as any,
        score: res.score,
        isSPOF,
        isMetastable: res.isMetastable,
        timeToRecoverS: res.timeToRecoverS,
      });
    }

    if (onProgress) {
      onProgress(i + 1, scenarios.length);
    }
  }

  const weightedMeanScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 100;
  // Proposal §3.5 C: Overall resilience score = 0.7 * weightedMean + 0.3 * worstCase
  const compositeResilienceScore = Math.max(
    0,
    Math.min(100, Math.round(0.7 * weightedMeanScore + 0.3 * worstCaseScore))
  );

  // Group by service to find fragile services
  const serviceStats = new Map<
    string,
    { scores: number[]; isSPOF: boolean; worstScore: number; worstFault: string }
  >();

  for (const cell of matrixCells) {
    let stat = serviceStats.get(cell.serviceId);
    if (!stat) {
      stat = { scores: [], isSPOF: cell.isSPOF, worstScore: 101, worstFault: '' };
      serviceStats.set(cell.serviceId, stat);
    }
    stat.scores.push(cell.score);
    if (cell.score < stat.worstScore) {
      stat.worstScore = cell.score;
      stat.worstFault = cell.faultType;
    }
  }

  const fragileServices: FragileServiceSummary[] = [];
  for (const [sId, stat] of serviceStats.entries()) {
    const svc = spec.services.find((s) => s.id === sId);
    const avgScore =
      stat.scores.length > 0
        ? Math.round(stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length)
        : 100;

    fragileServices.push({
      serviceId: sId,
      serviceName: (svc && svc.name) ? svc.name : sId,
      avgScore,
      isSPOF: stat.isSPOF,
      worstFault: stat.worstFault,
    });
  }

  // Sort fragile services by lowest avgScore
  fragileServices.sort((a, b) => a.avgScore - b.avgScore);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    scenariosRun: scenarios.length,
    compositeResilienceScore,
    weightedMeanScore,
    worstCaseScore,
    results,
    matrixCells,
    fragileServices,
    durationMs,
    evaluatedAt: new Date().toISOString(),
  };
}
