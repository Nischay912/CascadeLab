import React, { useState } from 'react';
import {
  Network,
  Columns2,
  Grid,
  TrendingDown,
  Layers,
  Server,
  Zap,
  Database,
  Cloud,
} from 'lucide-react';

interface MainCanvasProps {
  onSelectNode: (nodeId: string) => void;
  selectedNodeId: string | null;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  onSelectNode,
  selectedNodeId,
}) => {
  const [activeTab, setActiveTab] = useState<
    'graph' | 'split' | 'chaos' | 'capacity' | 'reality'
  >('graph');

  // 13 services of flagship template ShopFast
  const shopFastServices = [
    { id: 'gateway', name: 'API Gateway', role: 'Entry', rps: 600, p95: 5, util: 45, status: 'healthy', icon: Zap },
    { id: 'auth', name: 'Auth Service', role: 'Security', rps: 600, p95: 12, util: 50, status: 'healthy', icon: Server },
    { id: 'catalog', name: 'Catalog', role: 'Product search', rps: 360, p95: 22, util: 48, status: 'healthy', icon: Server },
    { id: 'cart', name: 'Cart Service', role: 'User cart', rps: 150, p95: 18, util: 35, status: 'healthy', icon: Server },
    { id: 'checkout', name: 'Checkout', role: 'Order intake', rps: 48, p95: 35, util: 52, status: 'healthy', icon: Server },
    { id: 'payments', name: 'Payments Hub', role: 'Processing', rps: 48, p95: 42, util: 55, status: 'healthy', icon: Server },
    { id: 'payment-provider', name: 'External Gateway', role: '3rd Party', rps: 48, p95: 120, util: 60, status: 'healthy', icon: Cloud },
    { id: 'inventory', name: 'Inventory', role: 'Stock sync', rps: 48, p95: 20, util: 30, status: 'healthy', icon: Server },
    { id: 'recommender', name: 'Recommender', role: 'Non-critical', rps: 180, p95: 65, util: 62, status: 'healthy', icon: Server },
    { id: 'notifications', name: 'Notifications', role: 'Async queue', rps: 48, p95: 10, util: 20, status: 'healthy', icon: Server },
    { id: 'cache', name: 'Redis Cache', role: 'In-memory (90% hit)', rps: 360, p95: 2, util: 18, status: 'healthy', icon: Database },
    { id: 'products-db', name: 'Products DB', role: 'Read store', rps: 36, p95: 9, util: 32, status: 'healthy', icon: Database },
    { id: 'orders-db', name: 'Orders DB', role: 'SPOF Single Instance', rps: 48, p95: 11, util: 58, status: 'warning', icon: Database },
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative overflow-hidden select-none">
      {/* Top Canvas Tabs */}
      <div className="h-10 bg-surface/80 backdrop-blur border-b border-border px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-1">
          {[
            { id: 'graph', label: 'Architecture Graph', icon: Network },
            { id: 'split', label: 'Split-Screen Replay', icon: Columns2 },
            { id: 'chaos', label: 'Chaos Matrix', icon: Grid },
            { id: 'capacity', label: 'Capacity Cliff', icon: TrendingDown },
            { id: 'reality', label: 'Reality Check', icon: Layers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t transition-all ${
                activeTab === tab.id
                  ? 'bg-surface-raised text-accent border-b-2 border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover/50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-dim">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-healthy" /> Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-traffic-retry" /> Retry Wave
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-status-failing" /> Failing
          </span>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="flex-1 relative overflow-auto p-6 flex items-center justify-center">
        {activeTab === 'graph' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {shopFastServices.map((svc) => {
              const isSelected = selectedNodeId === svc.id;
              const SvcIcon = svc.icon;
              return (
                <div
                  key={svc.id}
                  onClick={() => onSelectNode(svc.id)}
                  className={`p-3.5 rounded-xl border bg-surface transition-all cursor-pointer group relative overflow-hidden ${
                    isSelected
                      ? 'border-accent shadow-noc-glow bg-surface-raised'
                      : svc.status === 'warning'
                      ? 'border-status-degraded/40 hover:border-status-degraded'
                      : 'border-border hover:border-border-accent hover:bg-surface-raised/50'
                  }`}
                >
                  {/* Subtle top indicator stripe */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      svc.status === 'warning' ? 'bg-status-degraded' : 'bg-status-healthy'
                    }`}
                  />

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-accent">
                        <SvcIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors">
                          {svc.name}
                        </h4>
                        <span className="text-[10px] text-text-dim font-medium">{svc.role}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        svc.status === 'warning'
                          ? 'bg-status-degraded/20 text-status-degraded'
                          : 'bg-status-healthy/20 text-status-healthy'
                      }`}
                    >
                      {svc.status}
                    </span>
                  </div>

                  {/* Node metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] font-mono">
                    <div>
                      <span className="text-[9px] text-text-muted block">Throughput</span>
                      <span className="text-text-primary font-semibold tabular-nums">{svc.rps} RPS</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block">Latency</span>
                      <span className="text-text-primary font-semibold tabular-nums">{svc.p95} ms</span>
                    </div>
                  </div>

                  {/* Utilisation Bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] text-text-dim mb-1 font-mono">
                      <span>Utilisation</span>
                      <span>{svc.util}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden border border-border">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          svc.util > 75
                            ? 'bg-status-failing'
                            : svc.util > 50
                            ? 'bg-status-degraded'
                            : 'bg-status-healthy'
                        }`}
                        style={{ width: `${svc.util}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Finished Mockup Views for other tabs in Phase 0 */}
        {activeTab === 'split' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-accent mb-4 shadow-noc">
              <Columns2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Split-Screen Before vs After Replay</h3>
            <p className="text-xs text-text-muted max-w-md leading-relaxed">
              Run the exact same disaster scenario with identical deterministic seed side by side to visually contrast unhardened collapse vs. hardened resilience.
            </p>
          </div>
        )}

        {activeTab === 'chaos' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-status-failing mb-4 shadow-noc">
              <Grid className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Chaos Suite & Resilience Matrix Heatmap</h3>
            <p className="text-xs text-text-muted max-w-md leading-relaxed">
              Automated 40+ failure permutations across all 13 services to calculate composite resilience score and map weak failure surfaces.
            </p>
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-amber-400 mb-4 shadow-noc">
              <TrendingDown className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Capacity Cliff & Bottleneck Knee</h3>
            <p className="text-xs text-text-muted max-w-md leading-relaxed">
              Offered load sweep graphing Goodput vs. Load to locate system saturation points and pinpoint the primary bottleneck.
            </p>
          </div>
        )}

        {activeTab === 'reality' && (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-status-healthy mb-4 shadow-noc">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Reality Check: Predicted vs Measured</h3>
            <p className="text-xs text-text-muted max-w-md leading-relaxed">
              Empirical overlay validating fluid queueing predictions against real running mini-stack metrics (success rate & p95 latency within ±15%).
            </p>
          </div>
        )}
      </div>
    </main>
  );
};
