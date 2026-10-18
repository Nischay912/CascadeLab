import { quickCommerceTemplate } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';

const qc = JSON.parse(JSON.stringify(quickCommerceTemplate));

// Flaw 1: dark-store-picker is a single point of failure (1 instance in Zone A)
const picker = qc.services.find((s: any) => s.id === 'dark-store-picker');
picker.instances = { initial: 1, min: 1, max: 2 };
picker.zone_spread = ['a'];
picker.concurrency = 25;
picker.service_time_ms = 35;
picker.queue_limit = 100;

// Flaw 2: rider-allocation is single instance
const rider = qc.services.find((s: any) => s.id === 'rider-allocation');
rider.instances = { initial: 1, min: 1, max: 2 };
rider.zone_spread = ['a'];
rider.concurrency = 20;
rider.service_time_ms = 45;
rider.queue_limit = 80;

// Flaw 3: retries without backoff on critical edges
const e1 = qc.edges.find((e: any) => e.to === 'dark-store-picker');
if (e1) {
  e1.retries = 3;
  e1.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 400 };
  e1.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

const e2 = qc.edges.find((e: any) => e.to === 'rider-allocation');
if (e2) {
  e2.retries = 3;
  e2.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 600 };
  e2.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

// Workload: 400 base RPS, 3.0x multiplier
qc.workload = {
  entry: 'qc-gateway',
  pattern: 'flash_sale',
  base_rps: 400,
  multiplier: 3.0,
  duration_s: 180,
  ramp_time_s: 25,
};

const before = runChaosSuite(qc);
console.log('QC Before:', before.compositeResilienceScore);

const opt = runAutoHardenOptimizer(qc);
const after = runChaosSuite(opt.greedySolution.spec);
console.log('QC After:', after.compositeResilienceScore, 'Delta:', after.compositeResilienceScore - before.compositeResilienceScore);
console.log('Changes:', opt.greedySolution.changes);
