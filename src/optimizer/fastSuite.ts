import { ArchitectureSpec } from '../schema/architecture';
import { generateChaosScenarios, evaluateChaosScenario } from '../chaos/suite';

/**
 * Evaluates the spec using the "Fast Suite" (~10-12 key scenarios).
 * Used during greedy forward selection and genetic algorithm iterations to evaluate
 * hundreds of candidates in under 100ms.
 */
export interface FastSuiteReport {
  resilienceScore: number;
  scenarioResults: {
    scenarioId: string;
    scenarioName: string;
    score: number;
    avgSuccessPct: number;
    moneyLostInr: number;
  }[];
}

export function runFastResilienceSuite(spec: ArchitectureSpec): FastSuiteReport {
  const allScenarios = generateChaosScenarios(spec);

  // Pick 5-6 highest-leverage representative scenarios:
  // 3 system-wide faults + 3 critical service faults
  const fastScenarios = allScenarios.filter((sc) => {
    if (sc.id === 'system_traffic_3x' || sc.id === 'system_cache_flush' || sc.id === 'system_az_outage') {
      return true;
    }
    if (sc.targetServiceId) {
      if (sc.targetServiceId.includes('db') && sc.faultType === 'kill_100') return true;
      if (sc.targetServiceId.includes('provider') && sc.faultType === 'latency_20x') return true;
      if (sc.targetServiceId.includes('checkout') && sc.faultType === 'error_30') return true;
    }
    return false;
  }).slice(0, 6);

  // If fewer than 4 found (e.g. simple custom spec), take first 5 scenarios
  const scenariosToRun = fastScenarios.length >= 4 ? fastScenarios : allScenarios.slice(0, 5);

  let totalWeight = 0;
  let weightedScoreSum = 0;
  let worstCaseScore = 100;
  const scenarioResults: FastSuiteReport['scenarioResults'] = [];

  for (const sc of scenariosToRun) {
    // 50-second fast simulation window (incident [15, 35), recovery [35, 50))
    const res = evaluateChaosScenario(spec, sc, 50);
    totalWeight += sc.weight;
    weightedScoreSum += res.score * sc.weight;
    if (res.score < worstCaseScore) {
      worstCaseScore = res.score;
    }
    scenarioResults.push({
      scenarioId: sc.id,
      scenarioName: sc.name,
      score: res.score,
      avgSuccessPct: Math.round(res.avgSuccessDuringIncident * 1000) / 10,
      moneyLostInr: res.moneyLostInr,
    });
  }

  const weightedMean = totalWeight > 0 ? weightedScoreSum / totalWeight : 100;
  // Proposal §3.5 C: composite = 0.7 * weightedMean + 0.3 * worstCase
  const resilienceScore = Math.max(0, Math.min(100, Math.round(0.7 * weightedMean + 0.3 * worstCaseScore)));

  return {
    resilienceScore,
    scenarioResults,
  };
}

export function evaluateFastResilienceScore(spec: ArchitectureSpec): number {
  return runFastResilienceSuite(spec).resilienceScore;
}
