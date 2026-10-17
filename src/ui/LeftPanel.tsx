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
} from 'lucide-react';

interface LeftPanelProps {
  selectedElement: { type: 'service' | 'edge'; id: string; name?: string } | null;
  onInjectFault: (faultType: string) => void;
  onSetWorkload: (workloadType: string) => void;
  onOpenBreakIt: () => void;
  onOpenDefendIt: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  selectedElement,
  onInjectFault,
  onSetWorkload,
  onOpenBreakIt,
  onOpenDefendIt,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'inspector'>('library');

  return (
    <aside className="w-80 bg-surface border-r border-border flex flex-col h-full select-none flex-shrink-0 z-20">
      {/* Panel Tab Switcher */}
      <div className="flex border-b border-border bg-surface-raised/50">
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
          {selectedElement && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'library' ? (
          <>
            {/* Fault Injection Deck */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-status-degraded" />
                  <span>Fault Injection Deck</span>
                </span>
                <span className="text-[10px] text-text-dim">Trigger on click</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'latency_provider', label: 'Payment Lag 5x', icon: Clock, color: 'text-amber-400' },
                  { id: 'kill_instances', label: 'Kill 50% Nodes', icon: AlertTriangle, color: 'text-rose-400' },
                  { id: 'cache_flush', label: 'Wipe Redis Cache', icon: Shuffle, color: 'text-orange-400' },
                  { id: 'az_outage', label: 'Kill Zone B', icon: Server, color: 'text-red-400' },
                  { id: 'inject_errors', label: '30% Error Rate', icon: Zap, color: 'text-pink-400' },
                  { id: 'gray_failure', label: 'Gray Degradation', icon: AlertTriangle, color: 'text-yellow-300' },
                ].map((fault) => (
                  <button
                    key={fault.id}
                    onClick={() => onInjectFault(fault.id)}
                    className="flex items-center gap-2 p-2 rounded bg-surface-raised hover:bg-surface-hover border border-border hover:border-border-accent text-left transition-all group"
                  >
                    <fault.icon className={`w-3.5 h-3.5 ${fault.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                    <span className="text-[11px] font-medium text-text-muted group-hover:text-text-primary truncate">
                      {fault.label}
                    </span>
                  </button>
                ))}
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
                ].map((wl) => (
                  <button
                    key={wl.id}
                    onClick={() => onSetWorkload(wl.id)}
                    className="w-full p-2 rounded bg-surface-raised hover:bg-surface-hover border border-border hover:border-accent/40 text-left transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-text-primary group-hover:text-accent">
                        {wl.title}
                      </div>
                      <div className="text-[10px] text-text-dim">{wl.desc}</div>
                    </div>
                    <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply
                    </span>
                  </button>
                ))}
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
            {selectedElement ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface-raised rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Server className="w-4 h-4 text-accent" />
                    <span className="font-semibold text-xs text-text-primary capitalize">
                      {selectedElement.name || selectedElement.id}
                    </span>
                    <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-text-muted">
                      {selectedElement.type}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] text-text-muted block">Instances (Min / Max)</label>
                      <input
                        type="text"
                        defaultValue="4 (min 4, max 12)"
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted block">Worker Concurrency</label>
                      <input
                        type="number"
                        defaultValue={50}
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted block">Service Time Own (ms)</label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full bg-surface border border-border rounded px-2 py-1 text-xs text-text-primary font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-text-muted">Load Shedding</span>
                      <input type="checkbox" defaultChecked={false} className="rounded" />
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
