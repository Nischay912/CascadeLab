import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ServiceNode } from './ServiceNode';
import { TrafficEdge } from './TrafficEdge';
import { ParticleCanvas } from './ParticleCanvas';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { useSimulationStore } from '../state/useSimulationStore';
import {
  Share2,
  Upload,
  Download,
  FileCode,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { exportArchitectureToYaml } from '../schema/importers';

const nodeTypes = {
  serviceNode: ServiceNode,
};

const edgeTypes = {
  trafficEdge: TrafficEdge,
};

const GraphCanvasInner: React.FC<{
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}> = ({ onSelectNode, onSelectEdge }) => {
  const { layout, currentSpec } = useArchitectureStore();
  const { currentMetrics, originNodeId, history, currentTime, effectsEnabled, toggleEffects } =
    useSimulationStore();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges as unknown as Edge[]);

  // Update layout positions when spec changes
  useEffect(() => {
    setNodes(layout.nodes as unknown as Node[]);
    setEdges(layout.edges as unknown as Edge[]);
    setTimeout(() => {
      fitView({ padding: 0.14, duration: 400 });
    }, 60);
  }, [layout, fitView, setNodes, setEdges]);

  // Update node and edge metrics whenever simulation tick (currentMetrics) changes
  useEffect(() => {
    // Build recent history slice for sparklines (last 8 ticks up to currentTime)
    const recentHistory = history.slice(Math.max(0, currentTime - 7), currentTime + 1);

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const svcMetrics = currentMetrics?.services[node.id];
        const svcSpec = (node.data as any)?.service;
        const initialReplicas = svcSpec?.instances?.initial ?? 4;
        const ownServiceTime = svcSpec?.service_time_ms ?? 10;
        const baselineLatency = history[0]?.services[node.id]?.p95Ms ?? ownServiceTime;

        const activeInstances = svcMetrics?.instancesReady ?? initialReplicas;
        const crashedInstances = svcMetrics?.instancesCrashed ?? 0;
        const startingInstances = svcMetrics?.instancesStarting ?? 0;
        const rps = svcMetrics?.arrivalRate ?? 0;
        const latencyMs = svcMetrics?.p95Ms ?? baselineLatency;
        const utilPct = (svcMetrics?.utilization ?? 0.2) * 100;
        const queue = svcMetrics?.queue ?? 0;
        const successRate = svcMetrics?.successRate ?? 100;

        let status: 'healthy' | 'degraded' | 'failing' | 'crashed' | 'recovering' = 'healthy';
        if (activeInstances === 0) {
          status = 'crashed';
        } else if (crashedInstances > 0 || queue > 40 || utilPct >= 95 || successRate < 70) {
          status = 'failing';
        } else if (utilPct >= 80 || queue > 15 || successRate < 95 || (baselineLatency > 0 && latencyMs > Math.max(baselineLatency * 2.2, ownServiceTime + 35))) {
          status = 'degraded';
        } else if (svcMetrics?.cooldownTimer && svcMetrics.cooldownTimer > 0) {
          status = 'recovering';
        }

        const isOrigin =
          originNodeId === node.id &&
          Boolean(currentMetrics?.activeFaults && currentMetrics.activeFaults.length > 0);

        const sparkline =
          recentHistory.length > 0
            ? recentHistory.map((h) => h.services[node.id]?.p95Ms ?? ownServiceTime)
            : [ownServiceTime, ownServiceTime];

        return {
          ...node,
          data: {
            ...node.data,
            metrics: {
              rps,
              latencyMs,
              utilizationPct: utilPct,
              activeInstances,
              crashedInstances,
              startingInstances,
              queue,
              status,
              isOrigin,
              sparkline,
            },
          },
        };
      })
    );

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const edgeMetrics =
          currentMetrics?.edges[edge.id] ||
          currentMetrics?.edges[`${edge.source}->${edge.target}`];

        return {
          ...edge,
          data: {
            ...edge.data,
            metrics: {
              effectiveRps: edgeMetrics?.effectiveRps ?? 0,
              retryAttempts: edgeMetrics?.retryAttempts ?? 1,
              attemptFailureFraction: edgeMetrics?.attemptFailureFraction ?? 0,
              circuitBreakerState: edgeMetrics?.circuitBreakerState ?? 'closed',
              circuitBreakerTimer: edgeMetrics?.circuitBreakerTimer ?? 0,
            },
          },
        };
      })
    );
  }, [currentMetrics, originNodeId, history, currentTime, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        onEdgeClick={(_, edge) => onSelectEdge(edge.id)}
        minZoom={0.2}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        className="bg-background"
      >
        <Background color="#1A243D" gap={20} size={1.5} />
        <Controls className="!bg-surface-raised !border-border !fill-text-primary !shadow-noc [&>button]:!border-border [&>button]:!bg-surface [&>button]:!text-text-primary hover:[&>button]:!bg-surface-hover" />
        <MiniMap
          nodeColor={(node: any) => {
            const status = node.data?.metrics?.status;
            if (status === 'failing') return '#EF4444';
            if (status === 'crashed') return '#6B7280';
            if (status === 'degraded') return '#F59E0B';
            if (status === 'recovering') return '#3B82F6';
            return '#10B981';
          }}
          maskColor="rgba(11, 16, 32, 0.75)"
          className="!bg-surface !border !border-border !rounded-lg overflow-hidden !shadow-noc"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* 60 FPS HTML5 Canvas Overlay for Particles and Failure Wave ripples */}
      <ParticleCanvas
        nodes={nodes}
        edges={edges}
        currentMetrics={currentMetrics}
        originNodeId={originNodeId}
        effectsEnabled={effectsEnabled}
      />

      {/* Floating Architecture Info & Effect Toggle Pill */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <div className="bg-surface/90 backdrop-blur border border-border px-2.5 py-1 rounded-lg shadow-noc pointer-events-none flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse" />
          <span className="text-xs font-bold text-text-primary">{currentSpec.name}</span>
          <span className="text-xs text-text-dim font-mono hidden xl:inline">
            ({currentSpec.services.length} services)
          </span>
        </div>

        {/* Visual Effects Toggle */}
        <button
          onClick={toggleEffects}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border backdrop-blur text-xs font-medium transition-all shadow-noc ${
            effectsEnabled
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-surface/90 border-border text-text-muted hover:text-text-primary'
          }`}
          title="Toggle 60 FPS Particle Flow & Failure Wave ripples"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{effectsEnabled ? 'Particles: ON' : 'Particles: OFF'}</span>
        </button>
      </div>

      {/* Bottom-left Legend */}
      <div className="absolute bottom-4 left-14 flex items-center gap-3 bg-surface/90 backdrop-blur border border-border px-3 py-1.5 rounded-lg shadow-noc text-xs z-10 font-mono">
        <span className="flex items-center gap-1.5 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-status-healthy" /> Healthy
        </span>
        <span className="flex items-center gap-1.5 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-traffic-retry" /> Retry Wave
        </span>
        <span className="flex items-center gap-1.5 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-status-degraded" /> Degraded
        </span>
        <span className="flex items-center gap-1.5 text-text-primary">
          <span className="w-2.5 h-2.5 rounded-full bg-status-failing" /> Failing / Down
        </span>
      </div>
    </div>
  );
};

export const ArchitectureGraph: React.FC<{
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}> = (props) => {
  const { currentSpec, importDockerCompose, importYamlOrJson } = useArchitectureStore();
  const [modalMode, setModalMode] = useState<'import' | 'export' | 'share' | null>(null);
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleOpenExport = () => {
    setInputText(exportArchitectureToYaml(currentSpec));
    setModalMode('export');
  };

  const handleOpenShare = () => {
    setInputText(window.location.href);
    setModalMode('share');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteImport = () => {
    setImportError(null);
    try {
      if (inputText.includes('services:') && inputText.includes('image:')) {
        importDockerCompose(inputText);
      } else {
        importYamlOrJson(inputText);
      }
      setModalMode(null);
    } catch (err: any) {
      setImportError(err.message);
    }
  };

  const sampleDockerCompose = useMemo(
    () => `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api
  api:
    image: node:18-alpine
    deploy:
      replicas: 4
    depends_on:
      - redis
      - db
  redis:
    image: redis:alpine
  db:
    image: postgres:15
    deploy:
      replicas: 1`,
    []
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlowProvider>
        <GraphCanvasInner {...props} />
      </ReactFlowProvider>

      {/* Floating Toolbar: Import, Export, Share */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        <button
          onClick={() => {
            setInputText(sampleDockerCompose);
            setImportError(null);
            setModalMode('import');
          }}
          className="flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-surface-raised backdrop-blur border border-border text-xs font-medium text-text-primary rounded-md shadow-noc transition-colors"
          title="Import from docker-compose.yml, YAML, or JSON"
        >
          <Upload className="w-3 h-3 text-accent" />
          <span>Import</span>
        </button>

        <button
          onClick={handleOpenExport}
          className="flex items-center gap-1 px-2 py-1 bg-surface/90 hover:bg-surface-raised backdrop-blur border border-border text-xs font-medium text-text-primary rounded-md shadow-noc transition-colors"
          title="Export architecture as YAML"
        >
          <Download className="w-3 h-3 text-accent" />
          <span className="hidden xl:inline">Export YAML</span>
          <span className="xl:hidden">Export</span>
        </button>

        <button
          onClick={handleOpenShare}
          className="flex items-center gap-1 px-2 py-1 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-xs font-medium text-accent rounded-md shadow-noc transition-colors"
          title="Share architecture via compressed URL"
        >
          <Share2 className="w-3 h-3" />
          <span className="hidden xl:inline">Share URL</span>
          <span className="xl:hidden">Share</span>
        </button>
      </div>

      {/* Modal Dialog for Import / Export / Share */}
      {modalMode && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-raised">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-text-primary capitalize">
                  {modalMode === 'import'
                    ? 'Import Architecture (Docker Compose / YAML / JSON)'
                    : modalMode === 'export'
                    ? 'Export Architecture YAML'
                    : 'Share Scenario Link'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 font-mono text-xs">
              {modalMode === 'share' ? (
                <div>
                  <label className="text-[11px] text-text-muted block mb-1">
                    Copy the URL below to share this exact architecture, fault injection, and seed:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={inputText}
                    className="w-full bg-background border border-border rounded p-2 text-accent focus:outline-none select-all"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-1 text-[11px] text-text-muted">
                    <span>
                      {modalMode === 'import'
                        ? 'Paste docker-compose.yml or CascadeLab architecture YAML/JSON:'
                        : 'Current Architecture Specification YAML:'}
                    </span>
                    {modalMode === 'import' && (
                      <button
                        onClick={() => setInputText(sampleDockerCompose)}
                        className="text-accent underline text-[10px]"
                      >
                        Load sample docker-compose
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={14}
                    value={inputText}
                    readOnly={modalMode === 'export'}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full bg-background border border-border rounded p-3 text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                  />
                  {importError && (
                    <div className="mt-2 p-2 rounded bg-status-failing/10 border border-status-failing/30 text-status-failing text-[11px]">
                      {importError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-surface-raised flex items-center justify-end gap-2">
              <button
                onClick={() => setModalMode(null)}
                className="px-3 py-1.5 rounded text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              {modalMode === 'import' ? (
                <button
                  onClick={handleExecuteImport}
                  className="px-4 py-1.5 rounded bg-accent text-background font-semibold text-xs hover:brightness-110"
                >
                  Apply & Render Graph
                </button>
              ) : (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-accent text-background font-semibold text-xs hover:brightness-110"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
