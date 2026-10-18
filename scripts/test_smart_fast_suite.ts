import { paymentsSwitchTemplate } from '../src/schema/templates';
import { generateCandidateActions } from '../src/optimizer/candidates';
import { runFastResilienceSuite } from '../src/optimizer/fastSuite';
import { runChaosSuite } from '../src/chaos/suite';

const pay = JSON.parse(JSON.stringify(paymentsSwitchTemplate));
// Realistic banking timeouts: 80ms service time with 250ms timeout (instead of 800ms)
for (const e of pay.edges) {
  if (e.to.includes('bank')) {
    e.timeout_ms = 250;
    e.retries = 3;
    e.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 250 };
  }
}
pay.workload = {
  entry: 'upi-switch',
  pattern: 'flash_sale',
  base_rps: 300,
  multiplier: 2.5,
  duration_s: 180,
  ramp_time_s: 20,
};

const baseFast = runFastResilienceSuite(pay);
const baseFull = runChaosSuite(pay);
console.log('Baseline fast score:', baseFast.resilienceScore, 'Full score:', baseFull.compositeResilienceScore);

const cand = generateCandidateActions(pay);
for (const c of cand) {
  const trial = c.apply(pay);
  const fast = runFastResilienceSuite(trial);
  if (fast.resilienceScore > baseFast.resilienceScore) {
    const full = runChaosSuite(trial);
    console.log(`Candidate ${c.id}: Fast=${fast.resilienceScore} (+${fast.resilienceScore - baseFast.resilienceScore}), Full=${full.compositeResilienceScore} (+${full.compositeResilienceScore - baseFull.compositeResilienceScore})`);
  }
}
