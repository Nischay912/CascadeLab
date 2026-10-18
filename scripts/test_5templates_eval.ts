import {
  shopFastNaiveTemplate,
  rideHailingTemplate,
  videoStreamingTemplate,
  paymentsSwitchTemplate,
  quickCommerceTemplate,
} from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';

const templates = {
  shopfast: shopFastNaiveTemplate,
  ridehailing: rideHailingTemplate,
  quickcommerce: quickCommerceTemplate,
  streaming: videoStreamingTemplate,
  payments: paymentsSwitchTemplate,
};

console.log('=== FULL CHAOS SUITE EVALUATION ACROSS ALL 5 TEMPLATES ===\n');
let passedCount = 0;

for (const [key, spec] of Object.entries(templates)) {
  const before = runChaosSuite(spec);
  const opt = runAutoHardenOptimizer(spec);
  const after = runChaosSuite(opt.greedySolution.spec);
  const delta = after.compositeResilienceScore - before.compositeResilienceScore;
  const passed = delta >= 25;
  if (passed) passedCount++;

  console.log(`- ${key.toUpperCase()}:`);
  console.log(`    Before: ${before.compositeResilienceScore}/100`);
  console.log(`    After:  ${after.compositeResilienceScore}/100`);
  console.log(`    Delta:  ${delta >= 0 ? '+' : ''}${delta} pts (Requirement >= 25: ${passed ? 'PASS' : 'FAIL'})`);
  console.log(`    Changes applied: ${opt.greedySolution.changes.length}`);
}

console.log(`\nTOTAL PASSING: ${passedCount}/5 templates (Requirement >= 3: ${passedCount >= 3 ? 'PASS' : 'FAIL'})`);
