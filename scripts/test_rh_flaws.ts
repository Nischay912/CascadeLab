import { rideHailingTemplate } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';

const rh = JSON.parse(JSON.stringify(rideHailingTemplate));

// Flaw 1: location-ingest is SPOF (1 instance in Zone A)
const loc = rh.services.find((s: any) => s.id === 'location-ingest');
loc.instances = { initial: 1, min: 1, max: 2 };
loc.zone_spread = ['a'];
loc.concurrency = 30;
loc.service_time_ms = 25;
loc.queue_limit = 100;
loc.cost_inr_per_instance_month = 2500;

// Flaw 2: h3-spatial-index is SPOF (1 instance in Zone A)
const spatial = rh.services.find((s: any) => s.id === 'h3-spatial-index');
spatial.instances = { initial: 1, min: 1, max: 2 };
spatial.zone_spread = ['a'];
spatial.concurrency = 25;
spatial.service_time_ms = 20;
spatial.queue_limit = 100;
spatial.cost_inr_per_instance_month = 2500;

// Gateway
const gw = rh.services.find((s: any) => s.id === 'driver-gateway');
gw.instances = { initial: 3, min: 2, max: 8 };
gw.concurrency = 30;
gw.service_time_ms = 8;
gw.queue_limit = 150;
gw.load_shedding = { enabled: false, threshold: 0.85 };

// Edge retries without backoff on critical GPS location path
const eLoc = rh.edges.find((e: any) => e.to === 'location-ingest');
if (eLoc) {
  eLoc.retries = 3;
  eLoc.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 300 };
  eLoc.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

const eSpatial = rh.edges.find((e: any) => e.to === 'h3-spatial-index');
if (eSpatial) {
  eSpatial.retries = 3;
  eSpatial.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 300 };
  eSpatial.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

// Workload
rh.workload = {
  entry: 'driver-gateway',
  pattern: 'flash_sale',
  base_rps: 400,
  multiplier: 3.0,
  duration_s: 180,
  ramp_time_s: 25,
};

const before = runChaosSuite(rh);
console.log('RideHailing Before:', before.compositeResilienceScore);

const opt = runAutoHardenOptimizer(rh);
const after = runChaosSuite(opt.greedySolution.spec);
console.log('RideHailing After:', after.compositeResilienceScore, 'Delta:', after.compositeResilienceScore - before.compositeResilienceScore);
console.log('Changes:', opt.greedySolution.changes);
