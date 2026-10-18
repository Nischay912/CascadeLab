import React, { useMemo, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  FileText,
  Wrench,
  Radio,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { useSimulationStore } from '../state/useSimulationStore';
import { PostmortemModal, generatePostmortem, PostmortemData } from '../postmortem';

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
  designScore?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  findings,
  rootCause,
  onRunLinter,
  onApplyFix,
  isAnalyzing,
  designScore,
}) => {
  const currentSpec = useArchitectureStore((state) => state.currentSpec);
  const simulationHistory = useSimulationStore((state) => state.history);
  const [activeTab, setActiveTab] = useState<'linter' | 'rootCause'>('linter');
  const [isPostmortemOpen, setIsPostmortemOpen] = useState(false);
  const [postmortemData, setPostmortemData] = useState<PostmortemData | null>(null);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const toggleExpand = (ruleId: string) => {
    setExpandedRules((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  // Group findings by rule ID to eliminate redundant repeated cards
  const groupedFindings = useMemo(() => {
    const map = new Map<
      string,
      {
        ruleId: string;
        title: string;
        severity: 'critical' | 'warning' | 'info';
        reason: string;
        fix: string;
        items: Finding[];
      }
    >();

    findings.forEach((f) => {
      const existing = map.get(f.ruleId);
      if (existing) {
        existing.items.push(f);
      } else {
        map.set(f.ruleId, {
          ruleId: f.ruleId,
          title: f.title,
          severity: f.severity,
          reason: f.reason,
          fix: f.fix,
          items: [f],
        });
      }
    });

    return Array.from(map.values());
  }, [findings]);

  const handleOpenPostmortem = () => {
    const report = generatePostmortem(
      currentSpec,
      simulationHistory.length > 0 ? simulationHistory : [],
      'Cascading Failure Incident'
    );
    setPostmortemData(report);
    setIsPostmortemOpen(true);
  };

  const handleApplyGroup = (items: Finding[]) => {
    items.forEach((item) => {
      onApplyFix(item.id);
    });
  };

  return (
    <aside className="w-[330px] bg-surface border-l border-border flex flex-col h-full select-none flex-shrink-0 z-20">
      {/* Top Section Switcher Tabs: Linter vs Root-Cause */}
      <div className="h-10 bg-surface-raised border-b border-border flex items-center px-2 gap-1.5 flex-shrink-0">
        <button
          onClick={() => setActiveTab('linter')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
            activeTab === 'linter'
              ? 'bg-surface text-accent shadow-sm border border-border'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Linter ({findings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rootCause')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all relative ${
            activeTab === 'rootCause'
              ? 'bg-surface text-accent shadow-sm border border-border'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Root-cause</span>
          {rootCause && rootCause.origin !== 'none' && (
            <span className="w-2 h-2 rounded-full bg-status-failing animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Architecture Linter (Full Height Scrollable) */}
      {activeTab === 'linter' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Linter Toolbar & Score Header */}
          <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-text-primary">Rule Scanner</span>
                {designScore !== undefined && (
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold" title="Static Architecture Linter Design Score">
                    Score: {designScore}/100
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-dim">
                {findings.length} findings across {groupedFindings.length} rules
              </p>
            </div>

            <button
              onClick={onRunLinter}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent/20 hover:bg-accent/30 text-accent text-xs font-bold transition-colors border border-accent/30"
            >
              {isAnalyzing ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>{isAnalyzing ? 'Scanning...' : 'Scan'}</span>
            </button>
          </div>

          {/* Linter Findings List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {groupedFindings.length > 0 ? (
              groupedFindings.map((group) => {
                const isExpanded = Boolean(expandedRules[group.ruleId]);
                return (
                  <div
                    key={group.ruleId}
                    className={`p-3 rounded-xl border transition-all ${
                      group.severity === 'critical'
                        ? 'bg-status-failing/10 border-status-failing/40'
                        : group.severity === 'warning'
                        ? 'bg-status-degraded/10 border-status-degraded/40'
                        : 'bg-surface-raised border-border'
                    }`}
                  >
                    {/* Card Header: Severity Icon, Title, Target Count */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {group.severity === 'critical' ? '🔴' : group.severity === 'warning' ? '🟠' : '🟡'}
                        </span>
                        <h4 className="text-xs font-bold text-text-primary">
                          {group.title}{' '}
                          <span className="text-xs font-mono font-semibold text-text-dim">
                            ({group.items.length} {group.items.length === 1 ? 'target' : 'targets'})
                          </span>
                        </h4>
                      </div>
                      <span
                        className={`text-xs font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          group.severity === 'critical'
                            ? 'bg-status-failing/20 text-status-failing'
                            : 'bg-status-degraded/20 text-status-degraded'
                        }`}
                      >
                        {group.severity}
                      </span>
                    </div>

                    {/* Why it matters (one-line explanation) */}
                    <div className="text-xs text-text-muted leading-relaxed mb-2 font-sans">
                      <strong className="text-text-primary font-semibold">Why it matters: </strong>
                      {group.reason}
                    </div>

                    {/* Full Fix Description (no truncation) */}
                    <div className="p-2 rounded bg-surface border border-border/70 text-xs font-mono text-text-primary mb-2.5">
                      <span className="text-accent font-bold">Fix: </span>
                      {group.fix}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                      <button
                        onClick={() => toggleExpand(group.ruleId)}
                        className="flex items-center gap-1 text-xs text-text-dim hover:text-text-primary font-mono transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        <span>
                          {isExpanded ? 'Hide' : 'View'} {group.items.length} targets
                        </span>
                      </button>

                      <button
                        onClick={() => handleApplyGroup(group.items)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-accent text-background text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-noc"
                        title="Apply fix to architecture and re-run linter"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>Apply Fix</span>
                      </button>
                    </div>

                    {/* Expandable Target List */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-1.5 rounded bg-surface/80 border border-border/50 text-xs font-mono"
                          >
                            <span className="text-accent font-semibold">{item.target}</span>
                            <button
                              onClick={() => onApplyFix(item.id)}
                              className="text-xs font-bold text-accent hover:underline px-1.5 py-0.5 rounded hover:bg-accent/10"
                            >
                              Apply
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-dim mb-2">
                  <CheckCircle2 className="w-5 h-5 text-status-healthy" />
                </div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">Clean Architecture</h4>
                <p className="text-xs text-text-dim leading-relaxed max-w-[220px]">
                  All resilience rules satisfied. Zero critical retry cascades, SPOFs, or timeout inversions detected.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Root-Cause Analysis (Full Height Scrollable) */}
      {activeTab === 'rootCause' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border bg-surface-raised/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-status-failing" />
              <span className="text-xs font-bold text-text-primary">Root-cause analysis</span>
            </div>
            {rootCause?.isMetastable && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 uppercase tracking-wider animate-pulse">
                Metastable
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {rootCause && rootCause.origin !== 'none' ? (
              <div className="space-y-3">
                {/* Origin & Pattern Diagnostics */}
                <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider text-text-muted font-bold">Origin Node</span>
                    <span className="font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/15 border border-accent/30 flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse text-status-failing" />
                      {rootCause.origin}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider text-text-muted font-bold">Failure Pattern</span>
                    <span className="font-bold text-status-failing capitalize">
                      {rootCause.pattern.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Evidence Strength (Renamed from Confidence; displays formula in tooltip) */}
                  <div
                    className="flex items-center justify-between"
                    title="Formula: min(0.98, max(0.65, (peakAmplification - 1)/2.5 + 0.4)). Sourced from internal load amplification and failure duration."
                  >
                    <span className="uppercase tracking-wider text-text-muted font-bold">Evidence Strength</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(rootCause.confidence * 100)}% (computed)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider text-text-muted font-bold">Blast Radius</span>
                    <span className="font-mono font-bold text-status-degraded">
                      {rootCause.blastRadiusPct}% of services
                    </span>
                  </div>
                </div>

                {/* Evidence Deck */}
                <div className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-text-dim font-bold block">
                    Diagnostic Evidence
                  </span>
                  <div className="space-y-1.5">
                    {rootCause.evidence.map((ev, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-surface-raised/60 border border-border text-xs text-text-muted flex items-start gap-2 leading-relaxed"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Postmortem Action */}
                <button
                  onClick={handleOpenPostmortem}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-background text-xs font-bold w-full justify-center shadow-noc transition-all mt-3"
                >
                  <FileText className="w-3.5 h-3.5 fill-current" />
                  <span>Generate SRE Postmortem (PDF/MD)</span>
                </button>
              </div>
            ) : (
              /* Designed "No Incident Yet" Empty State (Blocker 6) */
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-text-dim mb-2">
                  <CheckCircle2 className="w-5 h-5 text-status-healthy" />
                </div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">No Incident Yet</h4>
                <p className="text-xs text-text-dim leading-relaxed max-w-[220px] mb-3">
                  Nominal baseline. Root-cause analysis will reveal the origin node, propagation pattern, and evidence as playback enters an incident.
                </p>
                <button
                  onClick={handleOpenPostmortem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-hover text-text-muted hover:text-text-primary border border-border text-xs font-semibold transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>View Baseline Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Postmortem Modal Dialog */}
      {postmortemData && (
        <PostmortemModal
          postmortem={postmortemData}
          isOpen={isPostmortemOpen}
          onClose={() => setIsPostmortemOpen(false)}
        />
      )}
    </aside>
  );
};
