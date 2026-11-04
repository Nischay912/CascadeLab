const fs = require('fs');
const path = require('path');

const dir = __dirname;
const componentFiles = [
  'c01_problem.md',
  'c02_objectives.md',
  'c03_methodology.md',
  'c04_wbs.md',
  'c05_network_cpm.md',
  'c06_gantt.md',
  'c07_resources.md',
  'c08_budget.md',
  'c09_risks.md',
  'c10_bmc.md',
  'c11_prototype.md',
  'c12_market.md',
  'c13_outcomes.md',
  'c14_pitch.md'
];

const contents = componentFiles.map(file => {
  const filePath = path.join(dir, file);
  return fs.readFileSync(filePath, 'utf8').trim();
});

const header = `# CascadeLab — Distributed Systems Resilience Digital Twin & Chaos Simulation Platform
## Project Proposal & Entrepreneurial Solution Report
**Course / Assessment:** Alternative Assessment Technique (AAT)  
**Theme:** Real-World Engineering Problem $\\rightarrow$ Technically Feasible & Commercially Viable Solution  
**Team Size:** 4 Students (Information Science & Engineering / Computer Science)  
**Live Production Artifact:** [cascadelab.vercel.app](https://cascadelab.vercel.app)  
**Public Code Repository:** [github.com/Nischay912/CascadeLab](https://github.com/Nischay912/CascadeLab)  
**Team Members:**  
1. **Nischay Kumar** *(Team Lead & Principal Systems Architect)*  
2. **Suchith N** *(Frontend & Visual Graphics Lead)*  
3. **Uday Kumar** *(Chaos Engineering & Static Intelligence Lead)*  
4. **Sthambaj** *(QA, Gamified Sandboxes & Business Modeling Lead)*  
`;

const divider = '\n\n---\n\n';
const fullMarkdown = header + divider + contents.join(divider) + '\n';

const targetPath = path.resolve(dir, '../../all_components_given_till_now.md');
fs.writeFileSync(targetPath, fullMarkdown, 'utf8');

console.log('Successfully compiled all 14 components into:', targetPath);
console.log('Total characters:', fullMarkdown.length);
console.log('Total lines:', fullMarkdown.split('\n').length);
