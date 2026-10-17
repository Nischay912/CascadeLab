import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import {
  runLinter,
  applyLintFix,
  findArticulationPoints,
  detectSyncCycles,
  findRetryAmplificationPaths,
  findTimeoutInversions,
} from '../../src/lint';
import { ArchitectureSpec } from '../../src/schema/architecture';

describe('Phase 5: Architecture Linter & Graph Algorithms Validation', () => {
  it('L-ShopFast-Naive: detects known anti-patterns in naive template', () => {
    const report = runLinter(shopFastNaiveTemplate);

    expect(report.totalCount).toBeGreaterThanOrEqual(4);
    expect(report.criticalCount).toBeGreaterThanOrEqual(2);
    expect(report.staticResilienceScore).toBeLessThan(70);

    const ruleIds = report.findings.map((f) => f.ruleId);
    // L1: Retries with no backoff
    expect(ruleIds).toContain('L1');
    // L7: Missing circuit breaker
    expect(ruleIds).toContain('L7');
    // L8: Single Point of Failure (orders-db)
    expect(ruleIds).toContain('L8');
    // L10: Missing gateway load shedding
    expect(ruleIds).toContain('L10');
  });

  it('L-ShopFast-Hardened: scores high with 0 critical findings', () => {
    const report = runLinter(shopFastHardenedTemplate);

    expect(report.criticalCount).toBe(0);
    expect(report.staticResilienceScore).toBeGreaterThanOrEqual(80);
  });

  it('L-ApplyFix: 1-click auto-fixes correctly resolve findings and improve score', () => {
    let spec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    let initialReport = runLinter(spec);
    const initialScore = initialReport.staticResilienceScore;

    // Fix SPOF (L8) on orders-db
    const spofFinding = initialReport.findings.find((f) => f.ruleId === 'L8');
    expect(spofFinding).toBeDefined();
    spec = applyLintFix(spec, spofFinding!.id);

    // Fix Gateway Load Shedding (L10)
    const shedFinding = initialReport.findings.find((f) => f.ruleId === 'L10');
    expect(shedFinding).toBeDefined();
    spec = applyLintFix(spec, shedFinding!.id);

    // Fix Retry Storm Trap (L1)
    const retryFinding = initialReport.findings.find((f) => f.ruleId === 'L1');
    expect(retryFinding).toBeDefined();
    spec = applyLintFix(spec, retryFinding!.id);

    const updatedReport = runLinter(spec);
    expect(updatedReport.staticResilienceScore).toBeGreaterThan(initialScore);
    expect(updatedReport.criticalCount).toBeLessThan(initialReport.criticalCount);
  });

  it('L-Graph-Articulation: Tarjan cut-vertices correctly identify bridge nodes', () => {
    const articulationPoints = findArticulationPoints(shopFastNaiveTemplate);
    // orders-db is a leaf reached via single edge from checkout -> articulation/bridge
    expect(articulationPoints.length).toBeGreaterThan(0);
  });

  it('L-Graph-Cycles: DFS detects cyclic sync dependencies', () => {
    const cyclicSpec: ArchitectureSpec = {
      ...JSON.parse(JSON.stringify(shopFastNaiveTemplate)),
      edges: [
        ...shopFastNaiveTemplate.edges,
        {
          from: 'payments',
          to: 'checkout',
          calls_per_request: 1.0,
          mode: 'sync',
          critical: true,
          timeout_ms: 1000,
          retries: 0,
        },
      ],
    };

    const cycles = detectSyncCycles(cyclicSpec);
    expect(cycles.length).toBeGreaterThan(0);
    const cycleNodes = cycles.flat();
    expect(cycleNodes).toContain('checkout');
    expect(cycleNodes).toContain('payments');
  });

  it('L-Graph-Amplification: detects deep retry amplification path > 8x', () => {
    const deepRetrySpec: ArchitectureSpec = {
      ...JSON.parse(JSON.stringify(shopFastNaiveTemplate)),
      edges: [
        {
          from: 'gateway',
          to: 'checkout',
          calls_per_request: 1.0,
          mode: 'sync',
          critical: true,
          timeout_ms: 2000,
          retries: 2, // factor (1 + 2) = 3
        },
        {
          from: 'checkout',
          to: 'payments',
          calls_per_request: 1.0,
          mode: 'sync',
          critical: true,
          timeout_ms: 2000,
          retries: 3, // factor (1 + 3) = 4; total path multiplier = 3 * 4 = 12 > 8
        },
      ],
    };

    const paths = findRetryAmplificationPaths(deepRetrySpec, 8);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].amplification).toBe(12);
  });

  it('L-Graph-TimeoutInversion: flags caller timeout < callee worst-case', () => {
    const inversionSpec: ArchitectureSpec = {
      name: 'Inversion Test',
      services: [
        {
          id: 'svc-a',
          name: 'Service A',
          entry: true,
          instances: { initial: 2, min: 1, max: 4 },
          concurrency: 20,
          service_time_ms: 10,
          queue_limit: 100,
          cost_inr_per_instance_month: 1000,
          zone_spread: ['a', 'b'],
        },
        {
          id: 'svc-b',
          name: 'Service B',
          entry: false,
          instances: { initial: 2, min: 1, max: 4 },
          concurrency: 20,
          service_time_ms: 100,
          queue_limit: 100,
          cost_inr_per_instance_month: 1000,
          zone_spread: ['a', 'b'],
        },
        {
          id: 'svc-c',
          name: 'Service C',
          entry: false,
          instances: { initial: 2, min: 1, max: 4 },
          concurrency: 20,
          service_time_ms: 50,
          queue_limit: 100,
          cost_inr_per_instance_month: 1000,
          zone_spread: ['a', 'b'],
        },
      ],
      edges: [
        {
          from: 'svc-a',
          to: 'svc-b',
          calls_per_request: 1,
          mode: 'sync',
          critical: true,
          timeout_ms: 500, // Short timeout
          retries: 0,
        },
        {
          from: 'svc-b',
          to: 'svc-c',
          calls_per_request: 1,
          mode: 'sync',
          critical: true,
          timeout_ms: 2000, // Downstream timeout exceeds caller timeout!
          retries: 1, // 2000 * 2 = 4000ms
        },
      ],
      workload: { entry: 'svc-a', pattern: 'constant', base_rps: 100, multiplier: 1, duration_s: 60, ramp_time_s: 10 },
      faults: [],
      seed: 42,
    };

    const inversions = findTimeoutInversions(inversionSpec);
    expect(inversions.length).toBeGreaterThan(0);
    expect(inversions[0].caller).toBe('svc-a');
    expect(inversions[0].callee).toBe('svc-b');
    expect(inversions[0].callerTimeout).toBe(500);
    expect(inversions[0].calleeRequiredTime).toBeGreaterThan(2000);
  });
});
