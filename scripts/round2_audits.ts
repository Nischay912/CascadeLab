import { shopFastNaiveTemplate, shopFastHardenedTemplate, TEMPLATES_CATALOG } from '../src/schema/templates';
import { SimulationEngine } from '../src/sim/engine';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';

console.log('=== AUDIT 13: FLEET CAPACITY (READY + DOWN + STARTING = TOTAL) ===');
const eng = new SimulationEngine(shopFastNaiveTemplate, 42);
const ticks = eng.runBatch(180);
[30, 90, 150].forEach(t => {
  let ready = 0, down = 0, starting = 0;
  for (const svc of Object.values(ticks[t].services)) {
    ready += svc.instancesReady;
    down += svc.instancesCrashed;
    starting += svc.instancesStarting;
  }
  const total = ready + down + starting;
  console.log(`t=${t}s: ready=${ready}, down=${down}, starting=${starting} | sum=${total}`);
});

console.log('\n=== AUDIT 11: METASTABLE EXTENSION TO 600S ===');
const eng600 = new SimulationEngine(shopFastNaiveTemplate, 42);
const ticks600 = eng600.runBatch(600);
console.log('Fault period: t=60 to t=120s.');
console.log('Success at t=59 (pre-fault):', ticks600[59].userSuccessRate, '%');
console.log('Success at t=90 (mid-fault):', ticks600[90].userSuccessRate, '%');
console.log('Success at t=121 (fault ends):', ticks600[121].userSuccessRate, '%');
console.log('Success at t=150 (30s after):', ticks600[150].userSuccessRate, '%');
console.log('Success at t=200:', ticks600[200].userSuccessRate, '%');
console.log('Success at t=300:', ticks600[300].userSuccessRate, '%');
console.log('Success at t=450:', ticks600[450].userSuccessRate, '%');
console.log('Success at t=600:', ticks600[600].userSuccessRate, '%');

console.log('\n=== AUDIT 10: HARDENED MIN SUCCESS BREAKDOWN ===');
const engHard = new SimulationEngine(shopFastHardenedTemplate, 42);
const ticksHard = engHard.runBatch(180);
let minHardSuccess = 100;
let minHardT = 0;
for (let t = 0; t <= 180; t++) {
  if (ticksHard[t].userSuccessRate < minHardSuccess) {
    minHardSuccess = ticksHard[t].userSuccessRate;
    minHardT = t;
  }
}
console.log(`Hardened min success: ${minHardSuccess}% at t=${minHardT}s`);
console.log(`Gateway state at t=${minHardT}:`, {
  arrivalRate: ticksHard[minHardT].services['gateway']?.arrivalRate,
  completedRate: ticksHard[minHardT].services['gateway']?.completedRate,
  rejectedRate: ticksHard[minHardT].services['gateway']?.rejectedRate,
  successRate: ticksHard[minHardT].services['gateway']?.successRate,
  queue: ticksHard[minHardT].services['gateway']?.queue,
  p95Ms: ticksHard[minHardT].services['gateway']?.p95Ms,
});
console.log(`Checkout state at t=${minHardT}:`, {
  arrivalRate: ticksHard[minHardT].services['checkout']?.arrivalRate,
  completedRate: ticksHard[minHardT].services['checkout']?.completedRate,
  rejectedRate: ticksHard[minHardT].services['checkout']?.rejectedRate,
  successRate: ticksHard[minHardT].services['checkout']?.successRate,
  queue: ticksHard[minHardT].services['checkout']?.queue,
  p95Ms: ticksHard[minHardT].services['checkout']?.p95Ms,
});
console.log(`Payment provider state at t=${minHardT}:`, {
  arrivalRate: ticksHard[minHardT].services['payment-provider']?.arrivalRate,
  completedRate: ticksHard[minHardT].services['payment-provider']?.completedRate,
  rejectedRate: ticksHard[minHardT].services['payment-provider']?.rejectedRate,
  successRate: ticksHard[minHardT].services['payment-provider']?.successRate,
  p95Ms: ticksHard[minHardT].services['payment-provider']?.p95Ms,
});

console.log('\n=== AUDIT 9: T13 FULL CHAOS SUITE ON 5 TEMPLATES ===');
const templateKeys = ['shopfast', 'ridehailing', 'streaming', 'payments', 'quickcommerce'];
for (const key of templateKeys) {
  const baseSpec = TEMPLATES_CATALOG[key];
  const beforeRes = runChaosSuite(baseSpec);
  // Run optimizer
  const optRes = runAutoHardenOptimizer(baseSpec);
  const bestCandidate = optRes.greedySolution.spec;
  const afterRes = runChaosSuite(bestCandidate);
  console.log(`Template: ${key} | Before: ${beforeRes.compositeResilienceScore} | After: ${afterRes.compositeResilienceScore} | Delta: ${afterRes.compositeResilienceScore - beforeRes.compositeResilienceScore}`);
}
