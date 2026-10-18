import React, { useState } from 'react';
import {
  Network,
  Columns2,
  Grid,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ArchitectureGraph } from '../viz/ArchitectureGraph';
import { ChaosMatrixView } from '../chaos/ChaosMatrixView';
import { CapacityCliffView } from '../chaos/CapacityCliffView';
import { SplitScreenReplayView } from '../optimizer/SplitScreenReplayView';
import { ParetoFrontView } from '../optimizer/ParetoFrontView';
import { RealityCheckView } from '../reality/RealityCheckView';

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
    'graph' | 'split' | 'optimizer' | 'chaos' | 'capacity' | 'reality'
  >('graph');

  return (
    <main className="flex-1 flex flex-col h-full bg-background relative overflow-hidden select-none">
      {/* Top Canvas Tabs */}
      <div className="h-10 bg-surface/80 backdrop-blur border-b border-border px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-1">
          {[
            { id: 'graph', label: 'Architecture Graph', icon: Network },
            { id: 'split', label: 'Split-Screen Replay', icon: Columns2 },
            { id: 'optimizer', label: 'Auto-Harden (Pareto)', icon: Sparkles },
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

        {activeTab === 'split' && <SplitScreenReplayView />}

        {activeTab === 'optimizer' && <ParetoFrontView />}

        {activeTab === 'chaos' && <ChaosMatrixView />}

        {activeTab === 'capacity' && <CapacityCliffView />}

        {activeTab === 'reality' && <RealityCheckView />}
      </div>
    </main>
  );
};
