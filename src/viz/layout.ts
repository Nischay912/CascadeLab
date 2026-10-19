import dagre from 'dagre';
import { ArchitectureSpec } from '../schema/architecture';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  COMPACT_CARD_WIDTH,
  COMPACT_CARD_HEIGHT,
  RANK_SEP,
  COMPACT_RANK_SEP,
  NODE_SEP,
  COMPACT_NODE_SEP,
  MARGIN_X,
  MARGIN_Y,
} from './layoutConstants';

export interface LayoutedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    service: ArchitectureSpec['services'][0];
    label: string;
    tier?: 'comfortable' | 'compact';
  };
}

export interface LayoutedEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  data: {
    edge: ArchitectureSpec['edges'][0];
  };
}

export interface LayoutResult {
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  bbox: {
    width: number;
    height: number;
    minX: number;
    minY: number;
  };
  zoom: number;
  tier: 'comfortable' | 'compact';
  isFallback: boolean;
}

/**
 * Computes a clean, non-overlapping hierarchical layout for an ArchitectureSpec
 * using Dagre's LR rank layout algorithm with exact rendered card dimensions.
 * Produces the clean 4-column balanced structure from step123-1920x1080.
 */
export function computeGraphLayout(
  spec: ArchitectureSpec,
  options: {
    availWidth?: number;
    availHeight?: number;
    tier?: 'comfortable' | 'compact';
    forceFallback?: boolean;
  } = {}
): LayoutResult {
  const {
    availWidth = 1240,
    availHeight = 800,
    tier: requestedTier,
    forceFallback = false,
  } = options;

  // Decide tier based on available space if not explicitly specified
  const effectiveTier: 'comfortable' | 'compact' =
    requestedTier || (availWidth < 1440 || availHeight < 720 ? 'compact' : 'comfortable');

  const nodeWidth = effectiveTier === 'compact' ? COMPACT_CARD_WIDTH : CARD_WIDTH;
  const nodeHeight = effectiveTier === 'compact' ? COMPACT_CARD_HEIGHT : CARD_HEIGHT;
  const effectiveNodeSep = effectiveTier === 'compact' ? COMPACT_NODE_SEP : NODE_SEP;
  const effectiveRankSep = effectiveTier === 'compact' ? COMPACT_RANK_SEP : RANK_SEP;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    ranksep: effectiveRankSep,
    nodesep: effectiveNodeSep,
    marginx: MARGIN_X,
    marginy: MARGIN_Y,
  });

  // Add nodes to dagre with their EXACT rendered dimensions
  spec.services.forEach((service) => {
    dagreGraph.setNode(service.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to dagre
  spec.edges.forEach((edge) => {
    dagreGraph.setEdge(edge.from, edge.to);
  });

  // Execute Dagre layout
  dagre.layout(dagreGraph);

  // Extract positioned nodes using Dagre's computed coordinates
  const positionedNodes: LayoutedNode[] = spec.services.map((service) => {
    const n = dagreGraph.node(service.id);
    return {
      id: service.id,
      type: 'serviceNode',
      position: {
        x: Math.round(n.x - nodeWidth / 2),
        y: Math.round(n.y - nodeHeight / 2),
      },
      data: {
        service,
        label:
          service.displayName ||
          service.name ||
          service.id.toUpperCase(),
        tier: effectiveTier,
      },
    };
  });

  // Compute graph bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  positionedNodes.forEach((n) => {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.x + nodeWidth > maxX) maxX = n.position.x + nodeWidth;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.y + nodeHeight > maxY) maxY = n.position.y + nodeHeight;
  });

  const bboxWidth = maxX - minX + 2 * MARGIN_X;
  const bboxHeight = maxY - minY + 2 * MARGIN_Y;

  // Zoom calculation
  const targetZoomX = (availWidth - 24) / bboxWidth;
  const targetZoomY = (availHeight - 24) / bboxHeight;
  let optimalZoom = Math.min(targetZoomX, targetZoomY, 1.0);

  // If optimalZoom < 0.9, check compact tier
  let isFallback = forceFallback;
  if (optimalZoom < 0.9 && !forceFallback) {
    if (effectiveTier === 'comfortable') {
      return computeGraphLayout(spec, {
        availWidth,
        availHeight,
        tier: 'compact',
        forceFallback: false,
      });
    } else {
      optimalZoom = 0.9;
      isFallback = true;
    }
  }

  // Format edges
  const edges: LayoutedEdge[] = spec.edges.map((edge) => ({
    id: edge.id || `${edge.from}->${edge.to}`,
    source: edge.from,
    target: edge.to,
    type: 'trafficEdge',
    animated: true,
    data: { edge },
  }));

  return {
    nodes: positionedNodes,
    edges,
    bbox: {
      width: bboxWidth,
      height: bboxHeight,
      minX,
      minY,
    },
    zoom: Math.round(optimalZoom * 1000) / 1000,
    tier: effectiveTier,
    isFallback,
  };
}
