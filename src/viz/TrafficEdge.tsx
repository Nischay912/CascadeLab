import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import { ShieldCheck, ShieldAlert, RotateCw, AlertCircle } from 'lucide-react';
import { EdgeSpec } from '../schema/architecture';

export interface TrafficEdgeData {
  edge: EdgeSpec;
  isPriorityLabel?: boolean;
  metrics?: {
    effectiveRps: number;
    retryAttempts: number;
    attemptFailureFraction: number;
    circuitBreakerState: 'closed' | 'open' | 'half_open';
    circuitBreakerTimer: number;
  };
}

export const TrafficEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const edgeData = data as TrafficEdgeData | undefined;
  const edgeSpec = edgeData?.edge || {
    from: '',
    to: '',
    retries: 0,
    timeout_ms: 1000,
    mode: 'sync',
    critical: true,
    circuit_breaker: { enabled: false },
  };

  const metrics = edgeData?.metrics || {
    effectiveRps: 0,
    retryAttempts: 1,
    attemptFailureFraction: 0,
    circuitBreakerState: 'closed',
    circuitBreakerTimer: 0,
  };

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isAsync = edgeSpec.mode === 'async';
  const isRetryStorm = metrics.retryAttempts > 1.3 || edgeSpec.retries >= 3;
  const isBreakerOpen = metrics.circuitBreakerState === 'open';
  const isBreakerHalfOpen = metrics.circuitBreakerState === 'half_open';
  const hasHighErrors = metrics.attemptFailureFraction > 0.15;

  // Dynamic stroke thickness proportional to log10(RPS)
  const strokeWidth = selected
    ? 3
    : Math.max(1.5, Math.min(6, 1.2 + Math.log10(Math.max(1, metrics.effectiveRps)) * 1.6));

  // Edge line color
  const edgeColor = selected
    ? '#38BDF8'
    : isBreakerOpen
    ? '#EF4444' // Breaker tripped: red
    : isRetryStorm
    ? '#FB923C' // Orange retry storm flood
    : hasHighErrors
    ? '#EF4444' // Red error line
    : isAsync
    ? '#8A96B0'
    : metrics.effectiveRps > 50
    ? '#22D3EE'
    : '#1F2A44';

  // Show edge labels only on selection, hover, or priority (busiest / failing) edges
  const showLabel = selected || isHovered || Boolean(edgeData?.isPriorityLabel);

  // Position label strictly within the inter-column corridor between source and target
  const midX = (sourceX + targetX) * 0.5;
  const midY = (sourceY + targetY) * 0.5;
  const pillHalfWidth = 26;
  const labelX = Math.max(sourceX + pillHalfWidth + 4, Math.min(targetX - pillHalfWidth - 4, midX));
  const labelY = midY;

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      {/* Invisible wider hit stroke for easy hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="pointer-events-stroke"
      />

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth,
          strokeDasharray: isBreakerOpen ? '4,4' : isAsync ? '6,6' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Edge pill label renderer (solid background, non-overlapping, >= 12px font) */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            data-testid="edge-label"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${Math.round(labelX)}px,${Math.round(labelY)}px)`,
              pointerEvents: 'all',
            }}
            className={`flex items-center gap-1 border px-1.5 py-0.5 rounded text-[12px] font-mono shadow-md cursor-pointer transition-all z-20 whitespace-nowrap leading-none ${
              selected
                ? 'border-accent bg-surface-raised ring-2 ring-accent/40 z-30'
                : isBreakerOpen
                ? 'border-status-failing/80 bg-surface-raised text-status-failing'
                : isRetryStorm
                ? 'border-orange-500/60 bg-surface-raised text-orange-400'
                : 'border-border bg-surface-raised hover:border-accent text-text-primary'
            }`}
            title={`${edgeSpec.from} → ${edgeSpec.to} | Mode: ${edgeSpec.mode} | Timeout: ${edgeSpec.timeout_ms}ms | Load: ${Math.round(metrics.effectiveRps)} RPS`}
          >
            {isBreakerOpen ? (
              <span className="flex items-center gap-1 text-status-failing font-bold animate-pulse text-[12px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CB OPEN</span>
              </span>
            ) : isBreakerHalfOpen ? (
              <span className="flex items-center gap-1 text-status-degraded font-bold text-[12px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>HALF-OPEN</span>
              </span>
            ) : (
              <span className="font-bold tabular-nums text-[12px]">
                {metrics.retryAttempts > 1.2 ? `r:${metrics.retryAttempts.toFixed(1)} ` : ''}
                {metrics.effectiveRps >= 1000
                  ? `${(metrics.effectiveRps / 1000).toFixed(1)}k`
                  : Math.round(metrics.effectiveRps)}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
};
