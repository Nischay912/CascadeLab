import { shopFastHardenedTemplate } from '../src/schema/templates';
import { SimulationEngine } from '../src/sim/engine';

console.log('=== PER-SECOND SUCCESS OF HARDENED RUN (t=55 to t=130) ===');
const eng = new SimulationEngine(shopFastHardenedTemplate, 42);
const ticks = eng.runBatch(180);

console.log('Time | Gateway Success | Gateway RPS | Rejections | P95 Latency | S_eff (ms)');
for (let t = 55; t <= 130; t += 5) {
  const tick = ticks[t];
  const gw = tick.services['gateway'];
  console.log(
    `t=${String(t).padStart(3)}s | ` +
    `Success: ${gw.successRate.toFixed(1).padStart(5)}% | ` +
    `Arrival: ${Math.round(gw.arrivalRate).toString().padStart(4)} RPS | ` +
    `Rejected: ${Math.round(gw.rejectedRate).toString().padStart(4)} RPS | ` +
    `p95: ${Math.round(gw.p95Ms).toString().padStart(5)}ms | ` +
    `Seff: ${gw.serviceEffectiveMs.toFixed(1).padStart(6)}ms`
  );
}

console.log('\n=== PER-REQUEST-TYPE SUCCESS BREAKDOWN AT t=69s (PEAK FAULT) ===');
const tick69 = ticks[69];
const edgeAuth = tick69.edges['gateway->auth'];
const edgeCatalog = tick69.edges['gateway->catalog'];
const edgeCart = tick69.edges['gateway->cart'];
const edgeCheckout = tick69.edges['gateway->checkout'];

// Independent route success = (1 - gw.rejectionRatio) * edgeSuccessProb
const gwAdmissionRate = 1.0 - (tick69.services['gateway'].rejectedRate / tick69.services['gateway'].arrivalRate);

console.log(`Gateway Admission Rate (shared worker pool): ${(gwAdmissionRate * 100).toFixed(2)}%`);
console.log(`Auth edge ok: ${((1 - Math.pow(edgeAuth.attemptFailureFraction, 2)) * 100).toFixed(1)}%`);
console.log(`Browse (Catalog) edge ok: ${((1 - Math.pow(edgeCatalog.attemptFailureFraction, 2)) * 100).toFixed(1)}%`);
console.log(`Cart edge ok: ${((1 - Math.pow(edgeCart.attemptFailureFraction, 2)) * 100).toFixed(1)}%`);
console.log(`Checkout edge ok: ${((1 - Math.pow(edgeCheckout.attemptFailureFraction, 2)) * 100).toFixed(1)}%`);

console.log('\nEffective user-perceived success if partitioned by route:');
console.log(`- Browse (60% of mix): ${(gwAdmissionRate * 100).toFixed(1)}% (limited by gateway thread starvation)`);
console.log(`- Cart (25% of mix): ${(gwAdmissionRate * 100).toFixed(1)}% (limited by gateway thread starvation)`);
console.log(`- Checkout (15% of mix): ${(gwAdmissionRate * 0.1 * 100).toFixed(1)}% (limited by gateway starvation AND payment fault)`);
console.log(`- Formula Product Π ok^(p_eff): ${tick69.services['gateway'].successRate.toFixed(1)}%`);
