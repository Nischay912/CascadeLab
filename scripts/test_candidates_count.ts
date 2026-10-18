import { TEMPLATES_CATALOG } from '../src/schema/templates';
import { runChaosSuite } from '../src/chaos/suite';
import { runAutoHardenOptimizer } from '../src/optimizer/optimizer';
import { generateCandidateActions } from '../src/optimizer/candidates';

const templateKeys = ['shopfast', 'ridehailing', 'streaming', 'payments', 'quickcommerce'];
console.log('Testing candidates count for each template:');
for (const key of templateKeys) {
  const spec = TEMPLATES_CATALOG[key];
  const candidates = generateCandidateActions(spec);
  console.log(`- ${key}: ${candidates.length} candidates`);
}
