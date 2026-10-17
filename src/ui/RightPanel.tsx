import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface Finding {
  id: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  target: string;
  reason: string;
  fix: string;
}

interface RootCauseResult {
  origin: string;
  pattern: string;
  confidence: number;
  evidence: string[];
  isMetastable: boolean;
  blastRadiusPct: number;
}

interface RightPanelProps {
  findings: Finding[];
  rootCause: RootCauseResult | null;
  onRunLinter: () => void;
  onApplyFix: (findingId: string) => void;
  isAnalyzing: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  findings,
  rootCause,
  onRunLinter,
  onApplyFix,
  isAnalyzing,
}) => {
  return (
    <aside className="w-80 bg-surface border-l border-border flex flex-col h-full select-none flex-shrink-0 z-20">
      {/* Upper Half: Architecture Findings (Linter) */}
      <div className="flex-1 border-b border-border flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-primary">Architecture Linter</span>
            {findings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-status-failing/20 text-status-failing font-bold">
                {findings.length}
              </span>
            )}
          </div>
          <button
            onClick={onRunLinter}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent text-xs font-medium transition-colors border border-accent/30"
          >
            {isAnalyzing ? (
              <RotateCcw className="w-3 h-3 animate-spin" />
            ) : (
              <Search className="w-3 h-3" />
            )}
            <span>{isAnalyzing ? 'Scanning...' : 'Analyze'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {findings.length > 0 ? (
            findings.map((f) => (
              <div
                key={f.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  f.severity === 'critical'
                    ? 'bg-status-failing/10 border-status-failing/30 hover:border-status-failing/60'
                    : f.severity === 'warning'
                    ? 'bg-status-degraded/10 border-status-degraded/30 hover:border-status-degraded/60'
                    : 'bg-surface-raised border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">
                      {f.severity === 'critical' ? '🔴' : f.severity === 'warning' ? '🟠' : '🟡'}
                    </span>
                    <span className="text-xs font-bold text-text-primary">{f.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1 rounded bg-surface text-text-muted">
                    {f.target}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-tight mb-2">{f.reason}</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <span className="text-[10px] text-text-dim truncate max-w-[170px]" title={f.fix}>
                    Fix: {f.fix}
                  </span>
                  <button
                    onClick={() => onApplyFix(f.id)}
                    className="flex items-center gap-0.5 text-[10px] font-semibold text-accent hover:underline flex-shrink-0"
                  >
                    <span>Apply</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* Designed Linter Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
              <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-dim mb-2">
                <CheckCircle2 className="w-5 h-5 text-status-healthy" />
              </div>
              <h4 className="text-xs font-semibold text-text-primary mb-1">No Linter Findings</h4>
              <p className="text-[11px] text-text-dim leading-relaxed max-w-[210px]">
                Click <span className="text-accent font-medium">Analyze</span> to scan for retry storm traps, single points of failure, and timeout inversions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lower Half: Root Cause & Pattern Detection */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-status-failing" />
            <span className="text-xs font-semibold text-text-primary">Root Cause & Pattern</span>
          </div>
          {rootCause?.isMetastable && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider animate-pulse">
              Metastable
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {rootCause ? (
            <div className="space-y-3">
              {/* Origin & Pattern Cards */}
              <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">Origin Node</span>
                  <span className="text-xs font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    {rootCause.origin}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">Failure Pattern</span>
                  <span className="text-xs font-bold text-status-failing capitalize">
                    {rootCause.pattern.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">Confidence</span>
                  <span className="text-xs font-mono font-semibold text-text-primary">
                    {Math.round(rootCause.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted">Blast Radius</span>
                  <span className="text-xs font-mono font-semibold text-status-degraded">
                    {rootCause.blastRadiusPct}% of services
                  </span>
                </div>
              </div>

              {/* Evidence Deck */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-text-dim font-bold block">
                  Diagnosis Evidence
                </span>
                <div className="space-y-1">
                  {rootCause.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-surface-raised/50 border border-border text-[11px] text-text-muted flex items-start gap-1.5 leading-snug"
                    >
                      <Sparkles className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Designed Root Cause Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
              <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-dim mb-2">
                <AlertTriangle className="w-5 h-5 text-text-dim" />
              </div>
              <h4 className="text-xs font-semibold text-text-primary mb-1">System Healthy</h4>
              <p className="text-[11px] text-text-dim leading-relaxed max-w-[210px]">
                No cascading failure detected. Trigger a fault or surge from the Library to watch the root-cause engine isolate culprits.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
