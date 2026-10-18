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

  const [edgePath, labelX, labelY] = getBezierPath({
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

  // Show edge labels only on selection, active circuit breaker, retry storm, or high throughput
  const showLabel =
    selected ||
    isBreakerOpen ||
    isBreakerHalfOpen ||
    metrics.effectiveRps >= 1000 ||
    metrics.retryAttempts > 1.3 ||
    metrics.attemptFailureFraction > 0.15;

  return (
    <>
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

      {/* Edge pill label renderer (>= 12px font, non-overlapping) */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`flex items-center gap-1.5 backdrop-blur border px-2.5 py-1 rounded-md text-xs font-mono shadow-md cursor-pointer transition-all ${
              selected
                ? 'border-accent bg-surface-raised ring-2 ring-accent/40 z-30'
                : isBreakerOpen
                ? 'border-status-failing/80 bg-status-failing/20 text-status-failing z-20'
                : isRetryStorm
                ? 'border-orange-500/60 bg-surface-raised text-orange-400 z-10'
                : 'border-border bg-surface-raised/95 hover:border-accent text-text-primary'
            }`}
            title={`${edgeSpec.from} → ${edgeSpec.to} | Mode: ${edgeSpec.mode} | Timeout: ${edgeSpec.timeout_ms}ms | Load: ${Math.round(metrics.effectiveRps)} RPS`}
          >
            {/* Circuit Breaker status badge */}
            {isBreakerOpen ? (
              <span className="flex items-center gap-1 text-status-failing font-bold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CB: OPEN ({metrics.circuitBreakerTimer}s)</span>
              </span>
            ) : isBreakerHalfOpen ? (
              <span className="flex items-center gap-1 text-status-degraded font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CB: HALF-OPEN</span>
              </span>
            ) : edgeSpec.circuit_breaker?.enabled ? (
              <span title="Circuit Breaker Armed (Closed)">
                <ShieldCheck className="w-3.5 h-3.5 text-status-healthy" />
              </span>
            ) : edgeSpec.critical && edgeSpec.retries > 1 ? (
              <span title="Unprotected Critical Dependency (No Breaker)">
                <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              </span>
            ) : null}

            {/* Retry multiplier */}
            {metrics.retryAttempts > 1.1 ? (
              <span
                className="flex items-center gap-1 text-orange-400 font-bold"
                title={`${metrics.retryAttempts.toFixed(2)}x retry multiplier`}
              >
                <RotateCw className="w-3 h-3" />
                <span>{metrics.retryAttempts.toFixed(1)}×</span>
              </span>
            ) : edgeSpec.retries > 0 ? (
              <span className="text-text-muted" title={`Configured retries: ${edgeSpec.retries}`}>
                r:{edgeSpec.retries}
              </span>
            ) : null}

            {/* Failure rate percentage */}
            {metrics.attemptFailureFraction > 0.05 && (
              <span className="text-status-failing font-bold">
                {Math.round(metrics.attemptFailureFraction * 100)}% fail
              </span>
            )}

            {/* Throughput */}
            {metrics.effectiveRps > 0 && (
              <span className="text-text-primary font-bold tabular-nums">
                {Math.round(metrics.effectiveRps)} RPS
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
