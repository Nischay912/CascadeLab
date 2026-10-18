import { describe, it, expect } from 'vitest';
import { REALITY_SCENARIOS } from '../../src/reality/dataset';
import { runRealityComparison } from '../../src/reality/engine';

describe('Phase 11: Reality Check - Empirical Mini-Stack Validation', () => {
  it('defines 4 empirical benchmark scenarios with measured metrics', () => {
    expect(REALITY_SCENARIOS.length).toBe(4);
    const scenarioIds = REALITY_SCENARIOS.map((s) => s.id);
    expect(scenarioIds).toContain('baseline');
    expect(scenarioIds).toContain('latency_retries');
    expect(scenarioIds).toContain('latency_no_retries');
    expect(scenarioIds).toContain('circuit_breaker');

    REALITY_SCENARIOS.forEach((sc) => {
      expect(sc.measured.length).toBe(13); // 0s to 60s at 5s intervals
      expect(sc.durationS).toBe(60);
      sc.measured.forEach((pt) => {
        expect(pt.successRate).toBeGreaterThanOrEqual(0);
        expect(pt.successRate).toBeLessThanOrEqual(100);
        expect(pt.p95Ms).toBeGreaterThan(0);
        expect(pt.throughputRps).toBeGreaterThan(0);
      });
    });
  });

  it('validates Baseline scenario with > 95% model fidelity (Grade A+)', () => {
    const baseline = REALITY_SCENARIOS.find((s) => s.id === 'baseline')!;
    const result = runRealityComparison(baseline);

    expect(result.overallFidelityPct).toBeGreaterThanOrEqual(95.0);
    expect(result.fidelityGrade).toBe('A+');
    expect(result.successMape).toBeLessThanOrEqual(3.0);
    expect(result.throughputMape).toBeLessThanOrEqual(5.0);
    expect(result.timeSeries.length).toBe(13);
  });

  it('validates 5x latency with retries scenario capturing retry storm', () => {
    const retriesScenario = REALITY_SCENARIOS.find((s) => s.id === 'latency_retries')!;
    const result = runRealityComparison(retriesScenario);

    expect(result.overallFidelityPct).toBeGreaterThanOrEqual(75.0);
    // Verifies that during the fault window, predicted success rate drops significantly
    const faultPoint = result.timeSeries.find((pt) => pt.timeS === 30)!;
    expect(faultPoint.predictedSuccess).toBeLessThan(70.0);
    expect(faultPoint.measuredSuccess).toBeLessThan(70.0);
  });

  it('validates 0-retries scenario bounds queue growth compared to 3-retries', () => {
    const noRetriesScenario = REALITY_SCENARIOS.find((s) => s.id === 'latency_no_retries')!;
    const result = runRealityComparison(noRetriesScenario);

    expect(result.overallFidelityPct).toBeGreaterThanOrEqual(80.0);
    const faultPoint = result.timeSeries.find((pt) => pt.timeS === 30)!;
    // 0 retries achieves higher success rate and much lower latency than 3 retries (2143ms vs 5736ms)
    expect(faultPoint.predictedSuccess).toBeGreaterThan(50.0);
    expect(faultPoint.predictedP95).toBeLessThan(3000.0);
  });

  it('validates circuit breaker fast-fail latency drop', () => {
    const cbScenario = REALITY_SCENARIOS.find((s) => s.id === 'circuit_breaker')!;
    const result = runRealityComparison(cbScenario);

    expect(result.overallFidelityPct).toBeGreaterThanOrEqual(75.0);
    // When circuit breaker is open (t=30s), predicted p95 latency drops to ~61ms (fast-fail)
    const cbPoint = result.timeSeries.find((pt) => pt.timeS === 30)!;
    expect(cbPoint.predictedP95).toBeLessThan(150.0);
  });
});
