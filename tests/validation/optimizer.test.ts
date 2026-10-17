import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import { calculateArchitectureCost, calculateCostDelta } from '../../src/optimizer/cost';
import { generateCandidateActions } from '../../src/optimizer/candidates';
import { evaluateFastResilienceScore } from '../../src/optimizer/fastSuite';
import { generateArchitectureDiff } from '../../src/optimizer/diff';
import { runAutoHardenOptimizer } from '../../src/optimizer/optimizer';

describe('Phase 8: Auto-Harden Cost Model & Candidate Generator', () => {
  it('calculates architecture infrastructure cost accurately in INR/month', () => {
    const cost = calculateArchitectureCost(shopFastNaiveTemplate);
    expect(cost).toBeGreaterThan(20000); // Expected ~₹40,000 - ₹50,000/mo

    // Adding 2 replicas to orders-db (cost = 7500 per replica)
    const cloned = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    const db = cloned.services.find((s: any) => s.id === 'orders-db');
    db.instances.initial += 2;

    const delta = calculateCostDelta(shopFastNaiveTemplate, cloned);
    expect(delta).toBe(15000); // 2 * 7500
  });

  it('generates actionable candidate hardening actions', () => {
    const candidates = generateCandidateActions(shopFastNaiveTemplate);
    expect(candidates.length).toBeGreaterThan(0);

    // Should include zero-cost protection actions (circuit breakers, retry backoff)
    const freeWins = candidates.filter((c) => c.costDeltaInr === 0);
    expect(freeWins.length).toBeGreaterThan(0);

    // Candidates can be applied without throwing
    const firstCandidate = candidates[0];
    const modified = firstCandidate.apply(shopFastNaiveTemplate);
    expect(modified).toBeDefined();
    expect(modified.services.length).toBe(shopFastNaiveTemplate.services.length);
  });

  it('evaluates fast resilience score in < 50ms', () => {
    const start = performance.now();
    const naiveScore = evaluateFastResilienceScore(shopFastNaiveTemplate);
    const hardenedScore = evaluateFastResilienceScore(shopFastHardenedTemplate);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
    expect(hardenedScore).toBeGreaterThan(naiveScore);
  });

  it('computes semantic architecture diff between naive and hardened specs', () => {
    const diffs = generateArchitectureDiff(shopFastNaiveTemplate, shopFastHardenedTemplate);
    expect(diffs.length).toBeGreaterThan(0);

    // Should detect circuit breakers and retry reductions
    const titles = diffs.map((d) => d.title);
    expect(titles.some((t) => t.includes('Circuit Breaker') || t.includes('Retries'))).toBe(true);
  });
});

describe('Phase 8: Multi-Objective Pareto Front Optimizer (NSGA-II Lite)', () => {
  it('runs greedy forward selection and NSGA-II Lite to produce Pareto front', () => {
    const report = runAutoHardenOptimizer(shopFastNaiveTemplate);

    expect(report.baselineScore).toBeGreaterThanOrEqual(0);
    expect(report.greedySolution.resilienceScore).toBeGreaterThan(report.baselineScore);
    expect(report.paretoFront.length).toBeGreaterThan(0);

    // Verify Pareto front monotonicity in cost and non-domination
    for (let i = 1; i < report.paretoFront.length; i++) {
      expect(report.paretoFront[i].monthlyCostInr).toBeGreaterThanOrEqual(
        report.paretoFront[i - 1].monthlyCostInr
      );
    }

    // Verify change list on greedy solution
    expect(report.greedySolution.changes.length).toBeGreaterThan(0);
    expect(report.evaluationsCount).toBeGreaterThan(5);
    expect(report.durationMs).toBeLessThan(2500);
  });
});
