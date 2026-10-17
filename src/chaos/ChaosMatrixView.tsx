import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  AlertTriangle,
  Play,
  RotateCw,
  ShieldAlert,
  Info,
  Zap,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { runChaosSuite } from './suite';
import { ChaosSuiteReport, ChaosMatrixCell, ChaosScenarioResult } from './types';

export const ChaosMatrixView: React.FC = () => {
  const currentSpec = useArchitectureStore((state) => state.currentSpec);
  const [report, setReport] = useState<ChaosSuiteReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [selectedCell, setSelectedCell] = useState<ChaosMatrixCell | null>(null);
  const [selectedResult, setSelectedResult] = useState<ChaosScenarioResult | null>(null);
  const [filterSPOFOnly, setFilterSPOFOnly] = useState<boolean>(false);

  // Auto-run when spec changes if not run yet
  useEffect(() => {
    runSuite();
  }, [currentSpec]);

  const runSuite = () => {
    setIsRunning(true);
    setProgress({ current: 0, total: 1 });

    // Use requestAnimationFrame or setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const result = runChaosSuite(currentSpec, (curr, total) => {
          setProgress({ current: curr, total });
        });
        setReport(result);
        setSelectedCell(null);
        setSelectedResult(null);
      } catch (err) {
        console.error('Failed to run chaos suite:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  };

  const faultColumns: Array<{
    key: 'kill_50' | 'kill_100' | 'latency_5x' | 'latency_20x' | 'error_30';
    label: string;
    sublabel: string;
  }> = [
    { key: 'kill_50', label: 'Kill 50%', sublabel: 'Partition/Crash' },
    { key: 'kill_100', label: 'Kill 100%', sublabel: 'Node Outage' },
    { key: 'latency_5x', label: 'Latency 5×', sublabel: 'Thread Pool Saturation' },
    { key: 'latency_20x', label: 'Latency 20×', sublabel: 'Hang / Timeout' },
    { key: 'error_30', label: 'Error 30%', sublabel: 'Retry Trigger' },
  ];

  // Map of cells by serviceId:faultType
  const cellMap = useMemo(() => {
    const map = new Map<string, ChaosMatrixCell>();
    if (!report) return map;
    for (const cell of report.matrixCells) {
      map.set(`${cell.serviceId}:${cell.faultType}`, cell);
    }
    return map;
  }, [report]);

  // Filtered services
  const displayedServices = useMemo(() => {
    if (!filterSPOFOnly) return currentSpec.services;
    const spofServiceIds = new Set(
      report?.matrixCells.filter((c) => c.isSPOF).map((c) => c.serviceId) || []
    );
    return currentSpec.services.filter((s) => spofServiceIds.has(s.id));
  }, [currentSpec.services, filterSPOFOnly, report]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score >= 55) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  const getScoreBadgeBg = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 55) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-text-primary overflow-y-auto p-5 select-none custom-scrollbar">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-border gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-status-failing/15 text-status-failing border border-status-failing/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-wide">
                Chaos Suite & Resilience Matrix Heatmap
              </h2>
              <p className="text-xs text-text-muted">
                Systematic automated permutations across all microservices (node kill, latency spikes, error injection, AZ failure)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary">
            <input
              type="checkbox"
              checked={filterSPOFOnly}
              onChange={(e) => setFilterSPOFOnly(e.target.checked)}
              className="rounded bg-surface border-border text-accent focus:ring-0"
            />
            <span>Filter SPOFs Only</span>
          </label>

          <button
            onClick={runSuite}
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
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Chaos Suite ({currentSpec.services.length * 5 + 5} Scenarios)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress banner if evaluating */}
      {isRunning && (
        <div className="my-3 p-3 rounded-lg bg-surface-raised border border-border flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-accent animate-bounce" />
            <span className="text-xs font-mono text-text-primary">
              Running simulation scenario {progress.current} of {progress.total}...
            </span>
          </div>
          <div className="w-48 bg-surface rounded-full h-2 overflow-hidden border border-border">
            <div
              className="bg-accent h-full transition-all duration-150"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Overview Metric Cards */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          {/* Composite Score */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between shadow-noc">
            <div>
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
                Resilience Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-bold font-mono ${getScoreBadgeBg(
                    report.compositeResilienceScore
                  )}`}
                >
                  {report.compositeResilienceScore}
                </span>
                <span className="text-xs text-text-muted">/ 100</span>
              </div>
              <p className="text-[10px] text-text-dim mt-0.5">
                0.7× weighted mean + 0.3× worst-case
              </p>
            </div>
            {/* Circular mini gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreBadgeBg(report.compositeResilienceScore)}
                  strokeDasharray={`${report.compositeResilienceScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
            </div>
          </div>

          {/* Weighted Mean Score */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
              Weighted Mean Score
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-text-primary">
                {report.weightedMeanScore}
              </span>
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              Across all {report.scenariosRun} scenarios
            </p>
          </div>

          {/* Worst-Case Scenario */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
              Worst-Case Floor
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-bold font-mono ${getScoreBadgeBg(
                  report.worstCaseScore
                )}`}
              >
                {report.worstCaseScore}
              </span>
              <span className="text-xs text-text-muted">/ 100</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              Most devastating fault condition
            </p>
          </div>

          {/* Execution Time & Scenarios */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border shadow-noc">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wider">
              Simulation Performance
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-accent">
                {report.durationMs}
              </span>
              <span className="text-xs text-text-muted">ms</span>
            </div>
            <p className="text-[10px] text-text-dim mt-0.5">
              Deterministic fluid physics ({report.scenariosRun} runs)
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: 2D Resilience Heatmap Matrix */}
      {report && (
        <div className="mt-2 flex-1 flex flex-col gap-4">
          <div className="bg-surface-raised border border-border rounded-xl p-4 shadow-noc">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span>Resilience Matrix Heatmap (Services × Fault Types)</span>
                <span className="text-[11px] font-normal text-text-muted font-mono">
                  ({displayedServices.length} services shown)
                </span>
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" />
                  Healthy (≥80)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" />
                  Degraded (55-79)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500" />
                  Critical Failure (&lt;55)
                </span>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-text-muted font-mono text-[11px]">
                    <th className="py-2.5 px-3 font-semibold min-w-[180px]">Service</th>
                    <th className="py-2.5 px-2 font-semibold text-center">Type</th>
                    {faultColumns.map((col) => (
                      <th key={col.key} className="py-2.5 px-2 text-center min-w-[110px]">
                        <div className="font-bold text-text-primary">{col.label}</div>
                        <div className="text-[9px] text-text-dim font-sans">{col.sublabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {displayedServices.map((svc) => {
                    const isServiceSPOF =
                      report?.fragileServices.find((f) => f.serviceId === svc.id)?.isSPOF ?? false;

                    return (
                      <tr
                        key={svc.id}
                        className="hover:bg-surface/50 transition-colors group"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                              {svc.name}
                            </span>
                            {isServiceSPOF && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> SPOF
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-dim font-mono">
                            {svc.id} • {svc.instances.initial} replicas
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface border border-border text-text-muted font-mono capitalize truncate max-w-[90px] block" title={svc.role}>
                            {svc.entry ? 'gateway' : (svc.role ? svc.role.split(' ')[0] : 'service')}
                          </span>
                        </td>

                        {faultColumns.map((col) => {
                          const cell = cellMap.get(`${svc.id}:${col.key}`);
                          if (!cell) {
                            return (
                              <td key={col.key} className="py-2.5 px-2 text-center text-text-dim">
                                —
                              </td>
                            );
                          }

                          const isSelected =
                            selectedCell?.serviceId === cell.serviceId &&
                            selectedCell?.faultType === cell.faultType;

                          return (
                            <td key={col.key} className="py-2 px-1.5 text-center">
                              <button
                                onClick={() => {
                                  setSelectedCell(cell);
                                  // Find matching scenario result
                                  const matching = report.results.find(
                                    (r) =>
                                      r.scenario.targetServiceId === cell.serviceId &&
                                      r.scenario.faultType === cell.faultType
                                  );
                                  setSelectedResult(matching || null);
                                }}
                                className={`w-full py-1.5 px-2 rounded-lg border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all ${getScoreColor(
                                  cell.score
                                )} ${
                                  isSelected
                                    ? 'ring-2 ring-accent shadow-noc scale-105'
                                    : 'hover:brightness-125'
                                }`}
                              >
                                <span className="text-xs">{cell.score}</span>
                                <div className="flex items-center gap-1 mt-0.5 text-[9px] font-normal">
                                  {cell.isMetastable && (
                                    <span
                                      className="text-rose-400 font-bold"
                                      title="Metastable Failure (Did not recover)"
                                    >
                                      META
                                    </span>
                                  )}
                                  {cell.timeToRecoverS !== null ? (
                                    <span className="text-text-dim">
                                      {cell.timeToRecoverS}s
                                    </span>
                                  ) : (
                                    <span className="text-rose-400">∞</span>
                                  )}
                                </div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Grid: Fragile Services Ranking & Detailed Cell Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fragile Services Card */}
            <div className="bg-surface-raised border border-border rounded-xl p-4 shadow-noc">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Most Dangerous Failure Dependencies</span>
              </h3>

              <div className="space-y-2">
                {report.fragileServices.slice(0, 5).map((fragile, idx) => (
                  <div
                    key={fragile.serviceId}
                    className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-surface-raised border border-border text-text-muted text-[10px] font-mono flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-text-primary">
                            {fragile.serviceName}
                          </span>
                          {fragile.isSPOF && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              SPOF
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-dim">
                          Worst failure mode: <strong className="text-text-muted">{fragile.worstFault}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-mono font-bold ${getScoreBadgeBg(
                          fragile.avgScore
                        )}`}
                      >
                        {fragile.avgScore}
                      </span>
                      <span className="text-[10px] text-text-dim block">avg resilience</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cell / Scenario Drilldown Inspector */}
            <div className="bg-surface-raised border border-border rounded-xl p-4 shadow-noc flex flex-col">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <span>Scenario Diagnostic Inspector</span>
              </h3>

              {selectedResult ? (
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                      <span className="font-bold text-xs text-text-primary">
                        {selectedResult.scenario.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${getScoreColor(
                          selectedResult.score
                        )}`}
                      >
                        Score: {selectedResult.score}/100
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                      {selectedResult.scenario.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-surface border border-border">
                        <span className="text-[10px] text-text-dim block">Avg Success (Incident)</span>
                        <span className="font-mono font-bold text-text-primary text-sm">
                          {Math.round(selectedResult.avgSuccessDuringIncident * 100)}%
                        </span>
                      </div>

                      <div className="p-2 rounded bg-surface border border-border">
                        <span className="text-[10px] text-text-dim block">Time to Recovery</span>
                        <span className="font-mono font-bold text-text-primary text-sm">
                          {selectedResult.timeToRecoverS !== null
                            ? `${selectedResult.timeToRecoverS}s`
                            : 'Did not recover (∞)'}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-surface border border-border">
                        <span className="text-[10px] text-text-dim block">Blast Radius</span>
                        <span className="font-mono font-bold text-text-primary text-sm">
                          {Math.round(selectedResult.blastFraction * 100)}% of services
                        </span>
                      </div>

                      <div className="p-2 rounded bg-surface border border-border">
                        <span className="text-[10px] text-text-dim block">Metastable Failure</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            selectedResult.isMetastable ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {selectedResult.isMetastable ? 'YES (Sustained)' : 'NO (Recovered)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface border border-border text-[11px] text-text-dim flex items-center justify-between">
                    <span>Peak Amplification: <strong className="text-amber-400 font-mono">{selectedResult.peakAmplification}×</strong></span>
                    <span>Loss: <strong className="text-text-primary font-mono">₹{selectedResult.moneyLostInr.toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-dim">
                  <Info className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Click on any heatmap score cell above to inspect the specific fault's blast radius, recovery chronology, and metrics.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
