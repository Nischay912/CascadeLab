import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../src/schema/templates';
import { SimulationEngine } from '../src/sim/engine';
import { analyzeSimulationIncident } from '../src/analysis';

const engNaive = new SimulationEngine(shopFastNaiveTemplate, 42);
const naiveTicks = engNaive.runBatch(180);
const naiveRep = analyzeSimulationIncident(shopFastNaiveTemplate, naiveTicks);

const engHard = new SimulationEngine(shopFastHardenedTemplate, 42);
const hardTicks = engHard.runBatch(180);

const naiveMetastable = naiveRep.isMetastable === true;
const naiveSustainedDown = naiveTicks[130].userSuccessRate < 30;
const hardMinSuccess = Math.min(...hardTicks.map(t => t.userSuccessRate));
const hardPostRecovery = hardTicks[125].userSuccessRate >= 95;

console.log('T19 Assertions:');
console.log(`- Naive metastable failure: ${naiveMetastable ? 'PASS' : 'FAIL'} (isMetastable = ${naiveRep.isMetastable})`);
console.log(`- Naive sustained failure at t=130s: ${naiveSustainedDown ? 'PASS' : 'FAIL'} (success = ${naiveTicks[130].userSuccessRate}%)`);
console.log(`- Hardened min success: ${hardMinSuccess > 5 ? 'PASS' : 'FAIL'} (min success = ${hardMinSuccess}%)`);
console.log(`- Hardened recovery post-fault: ${hardPostRecovery ? 'PASS' : 'FAIL'} (success at t=125s = ${hardTicks[125].userSuccessRate}%)`);
const t19Pass = naiveMetastable && naiveSustainedDown && hardMinSuccess > 5 && hardPostRecovery;
console.log(`T19 Overall: ${t19Pass ? 'PASS' : 'FAIL'}`);
