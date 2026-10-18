import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Server,
  Database,
  Cloud,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  XCircle,
  RotateCw,
  Radio,
} from 'lucide-react';
import { ServiceSpec } from '../schema/architecture';

export interface ServiceNodeData {
  service: ServiceSpec;
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

interface ServiceNodeProps {
  data: ServiceNodeData;
  selected?: boolean;
}

export const ServiceNode: React.FC<ServiceNodeProps> = ({ data, selected }) => {
  const { service, label } = data;
  const metrics = data.metrics || {
    rps: 0,
    latencyMs: service.service_time_ms,
    utilizationPct: 20,
    activeInstances: service.instances.initial,
    crashedInstances: 0,
    startingInstances: 0,
    queue: 0,
    status: 'healthy',
    isOrigin: false,
  };

  // Select appropriate icon
  const getIcon = () => {
    if (service.entry) return Zap;
    if (service.id.includes('db') || service.id.includes('postgres') || service.id.includes('sql')) return Database;
    if (service.id.includes('cache') || service.id.includes('redis')) return Database;
    if (service.id.includes('provider') || service.id.includes('external')) return Cloud;
    if (service.id.includes('auth')) return Shield;
    if (service.id.includes('recommender') || service.id.includes('ai')) return Sparkles;
    return Server;
  };

  const Icon = getIcon();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'failing':
        return {
          color: '#F87171',
          bg: 'bg-status-failing/20',
          border: 'border-status-failing/60',
          text: 'FAILING',
          icon: Flame,
        };
      case 'crashed':
        return {
          color: '#9CA3AF',
          bg: 'bg-status-down/30',
          border: 'border-status-down/60',
          text: 'DOWN',
          icon: XCircle,
        };
      case 'degraded':
        return {
          color: '#FBBF24',
          bg: 'bg-status-degraded/20',
          border: 'border-status-degraded/60',
          text: 'DEGRADED',
          icon: AlertTriangle,
        };
      case 'recovering':
        return {
          color: '#60A5FA',
          bg: 'bg-status-recovering/20',
          border: 'border-status-recovering/60',
          text: 'RECOVERING',
          icon: RotateCw,
        };
      default:
        return {
          color: '#34D399',
          bg: 'bg-status-healthy/20',
          border: 'border-status-healthy/50',
          text: 'HEALTHY',
          icon: CheckCircle2,
        };
    }
  };

  const statusConfig = getStatusConfig(metrics.status);
  const StatusIcon = statusConfig.icon;

  // Utilization Ring calculation
  const util = Math.max(0, metrics.utilizationPct);
  const ringRadius = 15;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (Math.min(100, util) / 100) * circumference;
  const isOverUtilized = util > 100;

  const hoverTooltip = `${service.name || label} (${service.role || service.id})\nStatus: ${statusConfig.text}\nRPS: ${Math.round(metrics.rps)}\np95: ${Math.round(metrics.latencyMs)} ms\nUtilization: ${Math.round(util)}%\nQueue Backlog: ${Math.round(metrics.queue)} reqs\nReplicas: ${metrics.activeInstances} ready, ${metrics.crashedInstances} down`;

  return (
    <div
      title={hoverTooltip}
      className={`relative w-[260px] rounded-xl bg-surface border transition-all duration-200 select-none shadow-noc ${
        selected
          ? 'border-accent ring-2 ring-accent/40 bg-surface-raised scale-[1.02]'
          : metrics.isOrigin
          ? 'border-status-failing ring-2 ring-status-failing/40'
          : metrics.status === 'failing'
          ? 'border-status-failing/70'
          : 'border-border hover:border-border-accent'
      }`}
    >
      {/* Root Cause / Origin Alert Badge */}
      {metrics.isOrigin && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-status-failing text-background text-xs font-mono font-bold px-3 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-20">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>ROOT CAUSE</span>
        </div>
      )}

      {/* Target handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-accent !border-2 !border-background"
      />

      {/* Source handle on right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-accent !border-2 !border-background"
      />

      {/* Top status stripe */}
      <div
        className="h-1.5 w-full rounded-t-xl transition-colors duration-300"
        style={{ backgroundColor: statusConfig.color }}
      />

      <div className="p-3 space-y-2">
        {/* Row 1: Utilisation Ring + Icon and Full-Width Service Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Service Icon with Utilization Ring */}
          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center" title={`${Math.round(util)}% utilization`}>
            <svg className="w-8 h-8 -rotate-90 absolute inset-0">
              <circle
                cx="16"
                cy="16"
                r={13}
                fill="none"
                stroke="#1F2A44"
                strokeWidth="2.5"
              />
              <circle
                cx="16"
                cy="16"
                r={13}
                fill="none"
                stroke={isOverUtilized ? '#EF4444' : statusConfig.color}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 - (Math.min(100, util) / 100) * (2 * Math.PI * 13)}
                strokeLinecap="round"
                className={`transition-all duration-300 ${isOverUtilized ? 'animate-pulse' : ''}`}
              />
            </svg>
            <div className="w-6 h-6 rounded bg-surface-raised border border-border flex items-center justify-center text-accent z-10">
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Service Name (Full width with ellipsis + tooltip) */}
          <h4
            className="text-[22px] font-bold text-text-primary truncate tracking-tight font-sans min-w-0 flex-1 leading-tight"
            title={label}
          >
            {label}
          </h4>
        </div>

        {/* Row 2: Dedicated Badges Row (Never overlaps service name) */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            {/* State Badge: text + icon */}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wide border ${statusConfig.bg} ${statusConfig.border}`}
              style={{ color: statusConfig.color }}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusConfig.text}</span>
            </div>

            {service.entry && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold">
                ENTRY
              </span>
            )}

            {(service.instances.initial <= 1 || service.instances.min <= 1) && (
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                SPOF
              </span>
            )}
          </div>

          <div className="text-xs font-mono text-text-dim font-semibold">
            {Math.round(util)}% util
          </div>
        </div>

        {/* Row 3: Live Metrics: RPS, p95 (CSS text-[20px] font-bold) */}
        <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/60">
          <div className="bg-surface-raised/70 px-2 py-1 rounded border border-border/40">
            <span className="text-xs text-text-muted block font-semibold font-mono">RPS</span>
            <span className="text-[20px] text-text-primary font-bold font-mono tabular-nums leading-tight block">
              {Math.round(metrics.rps)}
            </span>
          </div>
          <div className="bg-surface-raised/70 px-2 py-1 rounded border border-border/40">
            <span className="text-xs text-text-muted block font-semibold font-mono">p95 Latency</span>
            <span
              className={`text-[20px] font-bold font-mono tabular-nums leading-tight block ${
                metrics.latencyMs > 1000 ? 'text-status-failing' : 'text-text-primary'
              }`}
            >
              {Math.round(metrics.latencyMs)} ms
            </span>
          </div>
        </div>

        {/* Row 4: Replicas & Queue */}
        <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5" title={`${metrics.activeInstances} ready, ${metrics.crashedInstances} down`}>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(metrics.activeInstances, 5) }).map((_, i) => (
                <span
                  key={`ready-${i}`}
                  className="w-2.5 h-2.5 rounded-full bg-status-healthy ring-1 ring-background"
                />
              ))}
              {Array.from({ length: Math.min(metrics.startingInstances, 2) }).map((_, i) => (
                <span
                  key={`start-${i}`}
                  className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse ring-1 ring-background"
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

          {/* Queue alert if present */}
          {metrics.queue > 0 ? (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 tabular-nums">
              Q: {Math.round(metrics.queue)}
            </span>
          ) : (
            <span className="text-text-dim text-xs">Queue: 0</span>
          )}
        </div>
      </div>
    </div>
  );
};
