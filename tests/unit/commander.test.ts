import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate } from '../../src/schema/templates';
import {
  evaluateIncidentCommander,
  formatMissionTime,
} from '../../src/commander/engine';
import { SimulationTickMetrics } from '../../src/sim/engine';

describe('AI Autonomous Incident Commander Engine', () => {
  it('formats mission time accurately (T+MM:SS)', () => {
    expect(formatMissionTime(0)).toBe('T+00:00');
    expect(formatMissionTime(42)).toBe('T+00:42');
    expect(formatMissionTime(85)).toBe('T+01:25');
    expect(formatMissionTime(180)).toBe('T+03:00');
  });

  it('evaluates nominal steady-state telemetry as DEFCON 5', () => {
    const mockTick: SimulationTickMetrics = {
      t: 10,
      userSuccessRate: 99.8,
      userP95Ms: 45,
      cumulativeMoneyLostInr: 0,
      activeInstancesTotal: 35,
      crashedInstancesTotal: 0,
      amplification: 1.0,
      activeFaults: [],
      services: {},
      edges: {},
    };

    const result = evaluateIncidentCommander(shopFastNaiveTemplate, mockTick, 10, null);

    expect(result.threatLevel).toBe('DEFCON_5');
    expect(result.threatTitle).toContain('Operational');
    expect(result.prescribedMitigation).toBeNull();
  });

  it('escalates to DEFCON 1 and formulates circuit breaker mitigation when user success drops severely', () => {
    const mockTick: SimulationTickMetrics = {
      t: 45,
      userSuccessRate: 48.2,
      userP95Ms: 1450,
      cumulativeMoneyLostInr: 12000,
      activeInstancesTotal: 30,
      crashedInstancesTotal: 2,
      amplification: 3.4,
      activeFaults: ['latency:payment-provider'],
      services: {
        'payment-provider': {
          rps: 120,
          p95Ms: 1450,
          utilization: 0.95,
          instancesReady: 2,
          instancesCrashed: 1,
          queue: 85,
        },
      },
      edges: {},
    };

    const mockRootCause = {
      origin: 'payment-provider',
      originTime: 30,
      pattern: 'retry_storm' as const,
      confidence: 0.94,
      isMetastable: true,
      blastRadiusPct: 62,
      evidence: ['Payment provider latency spike triggered upstream queue overflow.'],
      patterns: [],
      blastRadius: {
        totalServices: 13,
        degradedServices: ['payment-provider', 'payments', 'checkout', 'gateway'],
        degradedPercentage: 62,
        peakAmplification: 3.4,
        totalMoneyLostInr: 12000,
        timeToDetectS: 32,
        timeToRecoverS: null,
        isMetastable: true,
      },
      chronology: [],
    };

    const result = evaluateIncidentCommander(shopFastNaiveTemplate, mockTick, 45, mockRootCause);

    expect(result.threatLevel).toBe('DEFCON_1');
    expect(result.threatTitle).toContain('CRITICAL');
    expect(result.rootCauseService).toContain('Payment');
    expect(result.prescribedMitigation).not.toBeNull();
    expect(result.newLogs.length).toBeGreaterThan(0);

    // Verify mitigation applies to architecture
    if (result.prescribedMitigation) {
      const hardened = result.prescribedMitigation.apply(shopFastNaiveTemplate);
      const targetEdge = hardened.edges.find((e) => e.to === 'payment-provider');
      expect(targetEdge?.circuit_breaker?.enabled).toBe(true);
    }
  });

  it('prescribes pod scale burst when a bottleneck service is heavily congested', () => {
    // Clone template with existing breaker so it moves to pod burst mitigation
    const spec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    spec.edges.forEach((e: any) => {
      e.circuit_breaker = { enabled: true, failure_rate_threshold: 0.35 };
      e.backoff = { mode: 'exponential', jitter: true };
    });

    const mockTick: SimulationTickMetrics = {
      t: 60,
      userSuccessRate: 75.0,
      userP95Ms: 650,
      cumulativeMoneyLostInr: 5000,
      activeInstancesTotal: 32,
      crashedInstancesTotal: 0,
      amplification: 1.5,
      activeFaults: [],
      services: {
        catalog: {
          rps: 800,
          p95Ms: 650,
          utilization: 0.96,
          instancesReady: 4,
          instancesCrashed: 0,
          queue: 120,
        },
      },
      edges: {},
    };

    const mockRootCause = {
      origin: 'catalog',
      originTime: 50,
      pattern: 'queue_buildup' as const,
      confidence: 0.88,
      isMetastable: false,
      blastRadiusPct: 30,
      evidence: ['Catalog queue overflow'],
      patterns: [],
      blastRadius: {
        totalServices: 13,
        degradedServices: ['catalog'],
        degradedPercentage: 30,
        peakAmplification: 1.5,
        totalMoneyLostInr: 5000,
        timeToDetectS: 52,
        timeToRecoverS: null,
        isMetastable: false,
      },
      chronology: [],
    };

    const result = evaluateIncidentCommander(spec, mockTick, 60, mockRootCause);

    expect(result.threatLevel).toBe('DEFCON_2');
    expect(result.prescribedMitigation).not.toBeNull();
    expect(result.prescribedMitigation?.mechanism).toBe('autoscale_burst');

    if (result.prescribedMitigation) {
      const hardened = result.prescribedMitigation.apply(spec);
      const catalogSvc = hardened.services.find((s: any) => s.id === 'catalog');
      expect(catalogSvc.instances.initial).toBeGreaterThan(4);
    }
  });

  it('progresses to entry load shedding when pod burst capacity is reached', () => {
    const spec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    // Simulate edges already hardened
    spec.edges.forEach((e: any) => {
      e.circuit_breaker = { enabled: true, failure_rate_threshold: 0.35 };
      e.backoff = { mode: 'exponential', jitter: true };
    });
    // Set catalog initial replicas to max burst threshold
    const catalog = spec.services.find((s: any) => s.id === 'catalog');
    if (catalog) {
      catalog.instances.initial = 12;
    }

    const mockTick: SimulationTickMetrics = {
      t: 60,
      userSuccessRate: 60.0,
      userP95Ms: 900,
      cumulativeMoneyLostInr: 8000,
      activeInstancesTotal: 40,
      crashedInstancesTotal: 0,
      amplification: 1.8,
      activeFaults: [],
      services: {
        catalog: {
          rps: 900,
          p95Ms: 900,
          utilization: 0.98,
          instancesReady: 12,
          instancesCrashed: 0,
          queue: 200,
        },
      },
      edges: {},
    };

    const mockRootCause = {
      origin: 'catalog',
      originTime: 50,
      pattern: 'queue_buildup' as const,
      confidence: 0.9,
      isMetastable: false,
      blastRadiusPct: 35,
      evidence: ['Catalog queue overflow'],
      patterns: [],
      blastRadius: {
        totalServices: 13,
        degradedServices: ['catalog'],
        degradedPercentage: 35,
        peakAmplification: 1.8,
        totalMoneyLostInr: 8000,
        timeToDetectS: 52,
        timeToRecoverS: null,
        isMetastable: false,
      },
      chronology: [],
    };

    const result = evaluateIncidentCommander(spec, mockTick, 60, mockRootCause);

    expect(result.prescribedMitigation).not.toBeNull();
    expect(result.prescribedMitigation?.mechanism).toBe('load_shedding');

    if (result.prescribedMitigation) {
      const hardened = result.prescribedMitigation.apply(spec);
      const entry = hardened.services.find((s: any) => s.entry);
      expect(entry?.load_shedding?.enabled).toBe(true);
    }
  });
});
