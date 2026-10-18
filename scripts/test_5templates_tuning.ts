import { ArchitectureSpec } from '../src/schema/architecture';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';
import {
  shopFastNaiveTemplate,
  rideHailingTemplate,
  videoStreamingTemplate,
  paymentsSwitchTemplate,
  quickCommerceTemplate,
} from '../src/schema/templates';

const testTemplates: Record<string, ArchitectureSpec> = {
  shopfast: JSON.parse(JSON.stringify(shopFastNaiveTemplate)),
  ridehailing: JSON.parse(JSON.stringify(rideHailingTemplate)),
  streaming: JSON.parse(JSON.stringify(videoStreamingTemplate)),
  payments: JSON.parse(JSON.stringify(paymentsSwitchTemplate)),
  quickcommerce: JSON.parse(JSON.stringify(quickCommerceTemplate)),
};

// Tune ridehailing flaws
const rh = testTemplates.ridehailing;
const tripsDb = rh.services.find(s => s.id === 'trips-db')!;
tripsDb.instances = { initial: 1, min: 1, max: 2 };
tripsDb.zone_spread = ['a'];
const rhGw = rh.services.find(s => s.id === 'driver-gateway')!;
rhGw.load_shedding = { enabled: false, threshold: 0.85 };
const edgeMatcher = rh.edges.find(e => e.id === 'driver-gateway->matcher-engine')!;
edgeMatcher.retries = 3;
edgeMatcher.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
edgeMatcher.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };

// Tune streaming flaws
const st = testTemplates.streaming;
const drm = st.services.find(s => s.id === 'drm-auth')!;
drm.instances = { initial: 1, min: 1, max: 2 };
drm.zone_spread = ['a'];
const stGw = st.services.find(s => s.id === 'edge-router')!;
stGw.load_shedding = { enabled: false, threshold: 0.85 };
const edgeDrm = st.edges.find(e => e.to === 'drm-auth')!;
if (edgeDrm) {
  edgeDrm.retries = 3;
  edgeDrm.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
  edgeDrm.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

// Tune quickcommerce flaws
const qc = testTemplates.quickcommerce;
const inv = qc.services.find(s => s.id === 'dark-store-picker')!;
inv.instances = { initial: 1, min: 1, max: 2 };
inv.zone_spread = ['a'];
const qcGw = qc.services.find(s => s.id === 'qc-gateway')!;
qcGw.load_shedding = { enabled: false, threshold: 0.85 };
const edgeQcCheckout = qc.edges.find(e => e.to === 'qc-checkout')!;
if (edgeQcCheckout) {
  edgeQcCheckout.retries = 3;
  edgeQcCheckout.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
  edgeQcCheckout.circuit_breaker = { enabled: false, failure_rate_threshold: 0.5, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 };
}

console.log('Evaluating Full Chaos Suite before and after Auto-Harden:');
for (const [key, spec] of Object.entries(testTemplates)) {
  const before = runChaosSuite(spec);
  const opt = runAutoHardenOptimizer(spec);
  const after = runChaosSuite(opt.greedySolution.spec);
  const delta = after.compositeResilienceScore - before.compositeResilienceScore;
  console.log(`- ${key}: Before=${before.compositeResilienceScore}, After=${after.compositeResilienceScore}, Delta=${delta >= 0 ? '+' : ''}${delta} (Pass >= 25: ${delta >= 25 ? 'YES' : 'NO'})`);
}
