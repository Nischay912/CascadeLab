import { shopFastNaiveTemplate } from '../src/schema/templates';
import { computeGraphLayout } from '../src/viz/layout';

const layout = computeGraphLayout(shopFastNaiveTemplate, {
  nodeWidth: 260,
  nodeHeight: 96,
  ranksep: 50,
  nodesep: 10,
});

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
layout.nodes.forEach(n => {
  minX = Math.min(minX, n.position.x);
  maxX = Math.max(maxX, n.position.x + 260);
  minY = Math.min(minY, n.position.y);
  maxY = Math.max(maxY, n.position.y + 96);
});

console.log('Bounding box:');
console.log(`width: ${maxX - minX}, height: ${maxY - minY}`);
