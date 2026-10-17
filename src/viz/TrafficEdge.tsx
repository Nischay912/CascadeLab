import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react';
import { ShieldCheck, ShieldAlert, RotateCw } from 'lucide-react';
import { EdgeSpec } from '../schema/architecture';

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
  const edgeSpec = (data?.edge as EdgeSpec) || {
    retries: 0,
    timeout_ms: 1000,
    mode: 'sync',
    critical: true,
    circuit_breaker: { enabled: false },
  };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isRetryTrap = edgeSpec.retries >= 3;
  const isAsync = edgeSpec.mode === 'async';

  // Edge line color
  const edgeColor = selected
    ? '#38BDF8'
    : isRetryTrap
    ? '#FB923C' // orange retry alert
    : isAsync
    ? '#8A96B0'
    : '#1F2A44';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: isAsync ? '5,5' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Edge pill label renderer */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center gap-1 bg-surface-raised/90 backdrop-blur border border-border px-1.5 py-0.5 rounded text-[9px] font-mono shadow-sm cursor-pointer hover:border-accent transition-colors"
          title={`${edgeSpec.from} → ${edgeSpec.to} (${edgeSpec.mode}, timeout ${edgeSpec.timeout_ms}ms, ${edgeSpec.retries} retries)`}
        >
          {edgeSpec.retries > 0 && (
            <span
              className={`flex items-center gap-0.5 ${
                isRetryTrap ? 'text-orange-400 font-bold' : 'text-text-muted'
              }`}
            >
              <RotateCw className="w-2.5 h-2.5" />
              <span>{edgeSpec.retries}</span>
            </span>
          )}

          {edgeSpec.circuit_breaker?.enabled ? (
            <span title="Circuit Breaker Active">
              <ShieldCheck className="w-2.5 h-2.5 text-status-healthy" />
            </span>
          ) : edgeSpec.critical && edgeSpec.retries > 1 ? (
            <span title="No Breaker on Critical Path">
              <ShieldAlert className="w-2.5 h-2.5 text-orange-400" />
            </span>
          ) : null}

          <span className="text-text-dim">{edgeSpec.timeout_ms}ms</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
