import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import { SimulationEngine } from '../../src/sim/engine';
import {
  analyzeSimulationIncident,
  detectServiceOnsets,
  identifyOriginService,
  detectIncidentPatterns,
  calculateBlastRadius,
} from '../../src/analysis';
import { ArchitectureSpec } from '../../src/schema/architecture';

describe('Phase 6: Incident Analysis & Pattern Detection Validation', () => {
  it('A-Origin: correctly isolates payment-provider as the root cause origin', () => {
    const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
    const history = engine.runBatch(180);

    const onsets = detectServiceOnsets(shopFastNaiveTemplate, history);
    expect(onsets.size).toBeGreaterThan(0);

    const originResult = identifyOriginService(shopFastNaiveTemplate, onsets);
    expect(originResult.origin).toBe('payment-provider');
    expect(originResult.originTime).toBe(60);
    expect(originResult.explanation).toContain('payment-provider');
  });

  it('A-Patterns: detects retry storm and metastable failure on naive ShopFast', () => {
    const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
    const history = engine.runBatch(180);

    const report = analyzeSimulationIncident(shopFastNaiveTemplate, history);

    expect(report.origin).toBe('payment-provider');
    expect(report.isMetastable).toBe(true);
    expect(report.blastRadiusPct).toBeGreaterThanOrEqual(30);
    expect(report.evidence.length).toBeGreaterThanOrEqual(3);

    // Verify retry storm pattern was detected
    const retryStormPattern = report.patterns.find((p) => p.pattern === 'retry_storm');
    expect(retryStormPattern).toBeDefined();
    expect(retryStormPattern!.detected).toBe(true);
    expect(retryStormPattern!.confidence).toBeGreaterThan(0.7);

    // Verify metastable failure was detected
    const metastablePattern = report.patterns.find((p) => p.pattern === 'metastable_failure');
    expect(metastablePattern).toBeDefined();
    expect(metastablePattern!.detected).toBe(true);
  });

  it('A-Hardened: verifies rapid recovery and absence of metastable collapse', () => {
    const engine = new SimulationEngine(shopFastHardenedTemplate, 42);
    const history = engine.runBatch(180);

    const report = analyzeSimulationIncident(shopFastHardenedTemplate, history);

    // Hardened version recovers promptly after fault end t=120
    expect(report.isMetastable).toBe(false);
    expect(report.blastRadius.timeToRecoverS).not.toBeNull();
    expect(report.blastRadius.timeToRecoverS!).toBeLessThan(35);

    const metastablePattern = report.patterns.find((p) => p.pattern === 'metastable_failure');
    expect(metastablePattern!.detected).toBe(false);
  });

  it('A-CacheStampede: detects thundering herd on cache flush fault', () => {
    const cacheFlushSpec: ArchitectureSpec = {
      ...JSON.parse(JSON.stringify(shopFastNaiveTemplate)),
      faults: [
        {
          id: 'f_cache_flush',
          type: 'cache_flush',
          target: 'cache',
          start_s: 60,
          end_s: 100,
        },
      ],
    };

    const engine = new SimulationEngine(cacheFlushSpec, 42);
    const history = engine.runBatch(180);

    const patterns = detectIncidentPatterns(cacheFlushSpec, history, 'cache');
    const stampedePattern = patterns.find((p) => p.pattern === 'cache_stampede');
    expect(stampedePattern).toBeDefined();
    expect(stampedePattern!.detected).toBe(true);
  });

  it('A-SPOF: detects single point of failure when orders-db is killed', () => {
    const spofSpec: ArchitectureSpec = {
      ...JSON.parse(JSON.stringify(shopFastNaiveTemplate)),
      faults: [
        {
          id: 'f_kill_orders_db',
          type: 'kill_instances',
          target: 'orders-db',
          percentage: 100,
          start_s: 40,
          end_s: 120,
        },
      ],
    };

    const engine = new SimulationEngine(spofSpec, 42);
    const history = engine.runBatch(180);

    const report = analyzeSimulationIncident(spofSpec, history);
    expect(report.origin).toBe('orders-db');

    const spofPattern = report.patterns.find((p) => p.pattern === 'spof_failure');
    expect(spofPattern).toBeDefined();
    expect(spofPattern!.detected).toBe(true);
  });

  it('A-BlastRadius: accurately computes financial loss and chronological progression', () => {
    const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
    const history = engine.runBatch(180);

    const onsets = detectServiceOnsets(shopFastNaiveTemplate, history);
    const blast = calculateBlastRadius(shopFastNaiveTemplate, history, onsets);

    expect(blast.totalServices).toBe(13);
    expect(blast.totalMoneyLostInr).toBeGreaterThan(0);
    expect(blast.peakAmplification).toBeGreaterThan(1.2);
    expect(blast.timeToDetectS).toBeLessThanOrEqual(2); // detected almost instantly
  });
});
