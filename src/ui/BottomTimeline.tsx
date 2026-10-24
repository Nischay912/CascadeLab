import React from 'react';
import {
  Clock,
  Activity,
  Flame,
  CheckCircle,
  Users,
  Play,
  Pause,
  RotateCcw,
  StepForward,
} from 'lucide-react';
import { SimulationTickMetrics } from '../sim/engine';

export interface EventMarker {
  time: number;
  label: string;
  type: 'fault' | 'breaker' | 'crash' | 'recovery';
}

interface BottomTimelineProps {
  currentTime: number;
  maxTime: number;
  onSeek: (time: number) => void;
  isRunning?: boolean;
  onToggleRun?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  speed?: number;
  onChangeSpeed?: (speed: number) => void;
  currentMetrics: SimulationTickMetrics | null;
  history?: SimulationTickMetrics[];
  markers?: EventMarker[];
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  currentTime,
  maxTime = 180,
  onSeek,
  isRunning = false,
  onToggleRun,
  onStep,
  onReset,
  speed = 1,
  onChangeSpeed,
  currentMetrics,
  history = [],
  markers,
}) => {
  const successRate = currentMetrics?.userSuccessRate ?? 99.2;
  const p95LatencyMs = currentMetrics?.userP95Ms ?? 410;
  const externalRps = currentMetrics?.entryRps ?? 600;
  const internalRps = currentMetrics?.totalInternalRps ?? 600;
  const activeInstances = currentMetrics?.activeInstances ?? 36;
  const crashedInstances = currentMetrics?.crashedInstances ?? 0;
  const baselineEntryRps = history[0]?.entryRps || 600;
  const baselineInternalRps = history[0]?.totalInternalRps || 2500;
  const baselineFanout = baselineEntryRps > 0 ? baselineInternalRps / baselineEntryRps : 4.2;

  // Retry Amplification = internal load / baseline internal load for the same workload (~1.0x when healthy)
  const expectedNominalInternalRps = externalRps * baselineFanout;
  const retryAmplificationNum = expectedNominalInternalRps > 0 ? internalRps / expectedNominalInternalRps : 1.0;
  const retryAmplification = retryAmplificationNum.toFixed(1);

  // Dynamic event markers (fault strike, recovery, workload surge onset)
  const effectiveMarkers: EventMarker[] = markers !== undefined ? markers : [];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to build SVG sparkline path from history values
  const buildSparklinePath = (
    data: number[],
    minVal: number,
    maxVal: number,
    w = 100,
    h = 24
  ) => {
    if (data.length < 2) return '';
    const range = Math.max(0.001, maxVal - minVal);
    return data
      .map((val, idx) => {
        const px = (idx / (data.length - 1)) * w;
        const py = h - ((val - minVal) / range) * (h - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
      })
      .join(' ');
  };

  // Build history slices for 4 sparklines
  const sampleStep = Math.max(1, Math.floor(history.length / 50));
  const sampledHistory = history.filter((_, idx) => idx % sampleStep === 0);

  const successSeries = sampledHistory.map((h) => h.userSuccessRate);
  const latencySeries = sampledHistory.map((h) => h.userP95Ms);
  const internalRpsSeries = sampledHistory.map((h) => h.totalInternalRps);
  const activeSeries = sampledHistory.map((h) => h.activeInstances);

  const successPath = buildSparklinePath(successSeries, 0, 100);
  const latencyPath = buildSparklinePath(
    latencySeries,
    0,
    Math.max(2500, ...latencySeries, 1000)
  );
  const rpsPath = buildSparklinePath(
    internalRpsSeries,
    0,
    Math.max(3000, ...internalRpsSeries, 1200)
  );
  const activePath = buildSparklinePath(
    activeSeries,
    0,
    Math.max(40, ...activeSeries, 10)
  );

  return (
    <footer className="h-32 bg-surface border-t border-border px-4 py-2 flex flex-col justify-between select-none flex-shrink-0 z-30 shadow-noc">
      {/* Top Row: Playback Buttons + Scrubber Track + Time Readout */}
      <div className="flex items-center gap-3">
        {/* Compact Transport Controls */}
        {onToggleRun && (
          <div className="flex items-center gap-1 bg-surface-raised px-2 py-0.5 rounded-lg border border-border">
            <button
              onClick={onToggleRun}
              title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
              className={`p-1 rounded transition-colors ${
                isRunning
                  ? 'text-status-degraded hover:bg-status-degraded/20'
                  : 'text-accent hover:bg-accent/20'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            {onStep && (
              <button
                onClick={onStep}
                title="Step forward 1s"
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                <StepForward className="w-3.5 h-3.5" />
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                title="Reset simulation (R)"
                className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {onChangeSpeed && (
              <div className="flex items-center gap-0.5 border-l border-border/80 pl-1 text-[10px] font-mono">
                {[1, 4, 16].map((s) => (
                  <button
                    key={s}
                    onClick={() => onChangeSpeed(s)}
                    className={`px-1 py-0.2 rounded ${
                      speed === s
                        ? 'bg-accent text-background font-bold'
                        : 'text-text-dim hover:text-text-primary'
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs font-mono text-accent min-w-[75px]">
          <Clock className="w-3.5 h-3.5" />
          <span className="tabular-nums font-semibold">{formatTime(currentTime)}</span>
          <span className="text-text-dim text-[10px]">/ {formatTime(maxTime)}</span>
        </div>

        {/* Timeline Scrubber Track with Event Markers */}
        <div className="relative flex-1 flex items-center h-6">
          {/* Base rail */}
          <div className="w-full h-2 bg-surface-raised rounded-full relative overflow-visible border border-border">
            {/* Progress fill */}
            <div
              className="h-full bg-accent rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / maxTime) * 100}%` }}
            />

            {/* Event Markers on rail */}
            {effectiveMarkers.map((m, idx) => {
              const posPercent = (m.time / maxTime) * 100;
              return (
                <div
                  key={idx}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-pointer z-10"
                  style={{ left: `${posPercent}%` }}
                  onClick={() => onSeek(m.time)}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center transition-transform hover:scale-125 ${
                      m.type === 'fault'
                        ? 'bg-status-failing'
                        : m.type === 'crash'
                        ? 'bg-status-degraded'
                        : 'bg-status-healthy'
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none whitespace-nowrap z-20">
                    <span className="text-[10px] bg-surface-raised border border-border px-2 py-0.5 rounded shadow text-text-primary font-mono">
                      ⚑ {m.label} ({m.time}s)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invisible interactive input range */}
          <input
            type="range"
            data-testid="timeline-scrubber"
            min={0}
            max={maxTime}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
      </div>

      {/* Bottom Row: 4 Metric KPI Cards with Live Sparklines */}
      <div className="grid grid-cols-4 gap-3 pt-1 border-t border-border/50">
        {/* Metric 1: User-Facing Success */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between pr-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">User Success</span>
              <span className="text-[9px] text-text-dim font-mono">SLO 99%</span>
            </div>
            <div className="flex items-baseline gap-2">
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
              <span className="text-[10px] text-text-dim font-mono">
                {successRate >= 99 ? 'Healthy' : 'Degraded'}
              </span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="w-20 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <path
                d={successPath}
                fill="none"
                stroke={successRate >= 99 ? '#34D399' : '#F87171'}
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <CheckCircle
            className={`w-4 h-4 ml-2 flex-shrink-0 ${
              successRate >= 99 ? 'text-status-healthy' : 'text-status-failing'
            }`}
          />
        </div>

        {/* Metric 2: p95 Tail Latency */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between pr-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">p95 Latency</span>
              <span className="text-[9px] text-text-dim font-mono">SLO 800ms</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-sm font-bold font-mono tabular-nums ${
                  p95LatencyMs <= 800 ? 'text-text-primary' : 'text-status-failing'
                }`}
              >
                {Math.round(p95LatencyMs)} ms
              </span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="w-20 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <path
                d={latencyPath}
                fill="none"
                stroke={p95LatencyMs <= 800 ? '#38BDF8' : '#F87171'}
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <Activity className="w-4 h-4 ml-2 flex-shrink-0 text-accent" />
        </div>

        {/* Metric 3: Retry Amplification & Baseline Fan-out */}
        <div
          className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between"
          title={`Retry Amplification = internal load / baseline internal load for the same workload (1.0× when healthy).\nBaseline Architectural Fan-out = ${baselineFanout.toFixed(1)}×.`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Retry Amplification</span>
              <span
                className={`text-[9px] font-mono px-1 rounded font-bold ${
                  retryAmplificationNum > 1.3
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                {retryAmplification}×
              </span>
            </div>
            <div className="text-xs font-mono text-text-primary tabular-nums">
              {Math.round(internalRps)} <span className="text-text-dim text-[10px]">internal</span>
              <span className="text-text-dim text-[10px] ml-1.5">(fan-out: {baselineFanout.toFixed(1)}×)</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="w-20 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <path
                d={rpsPath}
                fill="none"
                stroke={retryAmplificationNum > 1.3 ? '#FB923C' : '#38BDF8'}
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <Flame
            className={`w-4 h-4 ml-2 flex-shrink-0 ${
              retryAmplificationNum > 1.3 ? 'text-orange-400 animate-pulse' : 'text-text-dim'
            }`}
          />
        </div>

        {/* Metric 4: Instances Active vs Crashed */}
        <div className="bg-surface-raised/60 border border-border/80 rounded-md p-1.5 px-3 flex items-center justify-between">
          <div className="flex-1">
            <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Fleet Capacity</span>
            <div className="text-xs font-mono text-text-primary tabular-nums">
              <span className="text-status-healthy font-bold">{activeInstances} ready</span>
              {crashedInstances > 0 && (
                <span className="text-status-failing font-bold ml-1.5">({crashedInstances} down)</span>
              )}
            </div>
          </div>
          {/* Sparkline */}
          <div className="w-20 h-6 flex-shrink-0">
            <svg viewBox="0 0 100 24" className="w-full h-full">
              <path d={activePath} fill="none" stroke="#34D399" strokeWidth="1.5" />
            </svg>
          </div>
          <Users className="w-4 h-4 ml-2 flex-shrink-0 text-text-muted" />
        </div>
      </div>
    </footer>
  );
};
