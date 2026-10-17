import React from 'react';
import {
  Clock,
  Activity,
  Flame,
  CheckCircle,
  Users,
} from 'lucide-react';

interface EventMarker {
  time: number;
  label: string;
  type: 'fault' | 'breaker' | 'crash' | 'recovery';
}

interface BottomTimelineProps {
  currentTime: number;
  maxTime: number;
  onSeek: (time: number) => void;
  successRate: number;
  p95LatencyMs: number;
  externalRps: number;
  internalRps: number;
  activeInstances: number;
  crashedInstances: number;
  markers?: EventMarker[];
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  currentTime,
  maxTime = 180,
  onSeek,
  successRate,
  p95LatencyMs,
  externalRps,
  internalRps,
  activeInstances,
  crashedInstances,
  markers = [
    { time: 60, label: 'Fault Start: Provider Lag 5x', type: 'fault' },
    { time: 82, label: 'Retry Storm Triggered', type: 'crash' },
    { time: 120, label: 'Fault Removed (t=120s)', type: 'recovery' },
  ],
}) => {
  const amplification = externalRps > 0 ? (internalRps / externalRps).toFixed(1) : '1.0';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-28 bg-surface border-t border-border px-4 py-2 flex flex-col justify-between select-none flex-shrink-0 z-30 shadow-noc">
      {/* Top Row: Scrubber Track with Event Markers */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-accent min-w-[70px]">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(currentTime)}</span>
          <span className="text-text-dim text-[10px]">/ {formatTime(maxTime)}</span>
        </div>

        {/* Timeline Track */}
        <div className="relative flex-1 flex items-center h-6">
          {/* Base rail */}
          <div className="w-full h-1.5 bg-surface-raised rounded-full relative overflow-visible border border-border">
            {/* Progress fill */}
            <div
              className="h-full bg-accent rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / maxTime) * 100}%` }}
            />

            {/* Event Markers on rail */}
            {markers.map((m, idx) => {
              const posPercent = (m.time / maxTime) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer z-10"
                  style={{ left: `${posPercent}%` }}
                  onClick={() => onSeek(m.time)}
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 border-background flex items-center justify-center ${
                      m.type === 'fault'
                        ? 'bg-status-failing'
                        : m.type === 'crash'
                        ? 'bg-status-degraded'
                        : 'bg-status-healthy'
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-20">
                    <span className="text-[10px] bg-surface-raised border border-border px-2 py-0.5 rounded shadow text-text-primary font-mono">
                      {m.label} ({m.time}s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invisible interactive input range */}
          <input
            type="range"
            min={0}
            max={maxTime}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
      </div>

      {/* Bottom Row: 4 Metric KPI Mini-Gauges */}
      <div className="grid grid-cols-4 gap-3 pt-1 border-t border-border/50">
        {/* Metric 1: User-Facing Success */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">User Success</span>
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                successRate >= 99
                  ? 'text-status-healthy'
                  : successRate >= 90
                  ? 'text-status-degraded'
                  : 'text-status-failing'
              }`}
            >
              {successRate.toFixed(1)}%
            </span>
          </div>
          <CheckCircle
            className={`w-4 h-4 ${
              successRate >= 99 ? 'text-status-healthy' : 'text-status-failing'
            }`}
          />
        </div>

        {/* Metric 2: p95 Tail Latency */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">p95 Latency</span>
            <span
              className={`text-sm font-bold font-mono tabular-nums ${
                p95LatencyMs <= 800 ? 'text-text-primary' : 'text-status-failing'
              }`}
            >
              {Math.round(p95LatencyMs)} ms
            </span>
          </div>
          <Activity className="w-4 h-4 text-accent" />
        </div>

        {/* Metric 3: RPS & Retry Amplification */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Amplification</span>
              <span
                className={`text-[9px] font-mono px-1 rounded font-bold ${
                  Number(amplification) > 1.5
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                {amplification}×
              </span>
            </div>
            <div className="text-xs font-mono text-text-primary tabular-nums">
              {Math.round(externalRps)} <span className="text-text-dim text-[10px]">in</span> / {Math.round(internalRps)}{' '}
              <span className="text-text-dim text-[10px]">internal</span>
            </div>
          </div>
          <Flame
            className={`w-4 h-4 ${Number(amplification) > 1.5 ? 'text-orange-400' : 'text-text-dim'}`}
          />
        </div>

        {/* Metric 4: Instances Active vs Crashed */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Fleet Capacity</span>
            <div className="text-xs font-mono text-text-primary tabular-nums">
              <span className="text-status-healthy font-bold">{activeInstances} ready</span>
              {crashedInstances > 0 && (
                <span className="text-status-failing font-bold ml-1.5">({crashedInstances} crashed)</span>
              )}
            </div>
          </div>
          <Users className="w-4 h-4 text-text-muted" />
        </div>
      </div>
    </footer>
  );
};
