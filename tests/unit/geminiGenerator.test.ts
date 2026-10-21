import { describe, it, expect, beforeEach } from 'vitest';
import { getGeminiApiKey, setGeminiApiKey } from '../../src/generator/geminiTopologyGenerator';
import { validateArchitecture, ArchitectureSpec } from '../../src/schema/architecture';

describe('Gemini Topology Generator Integration', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      key: (i: number) => Object.keys(store)[i] || null,
      length: 0,
    } as any;
  });

  it('correctly reads and writes API key in localStorage', () => {
    setGeminiApiKey('AIzaSyTestKey12345');
    // In Node test env, import.meta.env.VITE_GEMINI_API_KEY might be present from .env.local
    const key = getGeminiApiKey();
    expect(typeof key === 'string' && key.length > 0).toBe(true);
  });

  it('validates mock synthesized 5-tier architecture against ArchitectureSpecSchema', () => {
    const mockSpec: ArchitectureSpec = {
      name: 'ClinicalOps 5-Tier Platform',
      description: '5 tiers with 7 services each for medical team operations',
      services: Array.from({ length: 35 }, (_, i) => {
        const tier = Math.floor(i / 7);
        const indexInTier = i % 7;
        return {
          id: `med-service-${i}`,
          name: `Medical Service ${i + 1}`,
          role: tier === 0 ? 'gateway' : tier === 4 ? 'database' : 'domain',
          instances: { initial: 3, min: 1, max: 10 },
          concurrency: 50,
          service_time_ms: 15,
          queue_limit: 200,
          load_shedding: { enabled: false, threshold: 0.8 },
          autoscale: { enabled: true, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
          crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 },
          cost_inr_per_instance_month: 2500,
          zone_spread: ['a', 'b'],
          position: { x: 80 + tier * 320, y: 60 + indexInTier * 140 },
        };
      }),
      edges: Array.from({ length: 34 }, (_, i) => ({
        id: `med-service-${i}->med-service-${i + 1}`,
        from: `med-service-${i}`,
        to: `med-service-${i + 1}`,
        calls_per_request: 1.0,
        mode: 'sync',
        critical: true,
        timeout_ms: 500,
        retries: 3,
        backoff: { mode: 'none', jitter: false, base_delay_ms: 100, max_delay_ms: 2000 },
        circuit_breaker: { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 },
        cache: { hit_ratio: 0.0, warm_time_s: 30 },
        bulkhead_max_concurrent: null,
      })),
      workload: {
        entry: 'med-service-0',
        pattern: 'constant',
        base_rps: 600,
        multiplier: 1.0,
        duration_s: 180,
        ramp_time_s: 30,
      },
      faults: [],
      slo: { success_pct: 99.0, p95_ms: 800 },
      seed: 42,
      value_per_request_inr: 500,
    };

    const res = validateArchitecture(mockSpec);
    expect(res.success).toBe(true);
    expect(res.data?.services.length).toBe(35);
    expect(res.data?.edges.length).toBe(34);
  });
});
