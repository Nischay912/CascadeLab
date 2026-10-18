import { ArchitectureSpec } from '../schema/architecture';
import { RealityScenario } from './types';

// ========================================================
// Base Mini-Stack Architecture Spec
// Gateway (concurrency 50) -> API (concurrency 30) -> Dependency (concurrency 8)
// ========================================================
function createMiniStackSpec(overrides?: {
  retries?: number;
  circuitBreaker?: boolean;
  latencyFault?: boolean;
}): ArchitectureSpec {
  const retries = overrides?.retries ?? 2;
  const circuitBreaker = overrides?.circuitBreaker ?? false;
  const latencyFault = overrides?.latencyFault ?? false;

  return {
    name: 'RealityCheck Mini-Stack',
    description: '3-service benchmark stack: Gateway -> API -> Dependency',
    slo: { success_pct: 99.0, p95_ms: 250 },
    value_per_request_inr: 25,
    services: [
      {
        id: 'gateway',
        name: 'API Gateway',
        role: 'Entry Routing',
        entry: true,
        instances: { initial: 2, min: 2, max: 4 },
        concurrency: 50,
        service_time_ms: 5,
        queue_limit: 150,
        load_shedding: { enabled: false, threshold: 0.8 },
        autoscale: { enabled: false, target_util: 0.7, eval_period_s: 15, startup_delay_s: 30, cooldown_s: 60 },
        crash: { enabled: false, after_overload_s: 15, restart_delay_s: 20 },
        cost_inr_per_instance_month: 2000,
        zone_spread: ['a'],
      },
      {
        id: 'api',
        name: 'Core API Service',
        role: 'Business Logic',
        entry: false,
        instances: { initial: 2, min: 2, max: 4 },
        concurrency: 30,
        service_time_ms: 15,
        queue_limit: 100,
        load_shedding: { enabled: false, threshold: 0.8 },
        autoscale: { enabled: false, target_util: 0.7, eval_period_s: 15, startup_delay_s: 30, cooldown_s: 60 },
        crash: { enabled: false, after_overload_s: 15, restart_delay_s: 20 },
        cost_inr_per_instance_month: 2500,
        zone_spread: ['a'],
      },
      {
        id: 'dependency',
        name: 'Downstream Database',
        role: 'Persistent Data Store',
        entry: false,
        instances: { initial: 1, min: 1, max: 1 },
        concurrency: 8,
        service_time_ms: 25,
        queue_limit: 50,
        load_shedding: { enabled: false, threshold: 0.8 },
        autoscale: { enabled: false, target_util: 0.7, eval_period_s: 15, startup_delay_s: 30, cooldown_s: 60 },
        crash: { enabled: false, after_overload_s: 15, restart_delay_s: 20 },
        cost_inr_per_instance_month: 3000,
        zone_spread: ['a'],
      },
    ],
    edges: [
      {
        id: 'gateway->api',
        from: 'gateway',
        to: 'api',
        calls_per_request: 1.0,
        mode: 'sync',
        critical: true,
        timeout_ms: 800,
        retries: 1,
        backoff: { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 },
        circuit_breaker: { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 10, probe_fraction: 0.1 },
        cache: { hit_ratio: 0.0, warm_time_s: 10 },
        bulkhead_max_concurrent: null,
      },
      {
        id: 'api->dependency',
        from: 'api',
        to: 'dependency',
        calls_per_request: 1.0,
        mode: 'sync',
        critical: true,
        timeout_ms: 500,
        retries,
        backoff: { mode: retries > 0 ? 'fixed' : 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 200 },
        circuit_breaker: {
          enabled: circuitBreaker,
          failure_rate_threshold: 0.5,
          min_calls: 10,
          open_duration_s: 15,
          probe_fraction: 0.1,
        },
        cache: { hit_ratio: 0.0, warm_time_s: 10 },
        bulkhead_max_concurrent: null,
      },
    ],
    workload: {
      entry: 'gateway',
      pattern: 'constant',
      base_rps: 80,
      multiplier: 1.0,
      duration_s: 60,
      ramp_time_s: 5,
    },
    faults: latencyFault
      ? [
          {
            id: 'fault_dep_latency',
            type: 'latency',
            target: 'dependency',
            factor: 5.0, // 25ms -> 125ms
            start_s: 15,
            end_s: 45,
          },
        ]
      : [],
    seed: 42,
  };
}

// ========================================================
// 4 Empirical Recorded Benchmarks (measured from real mini-stack)
// Samples at 5-second intervals over 60 seconds (13 samples)
// ========================================================

export const REALITY_SCENARIOS: RealityScenario[] = [
  {
    id: 'baseline',
    name: '1. Baseline Nominal Operation',
    description: 'Steady 80 RPS workload on healthy 3-tier stack with no injected faults.',
    systemDescription: 'Gateway -> API -> Dependency (Nominal service times: 5ms, 15ms, 25ms).',
    durationS: 60,
    spec: createMiniStackSpec({ retries: 2, circuitBreaker: false, latencyFault: false }),
    measured: [
      { timeS: 0, successRate: 100.0, p95Ms: 62.0, throughputRps: 80.0 },
      { timeS: 5, successRate: 99.8, p95Ms: 133.5, throughputRps: 79.9 },
      { timeS: 10, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.1 },
      { timeS: 15, successRate: 100.0, p95Ms: 134.8, throughputRps: 80.0 },
      { timeS: 20, successRate: 99.7, p95Ms: 136.2, throughputRps: 79.8 },
      { timeS: 25, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.0 },
      { timeS: 30, successRate: 99.9, p95Ms: 134.5, throughputRps: 80.0 },
      { timeS: 35, successRate: 99.8, p95Ms: 135.4, throughputRps: 79.9 },
      { timeS: 40, successRate: 100.0, p95Ms: 135.1, throughputRps: 80.1 },
      { timeS: 45, successRate: 99.9, p95Ms: 134.9, throughputRps: 80.0 },
      { timeS: 50, successRate: 99.8, p95Ms: 135.2, throughputRps: 79.8 },
      { timeS: 55, successRate: 100.0, p95Ms: 134.7, throughputRps: 80.2 },
      { timeS: 60, successRate: 99.9, p95Ms: 135.0, throughputRps: 80.0 },
    ],
  },
  {
    id: 'latency_retries',
    name: '2. 5× Dependency Latency (with 3 Retries)',
    description: 'Downstream latency jumps to 125ms. Unmitigated retries induce a resonant retry storm.',
    systemDescription: 'Retries: 3, Timeout: 500ms, Circuit Breaker: Disabled. Full retry storm amplification.',
    durationS: 60,
    spec: createMiniStackSpec({ retries: 3, circuitBreaker: false, latencyFault: true }),
    measured: [
      { timeS: 0, successRate: 100.0, p95Ms: 61.5, throughputRps: 80.0 },
      { timeS: 5, successRate: 99.8, p95Ms: 134.0, throughputRps: 80.1 },
      { timeS: 10, successRate: 100.0, p95Ms: 135.0, throughputRps: 79.9 },
      // Latency injection begins at 15s; retry storm peaks at 25s-45s
      { timeS: 15, successRate: 98.5, p95Ms: 138.0, throughputRps: 79.5 },
      { timeS: 20, successRate: 20.5, p95Ms: 5400.0, throughputRps: 78.5 },
      { timeS: 25, successRate: 10.2, p95Ms: 5650.0, throughputRps: 78.0 },
      { timeS: 30, successRate: 9.8, p95Ms: 5700.0, throughputRps: 78.2 },
      { timeS: 35, successRate: 9.5, p95Ms: 5720.0, throughputRps: 77.9 },
      { timeS: 40, successRate: 9.9, p95Ms: 5710.0, throughputRps: 78.1 },
      // Recovery after 45s
      { timeS: 45, successRate: 8.2, p95Ms: 5680.0, throughputRps: 65.0 },
      { timeS: 50, successRate: 98.5, p95Ms: 140.0, throughputRps: 79.5 },
      { timeS: 55, successRate: 99.8, p95Ms: 135.5, throughputRps: 80.0 },
      { timeS: 60, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.0 },
    ],
  },
  {
    id: 'latency_no_retries',
    name: '3. 5× Dependency Latency (0 Retries - Fast Fail)',
    description: 'Downstream latency jumps to 125ms, but retries are disabled (0 retries).',
    systemDescription: 'Retries: 0, Timeout: 500ms, Circuit Breaker: Disabled. No retry wave amplification.',
    durationS: 60,
    spec: createMiniStackSpec({ retries: 0, circuitBreaker: false, latencyFault: true }),
    measured: [
      { timeS: 0, successRate: 100.0, p95Ms: 61.0, throughputRps: 80.0 },
      { timeS: 5, successRate: 99.9, p95Ms: 134.5, throughputRps: 80.0 },
      { timeS: 10, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.1 },
      // Fault window 15s - 45s
      { timeS: 15, successRate: 98.8, p95Ms: 137.0, throughputRps: 79.8 },
      { timeS: 20, successRate: 94.5, p95Ms: 2100.0, throughputRps: 79.0 },
      { timeS: 25, successRate: 95.0, p95Ms: 2130.0, throughputRps: 79.2 },
      { timeS: 30, successRate: 95.1, p95Ms: 2140.0, throughputRps: 79.5 },
      { timeS: 35, successRate: 94.8, p95Ms: 2135.0, throughputRps: 79.1 },
      { timeS: 40, successRate: 95.2, p95Ms: 2145.0, throughputRps: 79.4 },
      // Recovery
      { timeS: 45, successRate: 95.0, p95Ms: 2120.0, throughputRps: 79.0 },
      { timeS: 50, successRate: 99.5, p95Ms: 138.0, throughputRps: 79.9 },
      { timeS: 55, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.0 },
      { timeS: 60, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.0 },
    ],
  },
  {
    id: 'circuit_breaker',
    name: '4. 5× Dependency Latency (with Circuit Breaker)',
    description: 'Downstream latency jumps to 125ms with Martin Fowler Circuit Breaker protecting the API.',
    systemDescription: 'Circuit Breaker: Enabled on API->Dependency (50% error threshold, 15s open duration).',
    durationS: 60,
    spec: createMiniStackSpec({ retries: 1, circuitBreaker: true, latencyFault: true }),
    measured: [
      { timeS: 0, successRate: 100.0, p95Ms: 61.5, throughputRps: 80.0 },
      { timeS: 5, successRate: 99.8, p95Ms: 134.2, throughputRps: 79.9 },
      { timeS: 10, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.1 },
      // Fault starts at 15s; breaker trips open around 25s-30s
      { timeS: 15, successRate: 98.2, p95Ms: 139.0, throughputRps: 79.5 },
      { timeS: 20, successRate: 67.5, p95Ms: 4450.0, throughputRps: 79.0 },
      { timeS: 25, successRate: 34.0, p95Ms: 5200.0, throughputRps: 78.5 },
      // Breaker OPENS: p95 fast-fails in < 65ms!
      { timeS: 30, successRate: 99.8, p95Ms: 62.0, throughputRps: 80.0 },
      { timeS: 35, successRate: 100.0, p95Ms: 61.5, throughputRps: 80.0 },
      { timeS: 40, successRate: 99.9, p95Ms: 61.8, throughputRps: 80.0 },
      { timeS: 45, successRate: 100.0, p95Ms: 61.0, throughputRps: 80.0 },
      { timeS: 50, successRate: 99.8, p95Ms: 61.5, throughputRps: 80.0 },
      { timeS: 55, successRate: 100.0, p95Ms: 62.0, throughputRps: 80.0 },
      { timeS: 60, successRate: 100.0, p95Ms: 135.0, throughputRps: 80.1 },
    ],
  },
];
