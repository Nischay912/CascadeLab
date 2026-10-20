import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
import { computeGraphLayout } from './layout';
import {
  Share2,
  Upload,
  Download,
  FileCode,
  Copy,
  Check,
  X,
  Sparkles,
  Trash2,
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
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  isSidebarOpen?: boolean;
}> = ({ onSelectNode, onSelectEdge, onOpenImport, onOpenExport, onOpenShare, isSidebarOpen }) => {
  const { currentSpec } = useArchitectureStore();
  const { currentMetrics, originNodeId, history, currentTime, effectsEnabled, toggleEffects } =
    useSimulationStore();
  const { fitView } = useReactFlow();

  const containerRef = useRef<HTMLDivElement>(null);
  const lastDimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1920
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMinimapVisible = windowWidth >= 1440;

  // Recompute layout for container dimensions and center viewport using fitView
  const updateLayoutForContainer = useCallback(
    (availWidth: number, availHeight: number) => {
      if (availWidth <= 100 || availHeight <= 100) return;
      const computed = computeGraphLayout(currentSpec, { availWidth, availHeight });
      setNodes(computed.nodes as unknown as Node[]);
      setEdges(computed.edges as unknown as Edge[]);

      setTimeout(() => {
        fitView({ padding: 0.08, duration: 200 });
      }, 50);
    },
    [currentSpec, setNodes, setEdges, fitView]
  );

  // ResizeObserver on the canvas container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (
          Math.abs(width - lastDimsRef.current.w) > 5 ||
          Math.abs(height - lastDimsRef.current.h) > 5
        ) {
          lastDimsRef.current = { w: width, h: height };
          updateLayoutForContainer(width, height);
        }
      }
    });

    ro.observe(el);
    if (el.clientWidth > 0 && el.clientHeight > 0) {
      lastDimsRef.current = { w: el.clientWidth, h: el.clientHeight };
      updateLayoutForContainer(el.clientWidth, el.clientHeight);
    }

    return () => ro.disconnect();
  }, [updateLayoutForContainer]);

  // Update layout when spec changes
  useEffect(() => {
    if (lastDimsRef.current.w > 100 && lastDimsRef.current.h > 100) {
      updateLayoutForContainer(lastDimsRef.current.w, lastDimsRef.current.h);
    }
  }, [currentSpec, updateLayoutForContainer]);

  // Update node and edge metrics whenever simulation tick changes
  useEffect(() => {
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
        } else if (
          utilPct >= 80 ||
          queue > 15 ||
          successRate < 95 ||
          (baselineLatency > 0 && latencyMs > Math.max(baselineLatency * 2.2, ownServiceTime + 35))
        ) {
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

    setEdges((prevEdges) => {
      const scored = prevEdges.map((edge) => {
        const edgeMetrics =
          currentMetrics?.edges[edge.id] ||
          currentMetrics?.edges[`${edge.source}->${edge.target}`];
        const isBreakerOpen = edgeMetrics?.circuitBreakerState === 'open';
        const failureFrac = edgeMetrics?.attemptFailureFraction ?? 0;
        const rps = edgeMetrics?.effectiveRps ?? 0;
        const score = (isBreakerOpen ? 100000 : 0) + failureFrac * 10000 + rps;
        return { id: edge.id, score, isNotable: isBreakerOpen || failureFrac > 0.05 || rps > 300 };
      });
      scored.sort((a, b) => b.score - a.score);
      const top3Ids = new Set(scored.filter((s) => s.isNotable).slice(0, 3).map((s) => s.id));

      return prevEdges.map((edge) => {
        const edgeMetrics =
          currentMetrics?.edges[edge.id] ||
          currentMetrics?.edges[`${edge.source}->${edge.target}`];

        return {
          ...edge,
          data: {
            ...edge.data,
            isPriorityLabel: top3Ids.has(edge.id),
            metrics: {
              effectiveRps: edgeMetrics?.effectiveRps ?? 0,
              retryAttempts: edgeMetrics?.retryAttempts ?? 1,
              attemptFailureFraction: edgeMetrics?.attemptFailureFraction ?? 0,
              circuitBreakerState: edgeMetrics?.circuitBreakerState ?? 'closed',
              circuitBreakerTimer: edgeMetrics?.circuitBreakerTimer ?? 0,
            },
          },
        };
      });
    });
  }, [currentMetrics, originNodeId, history, currentTime, setNodes, setEdges]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Header Strip outside the ReactFlow canvas (data-testid="canvas-toolbar") */}
      <div
        data-testid="canvas-toolbar"
        className="h-9 min-h-[36px] px-3 bg-surface border-b border-border flex items-center justify-between select-none z-10 flex-shrink-0 whitespace-nowrap overflow-hidden gap-2"
      >
        {/* Left: Spec info + visual effects toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-status-healthy animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-text-primary truncate max-w-[160px]">{currentSpec.name}</span>
            <span className="text-xs text-text-dim font-mono hidden xl:inline flex-shrink-0">
              ({currentSpec.services.length} services)
            </span>
          </div>
          <button
            onClick={toggleEffects}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-all flex-shrink-0 whitespace-nowrap ${
              effectsEnabled
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-surface-raised border-border text-text-muted hover:text-text-primary'
            }`}
            title="Toggle 60 FPS Particle Flow & Failure Wave ripples"
          >
            <Sparkles className="w-3 h-3" />
            <span>{effectsEnabled ? 'Particles: ON' : 'Particles: OFF'}</span>
          </button>
        </div>

        {/* Center: Canvas Legend (data-testid="canvas-legend") */}
        <div
          data-testid="canvas-legend"
          className="hidden md:flex items-center gap-2 lg:gap-3 text-[11px] font-mono text-text-muted flex-shrink-0 whitespace-nowrap"
        >
          <span className="flex items-center gap-1 text-text-primary whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-status-healthy" /> Healthy
          </span>
          <span className="flex items-center gap-1 text-text-primary whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-traffic-retry" /> Retries
          </span>
          <span className="flex items-center gap-1 text-text-primary whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-status-degraded" /> Degraded
          </span>
          <span className="flex items-center gap-1 text-text-primary whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-status-failing" /> Failing
          </span>
        </div>

        {/* Right: Import / Export / Share */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pr-1">
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-surface-raised hover:bg-surface-hover border border-border text-[11px] font-medium text-text-primary rounded transition-colors whitespace-nowrap"
            title="Import from docker-compose.yml, YAML, or JSON"
          >
            <Upload className="w-3.5 h-3.5 text-accent" />
            {!isSidebarOpen && <span className="hidden sm:inline">Import</span>}
          </button>
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-surface-raised hover:bg-surface-hover border border-border text-[11px] font-medium text-text-primary rounded transition-colors whitespace-nowrap"
            title="Export architecture as YAML"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            {!isSidebarOpen && <span className="hidden sm:inline">Export</span>}
          </button>
          <button
            onClick={onOpenShare}
            className={`flex items-center gap-1 py-0.5 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-[11px] font-medium text-accent rounded transition-colors whitespace-nowrap ${
              isSidebarOpen ? 'px-2' : 'px-2 sm:px-2.5'
            }`}
            title="Share architecture via compressed URL"
          >
            <Share2 className="w-3.5 h-3.5" />
            {!isSidebarOpen && <span>Share</span>}
          </button>
        </div>
      </div>

      {/* ReactFlow Canvas Container */}
      <div ref={containerRef} className="flex-1 w-full h-full relative overflow-hidden">
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
          {isMinimapVisible && (
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
              style={{ width: 160, height: 100 }}
              className="!bg-surface !border !border-border !rounded-lg overflow-hidden !shadow-noc"
              zoomable
              pannable
            />
          )}
        </ReactFlow>

        {/* 60 FPS HTML5 Canvas Overlay for Particles and Failure Wave ripples */}
        <ParticleCanvas
          nodes={nodes}
          edges={edges}
          currentMetrics={currentMetrics}
          originNodeId={originNodeId}
          effectsEnabled={effectsEnabled}
        />
      </div>
    </div>
  );
};

export const ArchitectureGraph: React.FC<{
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  isSidebarOpen?: boolean;
}> = (props) => {
  const { currentSpec, importDockerCompose, importYamlOrJson } = useArchitectureStore();
  const [modalMode, setModalMode] = useState<'import' | 'export' | 'share' | null>(null);
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<
    'yaml_boilerplate' | 'yaml_paynex' | 'compose_basic' | 'compose_fleet' | 'custom'
  >('yaml_boilerplate');

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

  const sampleArchitectureYaml = useMemo(
    () => `# =========================================================================
# CascadeLab Architecture Specification Boilerplate
# =========================================================================
# Use this boilerplate to simulate and monitor your microservices topology.
# Adjust services, edges, queue depths, SLOs, and resilience policies.

name: "Enterprise Microservices Platform"
description: "Distributed cloud microservice topology with autoscaling and circuit breakers."

# 1. Target Service Level Objectives (SLOs)
slo:
  success_pct: 99.5       # Availability target (e.g. 99.5%)
  p95_ms: 500             # Target p95 latency ceiling in ms
value_per_request_inr: 50 # Revenue earned per successful transaction in ₹

# 2. Offered Workload & Entry Ingress
workload:
  entry: "api-gateway"    # ID of the service receiving user requests
  pattern: "constant"     # Options: constant, ramp, spike, diurnal, flash_sale
  base_rps: 600           # Steady-state offered requests per second
  multiplier: 1.0         # Traffic surge multiplier (e.g. 2.5 for surge)
  duration_s: 180         # Total simulation window in seconds
  ramp_time_s: 30         # Duration of initial ramp phase

# 3. Microservice Fleet
services:
  - id: "api-gateway"
    name: "API Gateway"
    role: "Edge Ingress & Routing"
    entry: true
    # Optional canvas coordinate. Remove 'position' to enable Dagre auto-layout.
    position: { x: 100, y: 180 }
    instances:
      initial: 4          # Starting replicas
      min: 2              # Min autoscaling floor
      max: 12             # Max scaling ceiling
    concurrency: 50       # Worker concurrency slots per replica
    service_time_ms: 8    # Own compute latency (excluding dependencies)
    queue_limit: 250      # Request buffer depth per replica
    load_shedding:
      enabled: true       # Drop excess low-priority requests during saturation
      threshold: 0.85     # Queue saturation ratio (0.1 - 1.0)
    autoscale:
      enabled: true
      target_util: 0.65   # Target worker utilization (65%)
      eval_period_s: 10   # Metric evaluation window (seconds)
      startup_delay_s: 15 # Pod cold-boot startup delay
      cooldown_s: 60      # Downscale cooldown delay
    crash:
      enabled: true
      after_overload_s: 20
      restart_delay_s: 30
    cost_inr_per_instance_month: 2500
    zone_spread: ["a", "b"]

  - id: "order-service"
    name: "Order Processing Service"
    role: "Core Business Logic"
    position: { x: 400, y: 100 }
    instances: { initial: 3, min: 2, max: 8 }
    concurrency: 30
    service_time_ms: 25
    queue_limit: 150
    load_shedding: { enabled: true, threshold: 0.80 }
    autoscale: { enabled: true, target_util: 0.70, eval_period_s: 15, startup_delay_s: 20, cooldown_s: 90 }
    cost_inr_per_instance_month: 3200
    zone_spread: ["a", "b"]

  - id: "redis-cache"
    name: "Redis State Cache"
    role: "In-Memory Session & Catalog Cache"
    position: { x: 700, y: 60 }
    instances: { initial: 2, min: 2, max: 4 }
    concurrency: 80
    service_time_ms: 3
    queue_limit: 500
    cost_inr_per_instance_month: 1800
    zone_spread: ["a", "b"]

  - id: "orders-db"
    name: "PostgreSQL Database"
    role: "Relational ACID Store"
    position: { x: 700, y: 220 }
    instances: { initial: 2, min: 2, max: 4 }
    concurrency: 40
    service_time_ms: 18
    queue_limit: 200
    cost_inr_per_instance_month: 6000
    zone_spread: ["a", "b"]

  - id: "payment-gateway"
    name: "Payment Partner API"
    role: "External Settlement Provider"
    position: { x: 1000, y: 180 }
    instances: { initial: 2, min: 2, max: 4 }
    concurrency: 25
    service_time_ms: 80
    queue_limit: 100
    cost_inr_per_instance_month: 0
    zone_spread: ["a"]

# 4. Directed Call Graph & Resilience Policies
edges:
  - from: "api-gateway"
    to: "order-service"
    calls_per_request: 1.0
    mode: "sync"          # sync or async
    critical: true        # If callee fails, does caller fail?
    timeout_ms: 600       # Deadline timeout
    retries: 2            # Retries on failure
    backoff:
      mode: "exponential" # none, fixed, or exponential
      jitter: true        # Random jitter to prevent retry storms
      base_delay_ms: 50
      max_delay_ms: 500
    circuit_breaker:
      enabled: true
      failure_rate_threshold: 0.40
      min_calls: 10
      open_duration_s: 15
      probe_fraction: 0.1

  - from: "order-service"
    to: "redis-cache"
    calls_per_request: 2.0
    mode: "sync"
    critical: false       # Soft dependency: fallback to DB if cache misses
    timeout_ms: 100
    retries: 1
    cache:
      hit_ratio: 0.80     # Absorbs 80% of read traffic
      warm_time_s: 20

  - from: "order-service"
    to: "orders-db"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 500
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 30, max_delay_ms: 300 }
    bulkhead_max_concurrent: 25

  - from: "order-service"
    to: "payment-gateway"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 1200
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 100, max_delay_ms: 1000 }
    circuit_breaker:
      enabled: true
      failure_rate_threshold: 0.35
      min_calls: 5
      open_duration_s: 20
      probe_fraction: 0.1

seed: 42
`,
    []
  );

  const samplePayNexYaml = useMemo(
    () => `# =========================================================================
# PayNex: Enterprise UPI & Digital Payment Switch Network
# =========================================================================
name: "PayNex Payment Switch"
description: "Core banking UPI / Card transaction switch with real-time ML fraud scoring and HSM encryption."

slo:
  success_pct: 99.9
  p95_ms: 400

value_per_request_inr: 120

workload:
  entry: "pay-gateway"
  pattern: "diurnal"
  base_rps: 500
  multiplier: 1.0
  duration_s: 180
  ramp_time_s: 20

services:
  - id: "pay-gateway"
    name: "Edge API Gateway"
    role: "TLS Termination & Rate Limiter"
    entry: true
    position: { x: 80, y: 190 }
    instances: { initial: 5, min: 3, max: 15 }
    concurrency: 60
    service_time_ms: 6
    queue_limit: 300
    load_shedding: { enabled: true, threshold: 0.85 }
    autoscale: { enabled: true, target_util: 0.65, eval_period_s: 10, startup_delay_s: 15, cooldown_s: 60 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 3000
    zone_spread: ["a", "b"]

  - id: "auth-token-svc"
    name: "Token Auth Vault"
    role: "OAuth2 & API Key Verification"
    position: { x: 380, y: 80 }
    instances: { initial: 3, min: 2, max: 8 }
    concurrency: 50
    service_time_ms: 10
    queue_limit: 200
    load_shedding: { enabled: true, threshold: 0.85 }
    autoscale: { enabled: true, target_util: 0.70, eval_period_s: 15, startup_delay_s: 20, cooldown_s: 90 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 2500
    zone_spread: ["a", "b"]

  - id: "switch-orchestrator"
    name: "Payment Switch Core"
    role: "Transaction Routing & State Machine"
    position: { x: 380, y: 300 }
    instances: { initial: 6, min: 3, max: 14 }
    concurrency: 40
    service_time_ms: 18
    queue_limit: 250
    load_shedding: { enabled: true, threshold: 0.80 }
    autoscale: { enabled: true, target_util: 0.65, eval_period_s: 10, startup_delay_s: 15, cooldown_s: 60 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 4500
    zone_spread: ["a", "b"]

  - id: "fraud-engine"
    name: "ML Fraud Engine"
    role: "Velocity Check & Risk Scoring"
    position: { x: 680, y: 40 }
    instances: { initial: 4, min: 2, max: 10 }
    concurrency: 35
    service_time_ms: 32
    queue_limit: 180
    load_shedding: { enabled: true, threshold: 0.75 }
    autoscale: { enabled: true, target_util: 0.60, eval_period_s: 10, startup_delay_s: 20, cooldown_s: 60 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 5500
    zone_spread: ["a", "b"]

  - id: "idempotency-cache"
    name: "Idempotency Redis"
    role: "Duplicate Request Deduplication"
    position: { x: 680, y: 200 }
    instances: { initial: 3, min: 2, max: 6 }
    concurrency: 90
    service_time_ms: 2
    queue_limit: 600
    load_shedding: { enabled: false, threshold: 0.8 }
    autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 2200
    zone_spread: ["a", "b"]

  - id: "account-ledger-db"
    name: "Core Ledger DB"
    role: "ACID Double-Entry PostgreSQL"
    position: { x: 680, y: 360 }
    instances: { initial: 3, min: 2, max: 6 }
    concurrency: 45
    service_time_ms: 14
    queue_limit: 250
    load_shedding: { enabled: false, threshold: 0.8 }
    autoscale: { enabled: true, target_util: 0.70, eval_period_s: 15, startup_delay_s: 30, cooldown_s: 120 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 8000
    zone_spread: ["a", "b"]

  - id: "hsm-vault"
    name: "HSM Crypto Enclave"
    role: "PIN Encryption & Signature Verification"
    position: { x: 980, y: 120 }
    instances: { initial: 3, min: 2, max: 6 }
    concurrency: 30
    service_time_ms: 22
    queue_limit: 150
    load_shedding: { enabled: true, threshold: 0.85 }
    autoscale: { enabled: true, target_util: 0.70, eval_period_s: 15, startup_delay_s: 20, cooldown_s: 90 }
    crash: { enabled: true, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 7000
    zone_spread: ["a", "b"]

  - id: "clearing-network"
    name: "National Clearing Switch"
    role: "External Settlement Network (NPCI/Visa)"
    position: { x: 980, y: 280 }
    instances: { initial: 4, min: 2, max: 8 }
    concurrency: 30
    service_time_ms: 65
    queue_limit: 150
    load_shedding: { enabled: false, threshold: 0.8 }
    autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 }
    crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 }
    cost_inr_per_instance_month: 0
    zone_spread: ["a"]

edges:
  - from: "pay-gateway"
    to: "auth-token-svc"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 300
    retries: 2
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 25, max_delay_ms: 200 }
    circuit_breaker: { enabled: true, failure_rate_threshold: 0.35, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 }

  - from: "pay-gateway"
    to: "switch-orchestrator"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 1200
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 50, max_delay_ms: 400 }
    circuit_breaker: { enabled: true, failure_rate_threshold: 0.40, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 }

  - from: "switch-orchestrator"
    to: "fraud-engine"
    calls_per_request: 1.0
    mode: "sync"
    critical: false
    timeout_ms: 350
    retries: 1
    backoff: { mode: "fixed", jitter: true, base_delay_ms: 40, max_delay_ms: 100 }
    circuit_breaker: { enabled: true, failure_rate_threshold: 0.30, min_calls: 10, open_duration_s: 15, probe_fraction: 0.1 }

  - from: "switch-orchestrator"
    to: "idempotency-cache"
    calls_per_request: 1.5
    mode: "sync"
    critical: false
    timeout_ms: 80
    retries: 1
    cache: { hit_ratio: 0.85, warm_time_s: 15 }

  - from: "switch-orchestrator"
    to: "account-ledger-db"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 600
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 30, max_delay_ms: 250 }
    bulkhead_max_concurrent: 35

  - from: "switch-orchestrator"
    to: "hsm-vault"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 400
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 40, max_delay_ms: 300 }
    bulkhead_max_concurrent: 25

  - from: "switch-orchestrator"
    to: "clearing-network"
    calls_per_request: 1.0
    mode: "sync"
    critical: true
    timeout_ms: 1500
    retries: 1
    backoff: { mode: "exponential", jitter: true, base_delay_ms: 100, max_delay_ms: 800 }
    circuit_breaker: { enabled: true, failure_rate_threshold: 0.30, min_calls: 5, open_duration_s: 20, probe_fraction: 0.1 }

seed: 42
`,
    []
  );

  const sampleDockerComposeBasic = useMemo(
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

  const sampleDockerComposeFleet = useMemo(
    () => `version: '3.8'

services:
  gateway:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 4
    depends_on:
      - auth-service
      - catalog-service
      - checkout-service

  auth-service:
    image: node:18-alpine
    deploy:
      replicas: 3
    depends_on:
      - redis-cache

  catalog-service:
    image: python:3.11-slim
    deploy:
      replicas: 4
    depends_on:
      - redis-cache
      - products-db

  checkout-service:
    image: golang:1.22-alpine
    deploy:
      replicas: 3
    depends_on:
      - payments-service
      - orders-db

  payments-service:
    image: node:18-alpine
    deploy:
      replicas: 3
    depends_on:
      - payment-gw

  redis-cache:
    image: redis:7-alpine
    deploy:
      replicas: 2

  products-db:
    image: postgres:16-alpine
    deploy:
      replicas: 2

  orders-db:
    image: postgres:16-alpine
    deploy:
      replicas: 2

  payment-gw:
    image: nginx:alpine
    deploy:
      replicas: 2`,
    []
  );

  return (
    <div className="w-full h-full relative">
      <ReactFlowProvider>
        <GraphCanvasInner
          {...props}
          onOpenImport={() => {
            setActiveSampleId('yaml_boilerplate');
            setInputText(sampleArchitectureYaml);
            setImportError(null);
            setModalMode('import');
          }}
          onOpenExport={handleOpenExport}
          onOpenShare={handleOpenShare}
        />
      </ReactFlowProvider>

      {/* Modal Dialog for Import / Export / Share */}
      {modalMode && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 text-[11px] text-text-muted">
                    <span className="font-medium text-text-primary">
                      {modalMode === 'import'
                        ? 'Paste CascadeLab Architecture YAML/JSON or docker-compose.yml:'
                        : 'Current Architecture Specification YAML:'}
                    </span>
                    {modalMode === 'import' && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Type 1: CascadeLab Architecture YAML Examples */}
                        <div className="flex items-center bg-surface border border-border rounded p-0.5 gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5">YAML:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSampleId('yaml_boilerplate');
                              setInputText(sampleArchitectureYaml);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                              activeSampleId === 'yaml_boilerplate'
                                ? 'bg-accent text-background font-bold shadow-sm'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
                            }`}
                          >
                            Full Boilerplate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSampleId('yaml_paynex');
                              setInputText(samplePayNexYaml);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                              activeSampleId === 'yaml_paynex'
                                ? 'bg-accent text-background font-bold shadow-sm'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
                            }`}
                          >
                            PayNex Fintech Example
                          </button>
                        </div>

                        {/* Type 2: Docker Compose Examples */}
                        <div className="flex items-center bg-surface border border-border rounded p-0.5 gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim px-1.5">Docker:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSampleId('compose_basic');
                              setInputText(sampleDockerComposeBasic);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                              activeSampleId === 'compose_basic'
                                ? 'bg-accent text-background font-bold shadow-sm'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
                            }`}
                          >
                            Basic Stack
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSampleId('compose_fleet');
                              setInputText(sampleDockerComposeFleet);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                              activeSampleId === 'compose_fleet'
                                ? 'bg-accent text-background font-bold shadow-sm'
                                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
                            }`}
                          >
                            Fleet Example
                          </button>
                        </div>

                        {/* Clear / Delete Content Action */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSampleId('custom');
                            setInputText('');
                          }}
                          className="px-2 py-0.5 rounded bg-surface border border-border text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-1 transition-all"
                          title="Clear all text in editor"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    rows={18}
                    value={inputText}
                    readOnly={modalMode === 'export'}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setActiveSampleId('custom');
                    }}
                    placeholder="Paste your CascadeLab architecture YAML / JSON or docker-compose.yml here..."
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
