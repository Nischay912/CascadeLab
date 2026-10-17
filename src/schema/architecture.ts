import { z } from 'zod';

// ==========================================
// 1. Service Specification Schema
// ==========================================
export const ServiceInstancesSchema = z.object({
  initial: z.number().int().min(1).default(3),
  min: z.number().int().min(1).default(1),
  max: z.number().int().min(1).default(12),
});

export const ServiceLoadSheddingSchema = z.object({
  enabled: z.boolean().default(false),
  threshold: z.number().min(0.1).max(1.0).default(0.8), // fraction of queue capacity
});

export const ServiceAutoscaleSchema = z.object({
  enabled: z.boolean().default(true),
  target_util: z.number().min(0.1).max(0.95).default(0.6),
  eval_period_s: z.number().min(1).default(15),
  startup_delay_s: z.number().min(0).default(45), // delay before new replica is ready
  cooldown_s: z.number().min(1).default(120),
});

export const ServiceCrashSchema = z.object({
  enabled: z.boolean().default(true),
  after_overload_s: z.number().min(1).default(20),
  restart_delay_s: z.number().min(1).default(30),
});

export const ServiceSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  role: z.string().optional(),
  entry: z.boolean().optional().default(false),
  instances: ServiceInstancesSchema,
  concurrency: z.number().int().min(1).default(50), // worker slots per instance
  service_time_ms: z.number().min(0.1).default(10), // own processing time excluding dependencies
  queue_limit: z.number().int().min(0).default(200), // per instance
  load_shedding: ServiceLoadSheddingSchema.default({ enabled: false, threshold: 0.8 }),
  autoscale: ServiceAutoscaleSchema.default({
    enabled: true,
    target_util: 0.6,
    eval_period_s: 15,
    startup_delay_s: 45,
    cooldown_s: 120,
  }),
  crash: ServiceCrashSchema.default({
    enabled: true,
    after_overload_s: 20,
    restart_delay_s: 30,
  }),
  cost_inr_per_instance_month: z.number().min(0).default(2500),
  zone_spread: z.array(z.string()).default(['a', 'b']),
});

export type ServiceSpec = Omit<z.infer<typeof ServiceSpecSchema>, 'entry'> & {
  entry?: boolean;
};

// ==========================================
// 2. Edge / Dependency Specification Schema
// ==========================================
export const EdgeBackoffSchema = z.object({
  mode: z.enum(['none', 'fixed', 'exponential']).default('none'),
  jitter: z.boolean().default(false),
  base_delay_ms: z.number().min(0).default(100),
  max_delay_ms: z.number().min(0).default(2000),
});

export const EdgeCircuitBreakerSchema = z.object({
  enabled: z.boolean().default(false),
  failure_rate_threshold: z.number().min(0.01).max(1.0).default(0.5), // 50%
  min_calls: z.number().int().min(1).default(10),
  open_duration_s: z.number().min(1).default(15),
  probe_fraction: z.number().min(0.01).max(0.5).default(0.1),
});

export const EdgeCacheSchema = z.object({
  hit_ratio: z.number().min(0).max(1.0).default(0.0),
  warm_time_s: z.number().min(0).default(30),
});

export const EdgeSpecSchema = z.object({
  id: z.string().optional(),
  from: z.string().min(1),
  to: z.string().min(1),
  calls_per_request: z.number().min(0).default(1.0),
  mode: z.enum(['sync', 'async']).default('sync'),
  critical: z.boolean().default(true), // if true, callee failure fails caller request
  timeout_ms: z.number().min(1).default(1000),
  retries: z.number().int().min(0).max(10).default(0),
  backoff: EdgeBackoffSchema.default({ mode: 'none', jitter: false, base_delay_ms: 100, max_delay_ms: 2000 }),
  circuit_breaker: EdgeCircuitBreakerSchema.default({
    enabled: false,
    failure_rate_threshold: 0.5,
    min_calls: 10,
    open_duration_s: 15,
    probe_fraction: 0.1,
  }),
  cache: EdgeCacheSchema.default({ hit_ratio: 0.0, warm_time_s: 30 }),
  bulkhead_max_concurrent: z.number().int().nullable().default(null),
});

export type EdgeSpec = z.infer<typeof EdgeSpecSchema>;

// ==========================================
// 3. Workload Specification Schema
// ==========================================
export const WorkloadPatternSchema = z.enum([
  'constant',
  'ramp',
  'spike',
  'diurnal',
  'flash_sale',
  'custom',
]);

export const WorkloadSpecSchema = z.object({
  entry: z.string().min(1),
  pattern: WorkloadPatternSchema.default('constant'),
  base_rps: z.number().min(0).default(600),
  multiplier: z.number().min(0.1).default(1.0),
  duration_s: z.number().min(1).default(180),
  ramp_time_s: z.number().min(0).default(30),
  custom_curve: z.array(z.number()).optional(),
});

export type WorkloadSpec = z.infer<typeof WorkloadSpecSchema>;

// ==========================================
// 4. Fault Injection Specification Schema
// ==========================================
export const FaultTypeSchema = z.enum([
  'latency',
  'error',
  'kill_instances',
  'brownout',
  'az_outage',
  'cache_flush',
  'traffic_surge',
  'bad_deployment',
  'gray_failure',
  'network_partition',
]);

export const FaultSpecSchema = z.object({
  id: z.string().optional(),
  type: FaultTypeSchema,
  target: z.string().min(1), // service id, edge id, or zone
  target_to: z.string().optional(), // for network partition
  factor: z.number().min(0).optional(), // for latency factor or traffic surge
  percentage: z.number().min(0).max(100).optional(), // for error %, kill %, capacity %
  zone: z.string().optional(),
  start_s: z.number().min(0).default(60),
  end_s: z.number().min(0).default(120),
  warm_time_s: z.number().min(0).optional(), // for cache recovery
});

export type FaultSpec = z.infer<typeof FaultSpecSchema>;

// ==========================================
// 5. SLO & Complete Architecture Schema
// ==========================================
export const SloSpecSchema = z.object({
  success_pct: z.number().min(0).max(100).default(99.0),
  p95_ms: z.number().min(1).default(800),
});

export const ArchitectureSpecSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slo: SloSpecSchema.default({ success_pct: 99.0, p95_ms: 800 }),
  value_per_request_inr: z.number().min(0).default(40),
  services: z.array(ServiceSpecSchema).min(1),
  edges: z.array(EdgeSpecSchema).default([]),
  workload: WorkloadSpecSchema,
  faults: z.array(FaultSpecSchema).default([]),
  seed: z.number().int().default(42),
});

export type ArchitectureSpec = Omit<z.infer<typeof ArchitectureSpecSchema>, 'services'> & {
  services: ServiceSpec[];
};

// ==========================================
// Helper functions
// ==========================================
export function generateEdgeId(from: string, to: string): string {
  return `${from}->${to}`;
}

export function validateArchitecture(data: unknown): {
  success: boolean;
  data?: ArchitectureSpec;
  errors?: string[];
} {
  const result = ArchitectureSpecSchema.safeParse(data);
  if (result.success) {
    // Normalise edges with auto-generated id
    const normalisedData = {
      ...result.data,
      edges: result.data.edges.map((e) => ({
        ...e,
        id: e.id || generateEdgeId(e.from, e.to),
      })),
    };
    return { success: true, data: normalisedData };
  } else {
    return {
      success: false,
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }
}
