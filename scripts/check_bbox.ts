import { shopFastNaiveTemplate } from '../src/schema/templates';
import { computeGraphLayout } from '../src/viz/layout';

const res = computeGraphLayout(shopFastNaiveTemplate, {
  nodeWidth: 240,
  nodeHeight: 84,
  ranksep: 50,
  nodesep: 10,
});

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
res.nodes.forEach(n => {
  minX = Math.min(minX, n.position.x);
  maxX = Math.max(maxX, n.position.x + 240);
  minY = Math.min(minY, n.position.y);
  maxY = Math.max(maxY, n.position.y + 84);
});
console.log('Graph bounding box with nodeWidth=240, ranksep=50, nodesep=10:');
console.log(`width = ${maxX - minX}px, height = ${maxY - minY}px`);
