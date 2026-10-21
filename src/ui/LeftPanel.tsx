import React, { useState } from 'react';
import {
  FolderKanban,
  Sliders,
  Flame,
  Zap,
  TrendingUp,
  Gamepad2,
  AlertTriangle,
  Server,
  Shuffle,
  Clock,
  ShieldCheck,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { useSimulationStore } from '../state/useSimulationStore';
import { getSmartTargetDisplayName } from '../sim/faultHelper';

interface LeftPanelProps {
  onInjectFault: (faultType: string) => void;
  onSetWorkload: (workloadType: string) => void;
  onClearAllFaults?: () => void;
  onOpenBreakIt: () => void;
  onOpenDefendIt: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  onInjectFault,
  onSetWorkload,
  onClearAllFaults,
  onOpenBreakIt,
  onOpenDefendIt,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'inspector'>('library');
  const {
    currentSpec,
    selectedElementId,
    selectedElementType,
    updateService,
    removeService,
    updateEdge,
    removeEdge,
  } = useArchitectureStore();
  const { currentTime } = useSimulationStore();

  const selectedService =
    selectedElementType === 'service'
      ? currentSpec.services.find((s) => s.id === selectedElementId)
      : null;

  const selectedEdge =
    selectedElementType === 'edge'
      ? currentSpec.edges.find((e) => e.id === selectedElementId || `${e.from}->${e.to}` === selectedElementId)
      : null;

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-surface border-r border-border flex flex-col items-center py-2 select-none flex-shrink-0 z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded transition-colors mb-3"
          title="Expand Controls & Inspector Panel"
        >
          <ChevronRight className="w-4 h-4 text-accent" />
        </button>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded transition-colors mb-2"
          title="Library & Workloads"
        >
          <FolderKanban className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-raised rounded transition-colors mb-2 relative"
          title="Inspector"
        >
          <Sliders className="w-4 h-4" />
          {(selectedService || selectedEdge) && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse absolute top-1 right-1" />
          )}
        </button>
        <div className="w-6 h-px bg-border my-2" />
        <button
          onClick={onOpenBreakIt}
          className="p-2 text-status-failing hover:bg-status-failing/20 rounded transition-colors mb-2"
          title="Break-It Chaos Console"
        >
          <Flame className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenDefendIt}
          className="p-2 text-accent hover:bg-accent/20 rounded transition-colors"
          title="Defend-It Optimizer Console"
        >
          <ShieldCheck className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] bg-surface border-r border-border flex flex-col h-full select-none flex-shrink-0 z-20">
      {/* Panel Tab Switcher */}
      <div className="flex border-b border-border bg-surface-raised/50 items-center">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'library'
              ? 'border-accent text-accent bg-surface'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>
        <button
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'inspector'
              ? 'border-accent text-accent bg-surface'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Inspector</span>
          {(selectedService || selectedEdge) && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
        </button>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="px-2.5 py-2.5 text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors border-l border-border"
            title="Collapse Panel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'library' ? (
          <>
            {/* Fault Injection Deck */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-status-degraded animate-pulse" />
                  <span>Fault Injection Deck</span>
                </span>
                {currentSpec.faults.length > 0 ? (
                  <button
                    onClick={onClearAllFaults}
                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-mono transition-colors"
                    title="Heal all active faults across network"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Heal All ({currentSpec.faults.length})
                  </button>
                ) : (
                  <span className="text-[10px] text-text-dim">Instant Chaos</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'latency', label: 'Provider Lag 5x', icon: Clock, color: 'text-amber-400' },
                  { id: 'kill_instances', label: 'Kill 50% Nodes', icon: AlertTriangle, color: 'text-rose-400' },
                  { id: 'cache_flush', label: 'Wipe Redis Cache', icon: Shuffle, color: 'text-orange-400' },
                  { id: 'az_outage', label: 'Kill Zone B', icon: Server, color: 'text-red-400' },
                  { id: 'error', label: '30% Error Rate', icon: Zap, color: 'text-pink-400' },
                  { id: 'gray_failure', label: 'Gray Degradation', icon: AlertTriangle, color: 'text-yellow-300' },
                ].map((fault) => {
                  const activeFault = currentSpec.faults.find((f) => f.type === fault.id);
                  const isConfigured = Boolean(activeFault);
                  const isFiringNow =
                    isConfigured &&
                    currentTime >= (activeFault?.start_s ?? 0) &&
                    currentTime < (activeFault?.end_s ?? 180);
                  const targetName = activeFault ? getSmartTargetDisplayName(activeFault, currentSpec) : '';

                  return (
                    <button
                      key={fault.id}
                      onClick={() => onInjectFault(fault.id)}
                      title={
                        isConfigured
                          ? `Active on [${targetName}] (${activeFault?.start_s}s..${activeFault?.end_s}s) - Click to heal/remove`
                          : `Click to inject ${fault.label} on this architecture`
                      }
                      className={`relative flex flex-col p-2 rounded text-left transition-all group overflow-hidden ${
                        isFiringNow
                          ? 'bg-rose-950/40 border-rose-500/80 text-rose-200 ring-1 ring-rose-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                          : isConfigured
                          ? 'bg-amber-950/30 border-amber-500/60 text-amber-200'
                          : 'bg-surface-raised hover:bg-surface-hover border-border hover:border-accent/40 text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <fault.icon
                          className={`w-3.5 h-3.5 ${
                            isFiringNow ? 'text-rose-400 animate-bounce' : isConfigured ? 'text-amber-400' : fault.color
                          } flex-shrink-0 group-hover:scale-110 transition-transform`}
                        />
                        <span className="text-[11px] font-medium truncate flex-1">
                          {fault.label}
                        </span>
                        {isFiringNow && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping flex-shrink-0" />
                        )}
                      </div>

                      {/* Sub-label showing target service and firing status */}
                      {isConfigured && (
                        <div className="flex items-center justify-between text-[9px] font-mono mt-1 pt-1 border-t border-border/40 w-full">
                          <span className="truncate max-w-[90px] text-text-dim">{targetName}</span>
                          <span className={isFiringNow ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            {isFiringNow ? 'FIRING' : `@${activeFault?.start_s}s`}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workload Generator */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span>Workload Profile</span>
                </span>
                <span className="text-[10px] text-text-dim">Gateway entry</span>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'constant', title: 'Constant Baseline', desc: '600 RPS steady load' },
                  { id: 'flash_sale', title: 'Flash Sale Peak', desc: 'Surge from 600 to 1800 RPS (3x)' },
                  { id: 'ramp', title: 'Gradual Ramp Up', desc: 'Linear climb 0 to 2000 RPS' },
                  { id: 'diurnal', title: 'Diurnal Wave', desc: 'Day / night traffic curve' },
                ].map((wl) => {
                  const isActive = currentSpec.workload.pattern === wl.id;
                  return (
                    <button
                      key={wl.id}
                      onClick={() => onSetWorkload(wl.id)}
                      className={`w-full p-2 rounded border text-left transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-accent/20 border-accent text-accent shadow-sm ring-1 ring-accent/30'
                          : 'bg-surface-raised hover:bg-surface-hover border-border hover:border-accent/40 text-text-primary'
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-semibold ${isActive ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>
                          {wl.title}
                        </div>
                        <div className="text-[10px] text-text-dim">{wl.desc}</div>
                      </div>
                      {isActive ? (
                        <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 rounded bg-accent/20 border border-accent/40">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          Apply
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Game Modes */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-status-healthy" />
                  <span>Interactive Games</span>
                </span>
                <span className="text-[10px] text-text-dim">Demo Star</span>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={onOpenBreakIt}
                  className="w-full p-2.5 rounded-md bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 hover:border-orange-500/60 text-left transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-orange-400">"Break It!" Challenge</div>
                    <div className="text-[10px] text-text-muted">Spend budget to maximize blast radius & ₹ damage</div>
                  </div>
                </button>

                <button
                  onClick={onOpenDefendIt}
                  className="w-full p-2.5 rounded-md bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/30 hover:border-blue-500/60 text-left transition-all flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-blue-400">"Defend It!" Challenge</div>
                    <div className="text-[10px] text-text-muted">90s & 3 config tweaks to restore the SLO</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Inspector Tab */
          <div className="h-full">
            {selectedService ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                    <Server className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-xs text-text-primary capitalize truncate">
                      {selectedService.name || selectedService.id}
                    </span>
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-text-muted">
                      Service
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                        <span>Instances (Replicas)</span>
                        <span className="text-accent font-mono">{selectedService.instances.initial}</span>
                      </div>
                      <input
                        type="range"
                        min={selectedService.instances.min}
                        max={selectedService.instances.max}
                        value={selectedService.instances.initial}
                        onChange={(e) =>
                          updateService(selectedService.id, {
                            instances: {
                              ...selectedService.instances,
                              initial: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                        <span>Worker Concurrency</span>
                        <span className="text-text-primary font-mono">{selectedService.concurrency}</span>
                      </div>
                      <input
                        type="number"
                        value={selectedService.concurrency}
                        onChange={(e) =>
                          updateService(selectedService.id, {
                            concurrency: Number(e.target.value),
                          })
                        }
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                        <span>Own Service Time (ms)</span>
                        <span className="text-text-primary font-mono">{selectedService.service_time_ms} ms</span>
                      </div>
                      <input
                        type="number"
                        value={selectedService.service_time_ms}
                        onChange={(e) =>
                          updateService(selectedService.id, {
                            service_time_ms: Number(e.target.value),
                          })
                        }
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-mono"
                      />
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-text-primary block">Load Shedding</span>
                        <span className="text-[10px] text-text-dim">Drop requests at 80% queue</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedService.load_shedding?.enabled || false}
                        onChange={(e) =>
                          updateService(selectedService.id, {
                            load_shedding: {
                              enabled: e.target.checked,
                              threshold: 0.8,
                            },
                          })
                        }
                        className="w-4 h-4 accent-accent rounded cursor-pointer"
                      />
                    </div>

                    {/* Delete Service Action */}
                    <div className="pt-2 border-t border-border/80">
                      <button
                        onClick={() => removeService(selectedService.id)}
                        disabled={currentSpec.services.length <= 1}
                        className="w-full py-1.5 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Remove service and its connected dependency calls from architecture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Service</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                    <Layers className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-xs text-text-primary truncate">
                      {selectedEdge.from} → {selectedEdge.to}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                        <span>Max Retries</span>
                        <span className="text-orange-400 font-mono font-bold">{selectedEdge.retries}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        value={selectedEdge.retries}
                        onChange={(e) =>
                          updateEdge(selectedEdge.id || `${selectedEdge.from}->${selectedEdge.to}`, {
                            retries: Number(e.target.value),
                          })
                        }
                        className="w-full accent-accent cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-text-muted block mb-1">Retry Backoff Mode</label>
                      <select
                        value={selectedEdge.backoff.mode}
                        onChange={(e) =>
                          updateEdge(selectedEdge.id || `${selectedEdge.from}->${selectedEdge.to}`, {
                            backoff: {
                              ...selectedEdge.backoff,
                              mode: e.target.value as any,
                            },
                          })
                        }
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary"
                      >
                        <option value="none">None (Immediate burst)</option>
                        <option value="fixed">Fixed Delay</option>
                        <option value="exponential">Exponential Backoff</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-text-muted">Jitter (spread retries)</span>
                      <input
                        type="checkbox"
                        checked={selectedEdge.backoff.jitter || false}
                        onChange={(e) =>
                          updateEdge(selectedEdge.id || `${selectedEdge.from}->${selectedEdge.to}`, {
                            backoff: {
                              ...selectedEdge.backoff,
                              jitter: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-accent rounded cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-text-primary block">Circuit Breaker</span>
                        <span className="text-[10px] text-text-dim">Fast-fail when error rate &gt; 50%</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedEdge.circuit_breaker?.enabled || false}
                        onChange={(e) =>
                          updateEdge(selectedEdge.id || `${selectedEdge.from}->${selectedEdge.to}`, {
                            circuit_breaker: {
                              ...selectedEdge.circuit_breaker,
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-accent rounded cursor-pointer"
                      />
                    </div>

                    {/* Delete Edge Action */}
                    <div className="pt-2 border-t border-border/80">
                      <button
                        onClick={() =>
                          removeEdge(selectedEdge.id || `${selectedEdge.from}->${selectedEdge.to}`)
                        }
                        className="w-full py-1.5 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        title="Disconnect this dependency call edge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Dependency Edge</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Designed Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-dim mb-3">
                  <Sliders className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">No Element Selected</h4>
                <p className="text-[11px] text-text-dim leading-relaxed max-w-[200px]">
                  Click on any microservice card or connecting edge on the canvas to inspect and tune its resilience parameters.
                </p>
                <div className="mt-4 p-2 rounded bg-surface-raised/40 border border-border/50 text-[10px] text-text-dim flex items-center gap-1.5 text-left">
                  <Info className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span>Configure timeouts, retry backoff, circuit breakers, and queues.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
