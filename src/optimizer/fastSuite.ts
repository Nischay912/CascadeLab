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

  // Pick high-leverage representative scenarios across this specific architecture:
  // 1. System faults: traffic surge and AZ outage
  const selected: typeof allScenarios = [];
  const trafficSurge = allScenarios.find((s) => s.id === 'system_traffic_3x');
  const azOutage = allScenarios.find((s) => s.id === 'system_az_outage');
  if (trafficSurge) selected.push(trafficSurge);
  if (azOutage) selected.push(azOutage);

  // 2. Identify critical callee services (targets of sync critical edges)
  const criticalTargets = new Set<string>();
  spec.edges.forEach((e) => {
    if (e.critical && e.mode === 'sync') criticalTargets.add(e.to);
  });

  // Pick latency_5x, kill_50, and error_30 on critical targets
  for (const targetId of criticalTargets) {
    const latFault = allScenarios.find((s) => s.targetServiceId === targetId && s.faultType === 'latency_5x');
    if (latFault && selected.length < 10) selected.push(latFault);
    const killFault = allScenarios.find((s) => s.targetServiceId === targetId && s.faultType === 'kill_50');
    if (killFault && selected.length < 10) selected.push(killFault);
    const errFault = allScenarios.find((s) => s.targetServiceId === targetId && s.faultType === 'error_30');
    if (errFault && selected.length < 10) selected.push(errFault);
  }

  // Fallback if needed
  if (selected.length < 5) {
    allScenarios.slice(0, 5 - selected.length).forEach((s) => selected.push(s));
  }

  const scenariosToRun = selected.slice(0, 6);

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
