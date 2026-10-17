import React, { useState, useEffect } from 'react';
import {
  TrendingDown,
  RotateCw,
  Play,
  AlertTriangle,
  Server,
  Activity,
  Gauge,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { runCapacitySweep } from './capacity';
import { CapacityCliffReport, CapacitySweepPoint } from './types';

export const CapacityCliffView: React.FC = () => {
  const currentSpec = useArchitectureStore((state) => state.currentSpec);
  const [report, setReport] = useState<CapacityCliffReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<CapacitySweepPoint | null>(null);
  const [activeMetric, setActiveMetric] = useState<'goodput' | 'latency' | 'success'>('goodput');

  useEffect(() => {
    runSweep();
  }, [currentSpec]);

  const runSweep = () => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const res = runCapacitySweep(currentSpec);
        setReport(res);
        setHoveredPoint(null);
      } catch (err) {
        console.error('Failed to run capacity sweep:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const bottleneckService = report
    ? currentSpec.services.find((s) => s.id === report.primaryBottleneckId)
    : null;

  // Chart coordinates calculation
  const chartWidth = 720;
  const chartHeight = 280;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 40;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const points = report?.points || [];
  const maxOffered = points.length > 0 ? points[points.length - 1].offeredRps : 4000;
  const maxGoodput = points.length > 0 ? Math.max(...points.map((p) => Math.max(p.offeredRps, p.goodputRps))) : 4000;
  const maxLatency = points.length > 0 ? Math.max(...points.map((p) => p.p95Ms), 500) : 500;

  const getX = (offered: number) => padLeft + (offered / maxOffered) * innerWidth;
  const getYGoodput = (goodput: number) => padTop + innerHeight - (goodput / maxGoodput) * innerHeight;
  const getYLatency = (lat: number) => padTop + innerHeight - (lat / maxLatency) * innerHeight;
  const getYSuccess = (succ: number) => padTop + innerHeight - (succ / 100) * innerHeight;

  // Paths
  const idealPath = `M ${getX(0)} ${getYGoodput(0)} L ${getX(maxOffered)} ${getYGoodput(maxOffered)}`;

  const goodputAreaPath = points.length > 0
    ? `M ${getX(points[0].offeredRps)} ${padTop + innerHeight} ` +
      points.map((p) => `L ${getX(p.offeredRps)} ${getYGoodput(p.goodputRps)}`).join(' ') +
      ` L ${getX(points[points.length - 1].offeredRps)} ${padTop + innerHeight} Z`
    : '';

  const goodputLinePath = points.length > 0
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.offeredRps)} ${getYGoodput(p.goodputRps)}`).join(' ')
    : '';

  const latencyLinePath = points.length > 0
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.offeredRps)} ${getYLatency(p.p95Ms)}`).join(' ')
    : '';

  const successLinePath = points.length > 0
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.offeredRps)} ${getYSuccess(p.successRate)}`).join(' ')
    : '';

  const kneeX = report ? getX(report.kneeRps) : 0;

  return (
    <div className="w-full h-full flex flex-col bg-background text-text-primary overflow-y-auto p-5 select-none custom-scrollbar">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <TrendingDown className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                Capacity Cliff & Saturation Knee Analysis
              </h2>
              <p className="text-xs text-text-muted">
                Offered load sweep (0.2× to 4.0× base RPS) to identify system breaking points and isolate the primary bottleneck
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-raised border border-border rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveMetric('goodput')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeMetric === 'goodput'
                  ? 'bg-accent text-background font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Goodput vs Load
            </button>
            <button
              onClick={() => setActiveMetric('latency')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeMetric === 'latency'
                  ? 'bg-amber-400 text-background font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              p95 Latency Curve
            </button>
            <button
              onClick={() => setActiveMetric('success')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeMetric === 'success'
                  ? 'bg-emerald-400 text-background font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Success Rate %
            </button>
          </div>

          <button
            onClick={runSweep}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-noc transition-all ${
              isRunning
                ? 'bg-surface-raised text-text-muted cursor-not-allowed'
                : 'bg-accent hover:bg-accent-hover text-background font-bold'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Sweeping Load...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Re-evaluate Sweep</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top 4 Summary KPI Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          {/* Baseline Load */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-text-muted" /> Base Workload
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-text-primary">
                {report.baseRps.toLocaleString()}
              </span>
              <span className="text-xs text-text-muted">RPS</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              Current production design load
            </p>
          </div>

          {/* Knee Breaking Point */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" /> Capacity Knee Point
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {report.kneeRps.toLocaleString()}
              </span>
              <span className="text-xs text-text-muted">RPS</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              Point of saturation & queue overflow
            </p>
          </div>

          {/* Headroom Multiplier */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-accent" /> System Headroom
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono ${
                  report.headroomRatio >= 2.0
                    ? 'text-emerald-400'
                    : report.headroomRatio >= 1.2
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {report.headroomRatio}×
              </span>
              <span className="text-xs text-text-muted">of baseline</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              {report.headroomRatio < 1.3 ? 'CRITICAL: High risk of traffic brownout' : 'Safe operating headroom'}
            </p>
          </div>

          {/* Primary Bottleneck Service */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-rose-400" /> Primary Bottleneck
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold font-mono text-rose-400 truncate max-w-[170px]" title={bottleneckService?.name || report.primaryBottleneckId}>
                {bottleneckService?.name || report.primaryBottleneckId}
              </span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              First service to reach 100% thread exhaustion
            </p>
          </div>
        </div>
      )}

      {/* Main SVG Capacity Cliff Chart */}
      {report && (
        <div className="bg-surface-raised border border-border rounded-xl p-4 shadow-noc flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                {activeMetric === 'goodput' && 'Goodput (Delivered RPS) vs. Offered Load'}
                {activeMetric === 'latency' && 'P95 End-to-End Latency vs. Offered Load'}
                {activeMetric === 'success' && 'User Success Rate % vs. Offered Load'}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-text-muted font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-text-dim border-t border-dashed border-text-dim" /> Ideal 1:1 Goodput
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Actual Goodput
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500" /> Knee Point
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="relative w-full flex-1 min-h-[300px] flex items-center justify-center">
            <svg
              className="w-full h-full max-h-[360px] overflow-visible"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="goodputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="saturationZone" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                const y = padTop + frac * innerHeight;
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chartWidth - padRight}
                      y2={y}
                      stroke="#1E293B"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {activeMetric === 'goodput' && Math.round(maxGoodput * (1 - frac))}
                      {activeMetric === 'latency' && `${Math.round(maxLatency * (1 - frac))}ms`}
                      {activeMetric === 'success' && `${Math.round(100 * (1 - frac))}%`}
                    </text>
                  </g>
                );
              })}

              {/* Saturation Zone Shading beyond knee */}
              {kneeX < chartWidth - padRight && (
                <rect
                  x={kneeX}
                  y={padTop}
                  width={chartWidth - padRight - kneeX}
                  height={innerHeight}
                  fill="url(#saturationZone)"
                />
              )}

              {/* Ideal diagonal (goodput mode only) */}
              {activeMetric === 'goodput' && (
                <path
                  d={idealPath}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Primary Curve Paths */}
              {activeMetric === 'goodput' && (
                <>
                  <path d={goodputAreaPath} fill="url(#goodputGradient)" />
                  <path
                    d={goodputLinePath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {activeMetric === 'latency' && (
                <path
                  d={latencyLinePath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {activeMetric === 'success' && (
                <path
                  d={successLinePath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Knee Vertical Marker */}
              <g>
                <line
                  x1={kneeX}
                  y1={padTop}
                  x2={kneeX}
                  y2={padTop + innerHeight}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
                {/* Glowing Knee Label */}
                <rect
                  x={kneeX - 45}
                  y={padTop - 22}
                  width="90"
                  height="18"
                  rx="4"
                  fill="#F59E0B"
                  fillOpacity="0.2"
                  stroke="#F59E0B"
                  strokeWidth="1"
                />
                <text
                  x={kneeX}
                  y={padTop - 10}
                  fill="#FCD34D"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  KNEE: {report.kneeRps} RPS
                </text>
              </g>

              {/* Interactive Data Point Dots */}
              {points.map((pt, i) => {
                const cx = getX(pt.offeredRps);
                const cy =
                  activeMetric === 'goodput'
                    ? getYGoodput(pt.goodputRps)
                    : activeMetric === 'latency'
                    ? getYLatency(pt.p95Ms)
                    : getYSuccess(pt.successRate);

                const isHovered = hoveredPoint?.offeredRps === pt.offeredRps;

                return (
                  <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(pt)}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.5}
                      fill={
                        activeMetric === 'goodput'
                          ? '#38BDF8'
                          : activeMetric === 'latency'
                          ? '#F59E0B'
                          : '#10B981'
                      }
                      stroke="#0B1020"
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}

              {/* X Axis labels */}
              {points.filter((_, idx) => idx % 2 === 0).map((pt, i) => (
                <text
                  key={i}
                  x={getX(pt.offeredRps)}
                  y={padTop + innerHeight + 18}
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {pt.offeredRps}
                </text>
              ))}

              <text
                x={padLeft + innerWidth / 2}
                y={chartHeight - 4}
                fill="#94A3B8"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                Offered Load (Total Entry Requests / Sec)
              </text>
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute top-4 right-4 p-3 rounded-lg bg-surface/95 border border-border shadow-noc backdrop-blur text-xs z-10 w-52 pointer-events-none"
              >
                <div className="font-bold text-accent font-mono border-b border-border pb-1 mb-1.5 flex items-center justify-between">
                  <span>Load: {hoveredPoint.offeredRps} RPS</span>
                  <span className="text-[10px] text-text-dim">
                    ({Math.round((hoveredPoint.offeredRps / report.baseRps) * 100) / 100}×)
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Goodput:</span>
                    <span className="text-text-primary font-bold">{hoveredPoint.goodputRps} RPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Success Rate:</span>
                    <span
                      className={`font-bold ${
                        hoveredPoint.successRate >= 98
                          ? 'text-emerald-400'
                          : hoveredPoint.successRate >= 90
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {hoveredPoint.successRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">p95 Latency:</span>
                    <span className="text-text-primary font-bold">{hoveredPoint.p95Ms} ms</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50 text-[10px]">
                    <span className="text-text-dim">Bottleneck:</span>
                    <span className="text-amber-400 font-bold truncate max-w-[100px]">
                      {hoveredPoint.bottleneckServiceId} ({Math.round(hoveredPoint.bottleneckUtil * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottleneck Diagnostic Card */}
      {report && bottleneckService && (
        <div className="mt-4 p-4 rounded-xl bg-surface-raised border border-border shadow-noc flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary">
                Bottleneck Diagnostic: <span className="text-accent">{bottleneckService.name}</span>
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5 max-w-2xl leading-relaxed">
                When aggregate entry load reaches <strong className="text-amber-400">{report.kneeRps} RPS</strong>, {bottleneckService.name} reaches 100% capacity utilization.
                Configured with <strong>{bottleneckService.instances.initial} replicas</strong> and <strong>{bottleneckService.service_time_ms}ms</strong> service time, its theoretical limit is ~{Math.round(bottleneckService.instances.initial * (1000 / bottleneckService.service_time_ms))} calls/s.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="text-xs font-mono text-text-dim">
              Max Goodput: <strong className="text-accent font-bold">{report.maxGoodputRps} RPS</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
