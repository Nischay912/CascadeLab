import { TEMPLATES_CATALOG } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';

const payments = TEMPLATES_CATALOG['payments'];
const report = runChaosSuite(payments);
console.log('Payments baseline report:');
console.log('weightedMeanScore:', report.weightedMeanScore);
console.log('worstCaseScore:', report.worstCaseScore);
console.log('compositeResilienceScore:', report.compositeResilienceScore);
console.log('\nTop 5 lowest scoring scenarios:');
const sorted = [...report.results].sort((a, b) => a.score - b.score);
for (let i = 0; i < 8; i++) {
  const r = sorted[i];
  console.log(`- ${r.scenario.name}: score=${r.score}, success=${r.avgSuccessDuringIncident}%, recovery=${r.recoveryScore}, metastable=${r.isMetastable}, blast=${r.blastFraction}`);
}
