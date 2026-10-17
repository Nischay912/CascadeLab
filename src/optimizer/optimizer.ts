import { ArchitectureSpec } from '../schema/architecture';
import { generateCandidateActions } from './candidates';
import { calculateArchitectureCost } from './cost';
import { evaluateFastResilienceScore } from './fastSuite';
import { runChaosSuite } from '../chaos/suite';
import { generateArchitectureDiff } from './diff';
import {
  CandidateAction,
  ParetoSolution,
  OptimizerReport,
} from './types';

/**
 * Checks if solution A Pareto-dominates solution B.
 * Maximizes resilienceScore, minimizes monthlyCostInr.
 */
function dominates(
  scoreA: number,
  costA: number,
  scoreB: number,
  costB: number
): boolean {
  return (
    scoreA >= scoreB &&
    costA <= costB &&
    (scoreA > scoreB || costA < costB)
  );
}

/**
 * Applies a subset of candidate actions to a base specification.
 */
function applyCandidates(
  baseSpec: ArchitectureSpec,
  candidates: CandidateAction[],
  bitmask: boolean[]
): { spec: ArchitectureSpec; appliedIds: string[] } {
  let spec: ArchitectureSpec = JSON.parse(JSON.stringify(baseSpec));
  const appliedIds: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (bitmask[i]) {
      try {
        spec = candidates[i].apply(spec);
        appliedIds.push(candidates[i].id);
      } catch (err) {
        console.warn(`Could not apply candidate ${candidates[i].id}:`, err);
      }
    }
  }

  return { spec, appliedIds };
}

/**
 * Main Auto-Harden Optimizer:
 * 1. Greedy forward selection by marginal resilience gain per ₹.
 * 2. NSGA-II Lite Genetic Algorithm exploring the Pareto Front.
 * 3. Full suite validation and explainable diff generation.
 */
export function runAutoHardenOptimizer(
  baselineSpec: ArchitectureSpec,
  onProgress?: (generation: number, totalGenerations: number) => void
): OptimizerReport {
  const startTime = performance.now();
  const candidates = generateCandidateActions(baselineSpec);

  // 1. Evaluate baseline
  const baselineCostInr = calculateArchitectureCost(baselineSpec);
  const baselineFastScore = evaluateFastResilienceScore(baselineSpec);

  // If no candidates found, return trivial report
  if (candidates.length === 0) {
    const fullReport = runChaosSuite(baselineSpec);
    const trivialSol: ParetoSolution = {
      id: 'baseline',
      spec: baselineSpec,
      resilienceScore: fullReport.compositeResilienceScore,
      monthlyCostInr: baselineCostInr,
      appliedCandidateIds: [],
      changes: [],
      isParetoOptimal: true,
    };
    return {
      baselineSpec,
      baselineScore: fullReport.compositeResilienceScore,
      baselineCostInr,
      greedySolution: trivialSol,
      paretoFront: [trivialSol],
      allSolutions: [trivialSol],
      evaluationsCount: 1,
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // Evaluation cache (bitstring -> { score, cost, spec, appliedIds })
  const evalCache = new Map<
    string,
    { score: number; cost: number; spec: ArchitectureSpec; appliedIds: string[] }
  >();

  const evaluateBitmask = (mask: boolean[]) => {
    const key = mask.map((b) => (b ? '1' : '0')).join('');
    const cached = evalCache.get(key);
    if (cached) return cached;

    const { spec, appliedIds } = applyCandidates(baselineSpec, candidates, mask);
    const cost = calculateArchitectureCost(spec);
    const score = evaluateFastResilienceScore(spec);

    const result = { score, cost, spec, appliedIds };
    evalCache.set(key, result);
    return result;
  };

  // 2. Greedy Forward Selection
  const greedyMask = new Array(candidates.length).fill(false);
  let currentScore = baselineFastScore;
  let currentCost = baselineCostInr;

  const candidateIndices = candidates.map((_, idx) => idx);

  // Greedily pick best candidate step by step
  for (let step = 0; step < candidates.length; step++) {
    let bestIdx = -1;
    let bestMetric = -Infinity;
    let bestNewScore = currentScore;
    let bestNewCost = currentCost;

    for (const idx of candidateIndices) {
      if (greedyMask[idx]) continue;

      const trialMask = [...greedyMask];
      trialMask[idx] = true;
      const trial = evaluateBitmask(trialMask);

      const deltaScore = trial.score - currentScore;
      const deltaCost = trial.cost - currentCost;

      // Efficiency metric: marginal resilience gain per ₹
      let metric = 0;
      if (deltaCost <= 0) {
        // Free resilience gain: heavily prioritized
        metric = deltaScore > 0 ? deltaScore * 10000 + Math.abs(deltaCost) : -1;
      } else {
        metric = (deltaScore * 1000) / deltaCost;
      }

      if (deltaScore > 0 && metric > bestMetric) {
        bestMetric = metric;
        bestIdx = idx;
        bestNewScore = trial.score;
        bestNewCost = trial.cost;
      }
    }

    if (bestIdx !== -1 && bestNewScore > currentScore) {
      greedyMask[bestIdx] = true;
      currentScore = bestNewScore;
      currentCost = bestNewCost;
    } else {
      break;
    }
  }

  // 3. NSGA-II Lite Genetic Algorithm
  const POP_SIZE = 16;
  const GENERATIONS = 8;

  let population: boolean[][] = [];

  // Seed population with baseline, greedy solution, all-ones, and mutations
  population.push(new Array(candidates.length).fill(false)); // baseline
  population.push([...greedyMask]); // greedy
  population.push(new Array(candidates.length).fill(true)); // max hardening

  while (population.length < POP_SIZE) {
    const ind = [...greedyMask];
    // Random mutation: flip 1-2 bits
    const flips = 1 + Math.floor(Math.random() * 2);
    for (let f = 0; f < flips; f++) {
      const idx = Math.floor(Math.random() * candidates.length);
      ind[idx] = !ind[idx];
    }
    population.push(ind);
  }

  // Genetic Evolution Loop
  for (let gen = 0; gen < GENERATIONS; gen++) {
    const offspring: boolean[][] = [];

    // Produce offspring via crossover & mutation
    while (offspring.length < POP_SIZE) {
      // Tournament selection
      const p1 = population[Math.floor(Math.random() * population.length)];
      const p2 = population[Math.floor(Math.random() * population.length)];

      // Uniform crossover
      const child = p1.map((gene, idx) => (Math.random() < 0.5 ? gene : p2[idx]));

      // Mutation (prob 1 / candidates.length)
      for (let idx = 0; idx < child.length; idx++) {
        if (Math.random() < Math.max(0.1, 1 / candidates.length)) {
          child[idx] = !child[idx];
        }
      }

      offspring.push(child);
    }

    // Combine pool (parents + offspring)
    const combined = [...population, ...offspring];
    const evaluatedPool = combined.map((mask) => ({
      mask,
      ...evaluateBitmask(mask),
    }));

    // Non-dominated rank sorting
    const rankedPool = evaluatedPool.map((ind, i) => {
      let dominationCount = 0;
      for (let j = 0; j < evaluatedPool.length; j++) {
        if (i === j) continue;
        if (dominates(evaluatedPool[j].score, evaluatedPool[j].cost, ind.score, ind.cost)) {
          dominationCount++;
        }
      }
      return { ...ind, dominationCount };
    });

    // Sort by domination count ascending (Rank 0 = non-dominated)
    rankedPool.sort((a, b) => a.dominationCount - b.dominationCount);

    // Keep top POP_SIZE
    population = rankedPool.slice(0, POP_SIZE).map((r) => r.mask);

    if (onProgress) {
      onProgress(gen + 1, GENERATIONS);
    }
  }

  // 4. Extract all evaluated unique solutions and identify Pareto Front
  const allRawSolutions: Array<{
    mask: boolean[];
    score: number;
    cost: number;
    spec: ArchitectureSpec;
    appliedIds: string[];
  }> = Array.from(evalCache.entries()).map(([key, val]) => ({
    mask: key.split('').map((c) => c === '1'),
    ...val,
  }));

  // Non-dominated filter across all explored solutions
  const nonDominated = allRawSolutions.filter((sol, i) => {
    for (let j = 0; j < allRawSolutions.length; j++) {
      if (i === j) continue;
      if (dominates(allRawSolutions[j].score, allRawSolutions[j].cost, sol.score, sol.cost)) {
        return false;
      }
    }
    return true;
  });

  // Sort Pareto Front by cost ascending
  nonDominated.sort((a, b) => a.cost - b.cost);

  // 5. Re-evaluate Pareto Front and Greedy Solution on Full Chaos Suite
  const fullBaselineReport = runChaosSuite(baselineSpec);
  const baselineFinalScore = fullBaselineReport.compositeResilienceScore;

  const greedyEval = evaluateBitmask(greedyMask);
  const greedyFullReport = runChaosSuite(greedyEval.spec);
  const greedyChanges = generateArchitectureDiff(baselineSpec, greedyEval.spec);

  const greedySolution: ParetoSolution = {
    id: 'greedy-recommendation',
    spec: greedyEval.spec,
    resilienceScore: greedyFullReport.compositeResilienceScore,
    monthlyCostInr: greedyEval.cost,
    appliedCandidateIds: greedyEval.appliedIds,
    changes: greedyChanges,
    isParetoOptimal: true,
  };

  const paretoFront: ParetoSolution[] = nonDominated.map((sol, idx) => {
    const isGreedy =
      sol.cost === greedySolution.monthlyCostInr &&
      sol.appliedIds.length === greedySolution.appliedCandidateIds.length;
    const score = isGreedy ? greedySolution.resilienceScore : sol.score;
    const changes = generateArchitectureDiff(baselineSpec, sol.spec);

    return {
      id: `pareto-${idx}`,
      spec: sol.spec,
      resilienceScore: score,
      monthlyCostInr: sol.cost,
      appliedCandidateIds: sol.appliedIds,
      changes,
      isParetoOptimal: true,
    };
  });

  // Ensure greedy solution is included in Pareto front if non-dominated
  if (!paretoFront.some((p) => p.monthlyCostInr === greedySolution.monthlyCostInr)) {
    paretoFront.push(greedySolution);
  }
  paretoFront.sort((a, b) => a.monthlyCostInr - b.monthlyCostInr);

  // Sample all solutions for visualization scatter plot
  const allSolutions: ParetoSolution[] = allRawSolutions.slice(0, 40).map((sol, idx) => ({
    id: `eval-${idx}`,
    spec: sol.spec,
    resilienceScore: sol.score,
    monthlyCostInr: sol.cost,
    appliedCandidateIds: sol.appliedIds,
    changes: [],
    isParetoOptimal: nonDominated.some((nd) => nd.cost === sol.cost && nd.score === sol.score),
  }));

  const durationMs = Math.round(performance.now() - startTime);

  return {
    baselineSpec,
    baselineScore: baselineFinalScore,
    baselineCostInr,
    greedySolution,
    paretoFront,
    allSolutions,
    evaluationsCount: evalCache.size,
    durationMs,
  };
}
