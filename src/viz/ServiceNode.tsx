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
    sparkline: [20, 22, 21, 24, 20, 23, 21, 22],
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
          bg: 'bg-status-failing/15',
          border: 'border-status-failing/40',
          text: 'FAILING',
          icon: Flame,
        };
      case 'crashed':
        return {
          color: '#6B7280',
          bg: 'bg-status-down/20',
          border: 'border-status-down/50',
          text: 'DOWN',
          icon: XCircle,
        };
      case 'degraded':
        return {
          color: '#FBBF24',
          bg: 'bg-status-degraded/15',
          border: 'border-status-degraded/40',
          text: 'DEGRADED',
          icon: AlertTriangle,
        };
      case 'recovering':
        return {
          color: '#60A5FA',
          bg: 'bg-status-recovering/15',
          border: 'border-status-recovering/40',
          text: 'RECOVERING',
          icon: RotateCw,
        };
      default:
        return {
          color: '#34D399',
          bg: 'bg-status-healthy/15',
          border: 'border-status-healthy/30',
          text: 'HEALTHY',
          icon: CheckCircle2,
        };
    }
  };

  const statusConfig = getStatusConfig(metrics.status);
  const StatusIcon = statusConfig.icon;

  // Utilization Ring calculation
  const util = Math.max(0, metrics.utilizationPct);
  const ringRadius = 13;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (Math.min(100, util) / 100) * circumference;
  const isOverUtilized = util > 100;

  // Mini sparkline SVG path
  const sparkline = metrics.sparkline || [20, 25, 22, 28, 24, 30, 25];
  const maxVal = Math.max(...sparkline, 1);
  const sparkPoints = sparkline
    .map((val, idx) => {
      const px = (idx / (sparkline.length - 1)) * 48;
      const py = 16 - (val / maxVal) * 14;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={`relative w-60 rounded-xl bg-surface border transition-all duration-200 select-none shadow-noc ${
        selected
          ? 'border-accent ring-2 ring-accent/30 bg-surface-raised scale-[1.02]'
          : metrics.isOrigin
          ? 'border-status-failing/80 ring-2 ring-status-failing/30'
          : metrics.status === 'failing'
          ? 'border-status-failing/50'
          : 'border-border hover:border-border-accent'
      }`}
    >
      {/* Root Cause / Origin Alert Badge */}
      {metrics.isOrigin && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-status-failing text-background text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce z-20">
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          <span>ROOT CAUSE?</span>
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
        className="h-1 w-full rounded-t-xl transition-colors duration-300"
        style={{ backgroundColor: statusConfig.color }}
      />

      <div className="p-2.5">
        {/* Header: Icon, Name, Entry badge, Utilization Ring */}
        <div className="flex items-center gap-2 mb-2">
          {/* Service Icon with Utilization Ring */}
          <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center">
            {/* SVG Utilization Ring */}
            <svg className="w-8 h-8 -rotate-90 absolute inset-0">
              <circle
                cx="16"
                cy="16"
                r={ringRadius}
                fill="none"
                stroke="#1F2A44"
                strokeWidth="2.5"
              />
              <circle
                cx="16"
                cy="16"
                r={ringRadius}
                fill="none"
                stroke={statusConfig.color}
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-300 ${isOverUtilized ? 'animate-pulse' : ''}`}
              />
            </svg>
            <div className="w-6 h-6 rounded-md bg-surface-raised border border-border flex items-center justify-center text-accent z-10">
              <Icon className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary truncate tracking-tight font-sans">
                {label}
              </h4>
              {service.entry && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-accent/20 text-accent font-bold">
                  ENTRY
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-text-dim truncate font-mono">
                {service.role || service.id}
              </span>
              <span className="text-[8px] text-text-muted font-mono font-bold tabular-nums">
                ({Math.round(util)}% util)
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics Row: RPS, Latency, Sparkline */}
        <div className="grid grid-cols-2 gap-1.5 py-1.5 border-t border-border/60 text-[10px] font-mono">
          <div>
            <span className="text-[8px] text-text-muted block uppercase">Throughput</span>
            <span className="text-text-primary font-semibold tabular-nums">
              {Math.round(metrics.rps)} <span className="text-text-dim text-[8px]">RPS</span>
            </span>
          </div>
          <div>
            <span className="text-[8px] text-text-muted block uppercase">p95 Latency</span>
            <span
              className={`font-semibold tabular-nums ${
                metrics.latencyMs > 1000 ? 'text-status-failing' : 'text-text-primary'
              }`}
            >
              {Math.round(metrics.latencyMs)} <span className="text-text-dim text-[8px]">ms</span>
            </span>
          </div>
        </div>

        {/* Queue Warning Row (if any backlog) */}
        {metrics.queue > 0 && (
          <div className="flex items-center justify-between py-1 px-1.5 mb-1 rounded bg-orange-500/10 border border-orange-500/20 text-[9px] font-mono">
            <span className="text-orange-400 font-semibold">Queue Backlog:</span>
            <span className="text-orange-400 font-bold tabular-nums">
              {Math.round(metrics.queue)} reqs
            </span>
          </div>
        )}

        {/* Bottom Row: Status Badge & Replica Dots */}
        <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between">
          {/* Status Badge (Icon + Text, never color alone) */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.border}`}
            style={{ color: statusConfig.color }}
          >
            <StatusIcon className="w-2.5 h-2.5" />
            <span>{statusConfig.text}</span>
          </div>

          {/* Replica Dots */}
          <div className="flex items-center gap-1" title={`${metrics.activeInstances} ready, ${metrics.crashedInstances} crashed`}>
            {/* Active ready instances (green) */}
            {Array.from({ length: Math.min(metrics.activeInstances, 6) }).map((_, i) => (
              <span
                key={`ready-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-status-healthy transition-all"
                title="Active ready instance"
              />
            ))}
            {/* Starting instances (pulsing blue) */}
            {Array.from({ length: Math.min(metrics.startingInstances, 3) }).map((_, i) => (
              <span
                key={`start-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"
                title="Starting instance (warming up)"
              />
            ))}
            {/* Crashed instances (gray 'x') */}
            {Array.from({ length: Math.min(metrics.crashedInstances, 4) }).map((_, i) => (
              <span
                key={`crashed-${i}`}
                className="w-2 h-2 rounded-full bg-gray-600 text-[6px] font-bold text-white flex items-center justify-center"
                title="Crashed instance"
              >
                ✕
              </span>
            ))}
            {metrics.activeInstances + metrics.crashedInstances > 6 && (
              <span className="text-[8px] font-mono text-text-dim">
                +{metrics.activeInstances + metrics.crashedInstances - 6}
              </span>
            )}
          </div>

          {/* Mini Sparkline */}
          <div className="w-12 h-4 opacity-70">
            <svg className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={statusConfig.color}
                strokeWidth="1.5"
                points={sparkPoints}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
