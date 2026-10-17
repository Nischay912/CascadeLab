import dagre from 'dagre';
import { ArchitectureSpec } from '../schema/architecture';

export interface LayoutedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    service: ArchitectureSpec['services'][0];
    label: string;
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
}

/**
 * Computes a clean, non-overlapping hierarchical layout for an ArchitectureSpec
 * using dagre's graph layout algorithm with 'LR' (Left-to-Right) rank direction.
 */
export function computeGraphLayout(
  spec: ArchitectureSpec,
  options: {
    rankdir?: 'LR' | 'TB';
    nodeWidth?: number;
    nodeHeight?: number;
    ranksep?: number;
    nodesep?: number;
  } = {}
): LayoutResult {
  const {
    rankdir = 'LR',
    nodeWidth = 240,
    nodeHeight = 110,
    ranksep = 110,
    nodesep = 50,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir,
    ranksep,
    nodesep,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre
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

  // Compute layout
  dagre.layout(dagreGraph);

  // Extract positioned nodes
  const nodes: LayoutedNode[] = spec.services.map((service) => {
    const nodeWithPos = dagreGraph.node(service.id);
    return {
      id: service.id,
      type: 'serviceNode',
      position: {
        x: nodeWithPos.x - nodeWidth / 2,
        y: nodeWithPos.y - nodeHeight / 2,
      },
      data: {
        service,
        label: service.name || service.id.toUpperCase(),
      },
    };
  });

  // Extract edges
  const edges: LayoutedEdge[] = spec.edges.map((edge) => {
    return {
      id: edge.id || `${edge.from}->${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'trafficEdge',
      animated: true,
      data: {
        edge,
      },
    };
  });

  return { nodes, edges };
}
