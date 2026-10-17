import React, { useState } from 'react';
import {
  Network,
  Columns2,
  Grid,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { ArchitectureGraph } from '../viz/ArchitectureGraph';

interface MainCanvasProps {
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  selectedNodeId: string | null;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  onSelectNode,
  onSelectEdge,
}) => {
  const [activeTab, setActiveTab] = useState<
    'graph' | 'split' | 'chaos' | 'capacity' | 'reality'
  >('graph');

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
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'graph' && (
          <ArchitectureGraph
            onSelectNode={onSelectNode}
            onSelectEdge={onSelectEdge}
          />
        )}

        {/* Finished Mockup Views for other tabs */}
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
