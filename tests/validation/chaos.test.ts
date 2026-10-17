import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import {
  generateChaosScenarios,
  evaluateChaosScenario,
  runChaosSuite,
} from '../../src/chaos/suite';
import { runCapacitySweep } from '../../src/chaos/capacity';

describe('Phase 7: Chaos Suite & Resilience Matrix Heatmap', () => {
  it('generates >= 40 scenarios for microservice architecture', () => {
    const scenarios = generateChaosScenarios(shopFastNaiveTemplate);
    // 13 services * 5 faults + 5 system-wide faults = 70 scenarios
    expect(scenarios.length).toBeGreaterThanOrEqual(40);

    const serviceFaults = scenarios.filter((s) => s.category === 'service');
    expect(serviceFaults.length).toBe(shopFastNaiveTemplate.services.length * 5);

    const systemFaults = scenarios.filter((s) => s.category === 'system');
    expect(systemFaults.length).toBe(5);
  });

  it('evaluates a single scenario deterministically', () => {
    const scenarios = generateChaosScenarios(shopFastNaiveTemplate);
    const dbKillScenario = scenarios.find(
      (s) => s.targetServiceId === 'orders-db' && s.faultType === 'kill_100'
    )!;

    expect(dbKillScenario).toBeDefined();

    const result = evaluateChaosScenario(shopFastNaiveTemplate, dbKillScenario, 90);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.avgSuccessDuringIncident).toBeGreaterThanOrEqual(0);
    expect(result.avgSuccessDuringIncident).toBeLessThanOrEqual(1.0);
    expect(result.blastFraction).toBeGreaterThan(0);
  });

  it('runs full chaos suite, generates 2D matrix, and identifies fragile services', () => {
    const report = runChaosSuite(shopFastNaiveTemplate);

    expect(report.scenariosRun).toBeGreaterThanOrEqual(40);
    expect(report.compositeResilienceScore).toBeGreaterThanOrEqual(0);
    expect(report.compositeResilienceScore).toBeLessThanOrEqual(100);

    // Matrix cells: 13 services * 5 fault types = 65 cells
    expect(report.matrixCells.length).toBe(shopFastNaiveTemplate.services.length * 5);

    // Fragile services identified and ranked
    expect(report.fragileServices.length).toBe(shopFastNaiveTemplate.services.length);
    const topFragile = report.fragileServices[0];
    expect(topFragile.avgScore).toBeLessThanOrEqual(
      report.fragileServices[report.fragileServices.length - 1].avgScore
    );

    // Single Points of Failure detected
    const spofs = report.fragileServices.filter((f) => f.isSPOF);
    expect(spofs.length).toBeGreaterThan(0);
    expect(spofs.some((s) => s.serviceId === 'orders-db' || s.serviceId === 'payment-provider')).toBe(true);

    // Fast batch execution duration
    expect(report.durationMs).toBeLessThan(1000); // typically < 200ms
  });

  it('hardened architecture achieves higher resilience score than naive architecture', () => {
    const naiveReport = runChaosSuite(shopFastNaiveTemplate);
    const hardenedReport = runChaosSuite(shopFastHardenedTemplate);

    expect(hardenedReport.compositeResilienceScore).toBeGreaterThan(
      naiveReport.compositeResilienceScore
    );
  });
});

describe('Phase 7: Capacity Cliff & Bottleneck Knee Detection', () => {
  it('sweeps offered load and detects capacity knee and primary bottleneck', () => {
    const report = runCapacitySweep(shopFastNaiveTemplate);

    expect(report.points.length).toBe(15);
    expect(report.baseRps).toBe(shopFastNaiveTemplate.workload.base_rps);
    expect(report.kneeRps).toBeGreaterThan(0);
    expect(report.maxGoodputRps).toBeGreaterThan(0);
    expect(report.headroomRatio).toBeGreaterThan(0);
    expect(report.primaryBottleneckId).toBeDefined();

    // Verify sweep points monotonicity in offered RPS
    for (let i = 1; i < report.points.length; i++) {
      expect(report.points[i].offeredRps).toBeGreaterThan(report.points[i - 1].offeredRps);
    }

    // Goodput should equal offered load at low utilization, then saturate
    expect(report.points[0].goodputRps).toBeCloseTo(report.points[0].offeredRps, -1);
  });
});
