import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Server,
  Database,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Cloud,
  Cpu,
  HardDrive,
  ShoppingCart,
  ShieldCheck,
  CreditCard,
  Bell,
  Box,
} from 'lucide-react';
import { CARD_WIDTH, CARD_HEIGHT } from './layoutConstants';

export interface ServiceNodeData {
  service: {
    id: string;
    name: string;
    displayName?: string;
    role?: string;
    entry?: boolean;
    instances: { min: number; max: number; initial: number };
    capacity_rps?: number;
    service_time_ms?: number;
  };
  label: string;
  metrics?: {
    rps: number;
    latencyMs: number;
    utilizationPct: number;
    activeInstances: number;
    crashedInstances: number;
    startingInstances: number;
    queue: number;
    status: 'healthy' | 'degraded' | 'failing' | 'crashed' | 'recovering';
    isOrigin?: boolean;
    sparkline?: number[];
  };
}

const getServiceIcon = (id: string, role?: string) => {
  const lowId = id.toLowerCase();
  const lowRole = (role || '').toLowerCase();

  if (lowId.includes('db') || lowId.includes('database') || lowRole.includes('database')) return Database;
  if (lowId.includes('cache') || lowRole.includes('cache')) return HardDrive;
  if (lowId.includes('pay') || lowRole.includes('payment')) return CreditCard;
  if (lowId.includes('cart') || lowId.includes('order')) return ShoppingCart;
  if (lowId.includes('notif') || lowId.includes('queue')) return Bell;
  if (lowId.includes('auth') || lowRole.includes('auth')) return ShieldCheck;
  if (lowId.includes('gateway') || lowRole.includes('gateway')) return Cloud;
  if (lowId.includes('inventory')) return Box;
  if (lowRole.includes('compute')) return Cpu;
  return Server;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'failing':
      return {
        text: 'FAILING',
        color: '#EF4444',
        border: 'border-status-failing',
        bg: 'bg-status-failing/15',
        icon: XCircle,
      };
    case 'crashed':
      return {
        text: 'CRASHED',
        color: '#6B7280',
        border: 'border-text-dim',
        bg: 'bg-surface-raised',
        icon: XCircle,
      };
    case 'degraded':
      return {
        text: 'DEGRADED',
        color: '#F59E0B',
        border: 'border-status-degraded',
        bg: 'bg-status-degraded/15',
        icon: AlertTriangle,
      };
    case 'recovering':
      return {
        text: 'RECOVERING',
        color: '#3B82F6',
        border: 'border-accent',
        bg: 'bg-accent/15',
        icon: Clock,
      };
    case 'healthy':
    default:
      return {
        text: 'HEALTHY',
        color: '#10B981',
        border: 'border-status-healthy',
        bg: 'bg-status-healthy/15',
        icon: CheckCircle2,
      };
  }
};

export const ServiceNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as ServiceNodeData;
  const { service, label } = nodeData;

  const metrics = nodeData.metrics || {
    rps: 0,
    latencyMs: 15,
    utilizationPct: 20,
    activeInstances: service?.instances?.initial ?? 4,
    crashedInstances: 0,
    startingInstances: 0,
    queue: 0,
    status: 'healthy' as const,
    isOrigin: false,
    sparkline: [15, 15, 15],
  };

  const statusConfig = getStatusConfig(metrics.status);
  const Icon = getServiceIcon(service?.id || '', service?.role);
  const StatusIcon = statusConfig.icon;

  const isSPOF = (service?.instances?.initial ?? 4) <= 1 || (service?.instances?.min ?? 1) <= 1;
  const util = Math.max(0, Math.min(100, Math.round(metrics.utilizationPct)));
  const isOverUtilized = util >= 90;

  const hoverTooltip = `${label} (${service?.role || service?.id})\nStatus: ${statusConfig.text}\nRPS: ${Math.round(metrics.rps)}\np95: ${Math.round(metrics.latencyMs)} ms\nUtilization: ${util}%\nReplicas: ${metrics.activeInstances} ready, ${metrics.crashedInstances} down\nQueue: ${Math.round(metrics.queue)}`;

  return (
    <div
      title={hoverTooltip}
      data-id={service?.id}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={`relative rounded-xl bg-surface border transition-all duration-200 select-none shadow-noc flex flex-col justify-between overflow-hidden ${
        selected
          ? 'border-accent ring-2 ring-accent/40 bg-surface-raised scale-[1.02]'
          : metrics.isOrigin
          ? 'border-status-failing ring-2 ring-status-failing/40'
          : metrics.status === 'failing'
          ? 'border-status-failing/70'
          : metrics.status === 'degraded'
          ? 'border-status-degraded/70'
          : 'border-border hover:border-accent/60'
      }`}
    >
      {/* Root Cause / Origin Alert Badge */}
      {metrics.isOrigin && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-status-failing text-background text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-20">
          <Radio className="w-3 h-3 animate-pulse" />
          <span>ROOT CAUSE</span>
        </div>
      )}

      {/* Target handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-background"
      />

      {/* Source handle on right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-background"
      />

      {/* Top status stripe */}
      <div
        className="h-1 w-full rounded-t-xl transition-colors duration-300 flex-shrink-0"
        style={{ backgroundColor: statusConfig.color }}
      />

      {/* Card Content Container */}
      <div className="p-2.5 flex flex-col justify-between flex-1">
        {/* Row 1: Icon with Ring + Service Name + Status Badge + Util */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Service Icon with Utilization Ring */}
            <div className="relative w-7 h-7 flex-shrink-0 flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90 absolute inset-0">
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="#1F2A44"
                  strokeWidth="2.2"
                />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke={isOverUtilized ? '#EF4444' : statusConfig.color}
                  strokeWidth="2.2"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={2 * Math.PI * 11 - (util / 100) * (2 * Math.PI * 11)}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="w-5 h-5 rounded bg-surface-raised flex items-center justify-center text-accent z-10">
                <Icon className="w-3 h-3" />
              </div>
            </div>

            {/* Service Name + Badges + Util */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h4
                  data-testid="service-name"
                  className="text-[14px] font-bold text-text-primary leading-tight font-sans tracking-tight whitespace-nowrap"
                  title={label}
                >
                  {label}
                </h4>
                {service?.entry && (
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-accent/20 text-accent font-bold leading-none flex-shrink-0">
                    ENTRY
                  </span>
                )}
                {isSPOF && !label.includes('SPOF') && (
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 leading-none flex-shrink-0">
                    SPOF
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-text-dim block leading-tight mt-0.5">
                {util}% util
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wide border flex-shrink-0 ${statusConfig.bg} ${statusConfig.border}`}
            style={{ color: statusConfig.color }}
          >
            <StatusIcon className="w-3 h-3" />
            <span>{statusConfig.text}</span>
          </div>
        </div>

        {/* Row 2: Live Metrics in Light-Colored Boxes (RPS & p95 Latency) */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
          <div className="bg-surface-raised/80 px-2 py-1 rounded border border-border/40">
            <span className="text-[11px] text-text-muted block font-semibold font-mono leading-none">
              RPS
            </span>
            <span className="text-[17px] text-text-primary font-bold font-mono tabular-nums leading-tight block mt-0.5">
              {Math.round(metrics.rps)}
            </span>
          </div>

          <div className="bg-surface-raised/80 px-2 py-1 rounded border border-border/40">
            <span className="text-[11px] text-text-muted block font-semibold font-mono leading-none">
              p95 Latency
            </span>
            <span
              className={`text-[17px] font-bold font-mono tabular-nums leading-tight block mt-0.5 ${
                metrics.latencyMs > 800 ? 'text-status-failing' : 'text-text-primary'
              }`}
            >
              {Math.round(metrics.latencyMs)} ms
            </span>
          </div>
        </div>

        {/* Row 3: Replicas & Queue */}
        <div className="pt-1 border-t border-border/30 flex items-center justify-between text-xs font-mono leading-none">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: Math.min(metrics.activeInstances, 5) }).map((_, i) => (
                <span
                  key={`ready-${i}`}
                  className="w-2.5 h-2.5 rounded-full bg-status-healthy ring-1 ring-background"
                />
              ))}
              {Array.from({ length: Math.min(metrics.crashedInstances, 4) }).map((_, i) => (
                <span
                  key={`crashed-${i}`}
                  className="w-2.5 h-2.5 rounded-full bg-status-failing ring-1 ring-background"
                />
              ))}
            </div>
            <span className="text-xs text-text-dim font-semibold tabular-nums">
              {metrics.activeInstances} ready
              {metrics.crashedInstances > 0 && (
                <span className="text-status-failing"> ({metrics.crashedInstances} down)</span>
              )}
            </span>
          </div>

          <div>
            {metrics.queue > 0 ? (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 tabular-nums">
                Q: {Math.round(metrics.queue)}
              </span>
            ) : (
              <span className="text-text-dim text-xs">Queue: 0</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
