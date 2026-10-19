import { shopFastNaiveTemplate } from '../src/schema/templates';
import { CARD_WIDTH, CARD_HEIGHT, COMPACT_CARD_WIDTH, COMPACT_CARD_HEIGHT, RANK_SEP, NODE_SEP, SUBCOL_GAP, MARGIN_X, MARGIN_Y } from '../src/viz/layoutConstants';
import dagre from 'dagre';

function testLayout(spec: any, availWidth: number, availHeight: number) {
  const effectiveTier: 'comfortable' | 'compact' = availWidth < 1600 || availHeight < 700 ? 'compact' : 'comfortable';
  const nodeWidth = effectiveTier === 'compact' ? COMPACT_CARD_WIDTH : CARD_WIDTH;
  const nodeHeight = effectiveTier === 'compact' ? COMPACT_CARD_HEIGHT : CARD_HEIGHT;
  const effectiveNodeSep = effectiveTier === 'compact' ? 10 : 14;
  const effectiveRankSep = effectiveTier === 'compact' ? 95 : 100;
  const effectiveSubcolGap = 16;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    ranksep: effectiveRankSep,
    nodesep: effectiveNodeSep,
    marginx: MARGIN_X,
    marginy: MARGIN_Y,
  });

  spec.services.forEach((s: any) => dagreGraph.setNode(s.id, { width: nodeWidth, height: nodeHeight }));
  spec.edges.forEach((e: any) => dagreGraph.setEdge(e.from, e.to));
  dagre.layout(dagreGraph);

  const rawNodes = spec.services.map((s: any) => {
    const n = dagreGraph.node(s.id);
    return { service: s, x: n.x - nodeWidth / 2, y: n.y - nodeHeight / 2 };
  });

  const rankBuckets: Array<{ baseX: number; nodes: typeof rawNodes }> = [];
  const xSorted = [...rawNodes].sort((a, b) => a.x - b.x);
  for (const n of xSorted) {
    let bucket = rankBuckets.find((b) => Math.abs(b.baseX - n.x) < 30);
    if (!bucket) {
      bucket = { baseX: n.x, nodes: [] };
      rankBuckets.push(bucket);
    }
    bucket.nodes.push(n);
  }
  rankBuckets.sort((a, b) => a.baseX - b.baseX);

  const maxPerCol = Math.max(2, Math.floor((availHeight - 2 * MARGIN_Y + effectiveNodeSep) / (nodeHeight + effectiveNodeSep)));

  let cumulativeShiftX = 0;
  const positionedNodes: any[] = [];

  for (const bucket of rankBuckets) {
    bucket.nodes.sort((a, b) => a.y - b.y);
    const count = bucket.nodes.length;
    const numSubCols = Math.ceil(count / maxPerCol);
    const baseX = bucket.baseX + cumulativeShiftX;

    for (let idx = 0; idx < count; idx++) {
      const subColIdx = Math.floor(idx / maxPerCol);
      const rowIdx = idx % maxPerCol;
      const nodeX = baseX + subColIdx * (nodeWidth + effectiveSubcolGap);
      const nodeY = MARGIN_Y + rowIdx * (nodeHeight + effectiveNodeSep);
      positionedNodes.push({ id: bucket.nodes[idx].service.id, x: nodeX, y: nodeY });
    }
    if (numSubCols > 1) {
      cumulativeShiftX += (numSubCols - 1) * (nodeWidth + effectiveSubcolGap);
    }
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  positionedNodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.x + nodeWidth > maxX) maxX = n.x + nodeWidth;
    if (n.y < minY) minY = n.y;
    if (n.y + nodeHeight > maxY) maxY = n.y + nodeHeight;
  });

  const bboxWidth = maxX - minX + 2 * MARGIN_X;
  const bboxHeight = maxY - minY + 2 * MARGIN_Y;
  const targetZoomX = (availWidth - 24) / bboxWidth;
  const targetZoomY = (availHeight - 24) / bboxHeight;
  let zoom = Math.min(targetZoomX, targetZoomY, 1.0);
  if (zoom < 0.9) zoom = 0.9;

  return { zoom, bboxWidth, bboxHeight, maxPerCol, numCols: rankBuckets.length, tier: effectiveTier };
}

const viewports = [
  { name: '1920x1080', w: 1920 - 300 - 380, h: 1080 - 160 },
  { name: '1920x1040', w: 1920 - 300 - 380, h: 1040 - 160 },
  { name: '1600x900',  w: 1600 - 48 - 360,  h: 900 - 160 },
  { name: '1536x730',  w: 1536 - 48 - 360,  h: 730 - 160 },
  { name: '1440x800',  w: 1440 - 48 - 360,  h: 800 - 160 },
  { name: '1366x650',  w: 1366 - 48 - 0,    h: 650 - 160 },
];

console.log('TEST WITH RANK_SEP = 95:');
for (const vp of viewports) {
  const r = testLayout(shopFastNaiveTemplate, vp.w, vp.h);
  console.log(`${vp.name.padEnd(10)} | Zoom: ${r.zoom.toFixed(3)} | Tier: ${r.tier.padEnd(11)} | Bbox: ${r.bboxWidth}x${r.bboxHeight}`);
}
