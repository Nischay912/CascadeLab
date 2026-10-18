import { rideHailingTemplate } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';

const report = runChaosSuite(rideHailingTemplate);
console.log('Ridehailing full chaos report:');
console.log('weightedMeanScore:', report.weightedMeanScore);
console.log('worstCaseScore:', report.worstCaseScore);
console.log('compositeResilienceScore:', report.compositeResilienceScore);
console.log('Number of scenarios:', report.results.length);
const low = report.results.filter(r => r.score < 80);
console.log('Scenarios scoring < 80:');
low.forEach(r => {
  console.log(`- ${r.scenario.name} (weight ${r.scenario.weight}): score=${r.score}, success=${r.avgSuccessDuringIncident}%, recovery=${r.recoveryScore}, metastable=${r.isMetastable}, blast=${r.blastFraction}`);
});
