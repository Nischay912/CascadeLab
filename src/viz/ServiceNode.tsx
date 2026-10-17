import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, Database, Cloud, Zap, Shield, Sparkles } from 'lucide-react';
import { ServiceSpec } from '../schema/architecture';

interface ServiceNodeProps {
  data: {
    service: ServiceSpec;
    label: string;
    metrics?: {
      rps: number;
      latencyMs: number;
      utilizationPct: number;
      activeInstances: number;
      crashedInstances: number;
      status: 'healthy' | 'degraded' | 'failing' | 'crashed';
    };
  };
  selected?: boolean;
}

export const ServiceNode: React.FC<ServiceNodeProps> = ({ data, selected }) => {
  const { service, label } = data;
  const metrics = data.metrics || {
    rps: 0,
    latencyMs: service.service_time_ms,
    utilizationPct: 40,
    activeInstances: service.instances.initial,
    crashedInstances: 0,
    status: 'healthy',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'failing':
      case 'crashed':
        return '#F87171';
      case 'degraded':
        return '#FBBF24';
      default:
        return '#34D399';
    }
  };

  const statusColor = getStatusColor(metrics.status);

  return (
    <div
      className={`relative w-56 rounded-xl bg-surface border transition-all duration-200 select-none shadow-noc ${
        selected
          ? 'border-accent ring-2 ring-accent/30 bg-surface-raised scale-[1.02]'
          : 'border-border hover:border-border-accent'
      }`}
    >
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
        style={{ backgroundColor: statusColor }}
      />

      <div className="p-2.5">
        {/* Header: Icon, Name, Role */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-accent flex-shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-primary truncate tracking-tight">
                {label}
              </h4>
              {service.entry && (
                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-accent/20 text-accent font-bold">
                  ENTRY
                </span>
              )}
            </div>
            <p className="text-[9px] text-text-dim truncate">{service.role || service.id}</p>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 gap-1.5 py-1.5 border-t border-border/60 text-[10px] font-mono">
          <div>
            <span className="text-[8px] text-text-muted block">Throughput</span>
            <span className="text-text-primary font-semibold tabular-nums">
              {Math.round(metrics.rps)} RPS
            </span>
          </div>
          <div>
            <span className="text-[8px] text-text-muted block">Latency</span>
            <span className="text-text-primary font-semibold tabular-nums">
              {Math.round(metrics.latencyMs)} ms
            </span>
          </div>
        </div>

        {/* Replica status dots & Utilisation */}
        <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between">
          {/* Replica dots */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(service.instances.initial, 6) }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ backgroundColor: statusColor }}
                title="Active replica instance"
              />
            ))}
            {service.instances.initial > 6 && (
              <span className="text-[8px] font-mono text-text-dim">
                +{service.instances.initial - 6}
              </span>
            )}
          </div>

          {/* Utilisation badge */}
          <span className="text-[9px] font-mono tabular-nums text-text-muted">
            {Math.round(metrics.utilizationPct)}% util
          </span>
        </div>
      </div>
    </div>
  );
};
