import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCw,
  Play,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { runAutoHardenOptimizer } from './optimizer';
import { OptimizerReport, ParetoSolution } from './types';

export const ParetoFrontView: React.FC = () => {
  const currentSpec = useArchitectureStore((state) => state.currentSpec);
  const setSpec = useArchitectureStore((state) => state.setSpec);

  const [report, setReport] = useState<OptimizerReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ gen: number; total: number }>({ gen: 0, total: 12 });
  const [selectedSolution, setSelectedSolution] = useState<ParetoSolution | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  useEffect(() => {
    runOptimizer();
  }, [currentSpec]);

  const runOptimizer = () => {
    setIsRunning(true);
    setProgress({ gen: 0, total: 12 });

    setTimeout(() => {
      try {
        const result = runAutoHardenOptimizer(currentSpec, (gen, total) => {
          setProgress({ gen, total });
        });
        setReport(result);
        setSelectedSolution(result.greedySolution || result.paretoFront[0] || null);
      } catch (err) {
        console.error('Failed to run optimizer:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const handleApplyConfiguration = () => {
    if (!selectedSolution) return;
    setSpec(selectedSolution.spec);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  // SVG Chart Coordinates
  const chartWidth = 640;
  const chartHeight = 280;
  const padLeft = 70;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const paretoPoints = report?.paretoFront || [];
  const allPoints = report?.allSolutions || [];

  const minCost = report
    ? Math.min(report.baselineCostInr, ...paretoPoints.map((p) => p.monthlyCostInr)) * 0.95
    : 10000;
  const maxCost = report
    ? Math.max(report.baselineCostInr, ...paretoPoints.map((p) => p.monthlyCostInr)) * 1.15
    : 50000;

  const minScore = 0;
  const maxScore = 100;

  const getX = (cost: number) => padLeft + ((cost - minCost) / Math.max(1, maxCost - minCost)) * innerWidth;
  const getY = (score: number) => padTop + innerHeight - ((score - minScore) / (maxScore - minScore)) * innerHeight;

  // Path for Pareto Front line
  const paretoLinePath =
    paretoPoints.length > 0
      ? paretoPoints
          .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.monthlyCostInr)} ${getY(p.resilienceScore)}`)
          .join(' ')
      : '';

  return (
    <div className="w-full h-full flex flex-col bg-background text-text-primary overflow-y-auto p-5 select-none custom-scrollbar">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                Auto-Harden Cost-Aware Optimizer (Pareto Front)
              </h2>
              <p className="text-xs text-text-muted">
                Multi-objective Genetic Algorithm (NSGA-II Lite) balancing Resilience Gain vs. Infrastructure Cost (₹/month)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runOptimizer}
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
                <span>Optimizing (Gen {progress.gen}/{progress.total})...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Re-run Multi-Objective Optimizer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress banner */}
      {isRunning && (
        <div className="my-3 p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-accent animate-bounce" />
            <span className="text-xs font-mono text-text-primary">
              Running NSGA-II Lite: Generation {progress.gen} of {progress.total} exploring Pareto trade-offs...
            </span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      {report && (
        <div className="flex-1 flex flex-col gap-4 mt-3">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Baseline Architecture */}
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Current Baseline
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold font-mono text-text-primary">
                    {report.baselineScore}
                  </span>
                  <span className="text-xs text-text-muted">/100 score</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-text-muted">
                    ₹{report.baselineCostInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-text-dim block">/month</span>
                </div>
              </div>
            </div>

            {/* Recommended Hardened Solution */}
            <div className="p-3.5 rounded-xl bg-surface-raised border border-accent/40 shadow-noc relative overflow-hidden">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-accent text-[9px] font-bold text-background uppercase tracking-wider rounded-bl">
                Recommended
              </div>
              <span className="text-[11px] font-medium text-accent uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Optimal Compromise
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {report.greedySolution.resilienceScore}
                  </span>
                  <span className="text-xs text-emerald-400/80 ml-1">
                    (+{report.greedySolution.resilienceScore - report.baselineScore})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-text-primary font-bold">
                    ₹{report.greedySolution.monthlyCostInr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-amber-400 block">
                    {report.greedySolution.monthlyCostInr > report.baselineCostInr
                      ? `+₹${(
                          report.greedySolution.monthlyCostInr - report.baselineCostInr
                        ).toLocaleString('en-IN')}`
                      : 'Zero Extra Cost'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pareto Front Options */}
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Explored Trade-offs
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <div>
                  <span className="text-2xl font-bold font-mono text-accent">
                    {report.paretoFront.length}
                  </span>
                  <span className="text-xs text-text-muted"> Pareto Points</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-text-dim">
                    {report.evaluationsCount} evaluations
                  </span>
                  <span className="text-[10px] text-text-dim block">{report.durationMs}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pareto Chart & Selected Solution Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* SVG Pareto Front Chart (Left 7 cols) */}
            <div className="lg:col-span-7 bg-surface-raised border border-border rounded-xl p-4 shadow-noc flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span>Pareto Frontier: Score vs. Cost</span>
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Pareto Optimal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Recommended
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-text-dim" /> Dominated
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative w-full flex-1 min-h-[280px] flex items-center justify-center">
                <svg
                  className="w-full h-full max-h-[320px] overflow-visible"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="paretoGrad" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines (Score: 20, 40, 60, 80, 100) */}
                  {[0, 25, 50, 75, 100].map((score) => {
                    const y = getY(score);
                    return (
                      <g key={score}>
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
                          {score}
                        </text>
                      </g>
                    );
                  })}

                  {/* Pareto Curve connecting non-dominated solutions */}
                  <path
                    d={paretoLinePath}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* Dominated Explored Points */}
                  {allPoints
                    .filter((p) => !p.isParetoOptimal)
                    .map((pt, i) => (
                      <circle
                        key={i}
                        cx={getX(pt.monthlyCostInr)}
                        cy={getY(pt.resilienceScore)}
                        r="3"
                        fill="#334155"
                        opacity="0.6"
                      />
                    ))}

                  {/* Baseline Dot */}
                  <circle
                    cx={getX(report.baselineCostInr)}
                    cy={getY(report.baselineScore)}
                    r="5"
                    fill="#EF4444"
                    stroke="#0B1020"
                    strokeWidth="2"
                  />
                  <text
                    x={getX(report.baselineCostInr)}
                    y={getY(report.baselineScore) + 14}
                    fill="#EF4444"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Current
                  </text>

                  {/* Pareto Front Points */}
                  {paretoPoints.map((sol) => {
                    const cx = getX(sol.monthlyCostInr);
                    const cy = getY(sol.resilienceScore);
                    const isSelected = selectedSolution?.id === sol.id;
                    const isRecommended = sol.id === report.greedySolution.id;

                    return (
                      <g
                        key={sol.id}
                        className="cursor-pointer transition-transform hover:scale-125"
                        onClick={() => setSelectedSolution(sol)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 7 : isRecommended ? 6 : 4.5}
                          fill={isRecommended ? '#F59E0B' : '#38BDF8'}
                          stroke="#0B1020"
                          strokeWidth="2"
                        />
                        {isSelected && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="10"
                            fill="none"
                            stroke="#38BDF8"
                            strokeWidth="1.5"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* Axis Titles */}
                  <text
                    x={padLeft + innerWidth / 2}
                    y={chartHeight - 6}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    Infrastructure Cost (₹ / Month)
                  </text>
                  <text
                    x={18}
                    y={padTop + innerHeight / 2}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="sans-serif"
                    transform={`rotate(-90 18 ${padTop + innerHeight / 2})`}
                    textAnchor="middle"
                  >
                    Resilience Score
                  </text>
                </svg>
              </div>
            </div>

            {/* Selected Solution Diff Inspector (Right 5 cols) */}
            <div className="lg:col-span-5 bg-surface-raised border border-border rounded-xl p-4 shadow-noc flex flex-col justify-between">
              {selectedSolution ? (
                <div>
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span>Configuration Inspector</span>
                        {selectedSolution.id === report.greedySolution.id && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ★ Recommended
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-text-dim font-mono mt-0.5">
                        {selectedSolution.changes.length} architectural modifications applied
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          {selectedSolution.resilienceScore}
                        </span>
                        <span className="text-xs text-text-muted">/100</span>
                      </div>
                      <span className="text-[11px] font-mono text-text-dim block">
                        ₹{selectedSolution.monthlyCostInr.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>

                  {/* Changes list */}
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedSolution.changes.length > 0 ? (
                      selectedSolution.changes.map((ch, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-surface border border-border text-xs"
                        >
                          <div className="flex items-center justify-between font-semibold text-text-primary">
                            <span>{ch.title}</span>
                            <span
                              className={`text-[10px] font-mono ${
                                ch.costDelta > 0 ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {ch.costDelta > 0
                                ? `+₹${ch.costDelta.toLocaleString('en-IN')}`
                                : 'Free (₹0)'}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                            {ch.reason}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-text-dim text-center py-6">
                        Baseline specification with zero changes applied.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-text-dim">
                  Select a point on the Pareto frontier to view changes
                </div>
              )}

              {/* 1-Click Apply Button */}
              {selectedSolution && (
                <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                  <button
                    onClick={handleApplyConfiguration}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-background font-bold text-xs shadow-noc transition-all"
                  >
                    {appliedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-background" />
                        <span>Configuration Applied to Canvas!</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 fill-current" />
                        <span>Apply This Configuration (1-Click)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
