import { videoStreamingTemplate } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';

const st = JSON.parse(JSON.stringify(videoStreamingTemplate));

// Flaw 1: drm-auth SPOF
const drm = st.services.find((s: any) => s.id === 'drm-auth');
drm.instances = { initial: 1, min: 1, max: 2 };
drm.zone_spread = ['a'];
drm.concurrency = 15;
drm.service_time_ms = 40;
drm.queue_limit = 50;

// Flaw 2: origin-storage SPOF
const origin = st.services.find((s: any) => s.id === 'origin-storage');
origin.instances = { initial: 1, min: 1, max: 2 };
origin.zone_spread = ['a'];
origin.concurrency = 20;
origin.service_time_ms = 50;
origin.queue_limit = 50;

// Gateway
const router = st.services.find((s: any) => s.id === 'edge-router');
router.instances = { initial: 3, min: 2, max: 6 };
router.concurrency = 30;
router.service_time_ms = 8;
router.queue_limit = 150;
router.load_shedding = { enabled: false, threshold: 0.85 };

// Edge retries without backoff or breaker
const eDrm = st.edges.find((e: any) => e.to === 'drm-auth');
if (eDrm) {
  eDrm.retries = 3;
  eDrm.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
  eDrm.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

const eOrigin = st.edges.find((e: any) => e.to === 'origin-storage');
if (eOrigin) {
  eOrigin.retries = 3;
  eOrigin.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
  eOrigin.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

const eManifest = st.edges.find((e: any) => e.to === 'manifest-service');
if (eManifest) {
  eManifest.retries = 2;
  eManifest.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 300 };
  eManifest.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

st.workload = {
  entry: 'edge-router',
  pattern: 'flash_sale',
  base_rps: 400,
  multiplier: 3.0,
  duration_s: 180,
  ramp_time_s: 25,
};

const before = runChaosSuite(st);
console.log('Streaming Before:', before.compositeResilienceScore);

const opt = runAutoHardenOptimizer(st);
const after = runChaosSuite(opt.greedySolution.spec);
console.log('Streaming After:', after.compositeResilienceScore, 'Delta:', after.compositeResilienceScore - before.compositeResilienceScore);
console.log('Changes:', opt.greedySolution.changes);
