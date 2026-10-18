import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { REALITY_SCENARIOS } from './dataset';
import { runRealityComparison } from './engine';

export const RealityCheckView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(REALITY_SCENARIOS[0].id);
  const [metricTab, setMetricTab] = useState<'success' | 'latency' | 'throughput'>('success');

  const currentScenario = useMemo(() => {
    return REALITY_SCENARIOS.find((s) => s.id === selectedScenarioId) || REALITY_SCENARIOS[0];
  }, [selectedScenarioId]);

  const comparison = useMemo(() => {
    return runRealityComparison(currentScenario);
  }, [currentScenario]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Extract selected metric values for the SVG chart
  const chartData = useMemo(() => {
    return comparison.timeSeries.map((pt) => {
      let measured = pt.measuredSuccess;
      let predicted = pt.predictedSuccess;
      if (metricTab === 'latency') {
        measured = pt.measuredP95;
        predicted = pt.predictedP95;
      } else if (metricTab === 'throughput') {
        measured = pt.measuredThroughput;
        predicted = pt.predictedThroughput;
      }
      return { timeS: pt.timeS, measured, predicted };
    });
  }, [comparison, metricTab]);

  const maxVal = useMemo(() => {
    const vals = chartData.flatMap((d) => [d.measured, d.predicted]);
    const max = Math.max(...vals, 1);
    return metricTab === 'success' ? 105 : max * 1.15;
  }, [chartData, metricTab]);

  const minVal = useMemo(() => {
    if (metricTab === 'success') return 0;
    return 0;
  }, [metricTab]);

  // Coordinate scales
  const getX = (t: number) => padding.left + (t / 60) * innerWidth;
  const getY = (val: number) =>
    padding.top + innerHeight - ((val - minVal) / (maxVal - minVal || 1)) * innerHeight;

  // SVG path generators
  const measuredPath = useMemo(() => {
    return chartData.reduce((acc, pt, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${getX(pt.timeS)},${getY(pt.measured)}`;
    }, '');
  }, [chartData, maxVal, minVal]);

  const predictedPath = useMemo(() => {
    return chartData.reduce((acc, pt, idx) => {
      const cmd = idx === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${getX(pt.timeS)},${getY(pt.predicted)}`;
    }, '');
  }, [chartData, maxVal, minVal]);

  return (
    <div className="h-full flex flex-col bg-[#0B1020] text-[#E6EAF2] overflow-y-auto p-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#1F2A44] mb-6">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="p-1.5 bg-[#38BDF8]/10 text-[#38BDF8] rounded-lg border border-[#38BDF8]/30">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Reality Check: Empirical Validation
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Verified Fidelity
            </span>
          </div>
          <p className="text-xs text-[#8A96B0]">
            Validating CascadeLab's fluid simulation mathematical engine against actual empirical
            benchmarks recorded from physical Node.js microservices.
          </p>
        </div>

        {/* Overall Model Accuracy Badge */}
        <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-[#111A2E] px-4 py-2.5 rounded-xl border border-[#1F2A44] shadow-sm">
          <div className="text-right">
            <div className="text-[10px] text-[#8A96B0] uppercase tracking-wider font-semibold">
              Empirical Fidelity
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {comparison.overallFidelityPct}%
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
              comparison.fidelityGrade.startsWith('A')
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {comparison.fidelityGrade}
          </div>
        </div>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {REALITY_SCENARIOS.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          return (
            <button
              key={sc.id}
              onClick={() => setSelectedScenarioId(sc.id)}
              className={`p-3.5 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-[#162240] border-[#38BDF8] shadow-md shadow-[#38BDF8]/10'
                  : 'bg-[#111A2E] border-[#1F2A44] hover:border-[#2D3C5E] text-[#8A96B0]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold ${isSelected ? 'text-[#38BDF8]' : 'text-white'}`}
                >
                  {sc.name}
                </span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8]" />}
              </div>
              <p className="text-[11px] text-[#8A96B0] line-clamp-2 leading-relaxed">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Validation Scorecard Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111A2E] p-4 rounded-xl border border-[#1F2A44]">
          <div className="flex items-center justify-between text-xs text-[#8A96B0] mb-1">
            <span>Success Rate MAPE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">Error</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ±{comparison.successMape}%
          </div>
          <div className="text-[11px] text-[#8A96B0] mt-1">
            Mean Absolute Percentage Error across 60s
          </div>
        </div>

        <div className="bg-[#111A2E] p-4 rounded-xl border border-[#1F2A44]">
          <div className="flex items-center justify-between text-xs text-[#8A96B0] mb-1">
            <span>Throughput MAPE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">Error</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#38BDF8]">
            ±{comparison.throughputMape}%
          </div>
          <div className="text-[11px] text-[#8A96B0] mt-1">
            Completed requests per second fidelity
          </div>
        </div>

        <div className="bg-[#111A2E] p-4 rounded-xl border border-[#1F2A44]">
          <div className="flex items-center justify-between text-xs text-[#8A96B0] mb-1">
            <span>P95 Latency MAPE</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5">Error</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            ±{comparison.p95Mape}%
          </div>
          <div className="text-[11px] text-[#8A96B0] mt-1">
            Sakasegawa tail approximation fidelity
          </div>
        </div>
      </div>

      {/* Dual Overlay Visualization & Metric Controls */}
      <div className="bg-[#111A2E] p-5 rounded-xl border border-[#1F2A44] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1F2A44] mb-4 gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
              <span>Predicted vs Measured Telemetry Overlay</span>
            </h2>
            <div className="text-xs text-[#8A96B0] mt-0.5">
              Solid Cyan = CascadeLab Fluid Engine | Dashed Emerald = Physical Node.js Benchmark
            </div>
          </div>

          {/* Metric Sub-Tabs */}
          <div className="flex items-center space-x-1.5 bg-[#0B1020] p-1 rounded-lg border border-[#1F2A44]">
            <button
              onClick={() => setMetricTab('success')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                metricTab === 'success'
                  ? 'bg-[#38BDF8] text-[#0B1020] font-semibold'
                  : 'text-[#8A96B0] hover:text-white'
              }`}
            >
              Success %
            </button>
            <button
              onClick={() => setMetricTab('latency')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                metricTab === 'latency'
                  ? 'bg-[#38BDF8] text-[#0B1020] font-semibold'
                  : 'text-[#8A96B0] hover:text-white'
              }`}
            >
              p95 Latency (ms)
            </button>
            <button
              onClick={() => setMetricTab('throughput')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                metricTab === 'throughput'
                  ? 'bg-[#38BDF8] text-[#0B1020] font-semibold'
                  : 'text-[#8A96B0] hover:text-white'
              }`}
            >
              Throughput (RPS)
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto flex justify-center py-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full max-w-[850px] overflow-visible"
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const yVal = minVal + ratio * (maxVal - minVal);
              const yPos = getY(yVal);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={chartWidth - padding.right}
                    y2={yPos}
                    stroke="#1F2A44"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#8A96B0"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {Math.round(yVal)}
                  </text>
                </g>
              );
            })}

            {/* Time Axis Labels */}
            {[0, 15, 30, 45, 60].map((t) => {
              const xPos = getX(t);
              return (
                <g key={t}>
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={chartHeight - padding.bottom}
                    stroke="#1F2A44"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={xPos}
                    y={chartHeight - padding.bottom + 16}
                    textAnchor="middle"
                    fill="#8A96B0"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {t}s
                  </text>
                </g>
              );
            })}

            {/* Injected Fault Window Shading (15s to 45s) if scenario has fault */}
            {currentScenario.spec.faults.length > 0 && (
              <rect
                x={getX(15)}
                y={padding.top}
                width={getX(45) - getX(15)}
                height={innerHeight}
                fill="#EF4444"
                fillOpacity="0.08"
              />
            )}

            {/* Measured Line (Dashed Emerald) */}
            <path
              d={measuredPath}
              fill="none"
              stroke="#34D399"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />

            {/* Predicted Line (Solid Cyan) */}
            <path d={predictedPath} fill="none" stroke="#38BDF8" strokeWidth="2.5" />

            {/* Data Dots */}
            {chartData.map((d, i) => (
              <g key={i}>
                <circle cx={getX(d.timeS)} cy={getY(d.measured)} r="3" fill="#34D399" />
                <circle cx={getX(d.timeS)} cy={getY(d.predicted)} r="3" fill="#38BDF8" />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-3 text-xs text-[#8A96B0]">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-[#34D399] border-t-2 border-dashed border-[#34D399]" />
            <span className="text-emerald-400 font-medium">Physical Measured Benchmark</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-[#38BDF8]" />
            <span className="text-[#38BDF8] font-medium">CascadeLab Simulated Prediction</span>
          </div>
          {currentScenario.spec.faults.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded" />
              <span className="text-red-400">Active Fault Window (15s–45s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Physics & Divergence Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#111A2E] p-5 rounded-xl border border-[#1F2A44]">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs mb-3">
            <Info className="w-4 h-4 text-[#38BDF8]" />
            <span>Mathematical Queueing Analysis & Observations</span>
          </div>
          <p className="text-xs text-[#CBD5E1] leading-relaxed mb-4">
            {comparison.summaryObservation}
          </p>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[#8A96B0] uppercase tracking-wider">
              Empirical Fidelity Factors:
            </div>
            {comparison.divergenceFactors.map((factor, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-[#94A3B8]">
                <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-Side Data Table */}
        <div className="bg-[#111A2E] p-5 rounded-xl border border-[#1F2A44] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Interval Metrics (Sampled every 5s)</span>
            </div>
            <span className="text-[11px] text-[#8A96B0] font-mono">13 Samples</span>
          </div>

          <div className="flex-1 overflow-x-auto max-h-[220px]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0B1020] text-[#8A96B0] sticky top-0 border-b border-[#1F2A44]">
                <tr>
                  <th className="py-1.5 px-2">Time</th>
                  <th className="py-1.5 px-2">Success (M/P)</th>
                  <th className="py-1.5 px-2">p95 (M/P)</th>
                  <th className="py-1.5 px-2">RPS (M/P)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2A44]/50 text-[#CBD5E1]">
                {comparison.timeSeries.map((row) => (
                  <tr key={row.timeS} className="hover:bg-white/[0.02]">
                    <td className="py-1 px-2 text-[#8A96B0]">{row.timeS}s</td>
                    <td className="py-1 px-2">
                      <span className="text-emerald-400">{row.measuredSuccess}%</span> /{' '}
                      <span className="text-[#38BDF8]">{row.predictedSuccess}%</span>
                    </td>
                    <td className="py-1 px-2">
                      <span className="text-amber-300">{row.measuredP95}ms</span> /{' '}
                      <span className="text-[#38BDF8]">{row.predictedP95}ms</span>
                    </td>
                    <td className="py-1 px-2">
                      <span className="text-white">{row.measuredThroughput}</span> /{' '}
                      <span className="text-[#38BDF8]">{row.predictedThroughput}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
