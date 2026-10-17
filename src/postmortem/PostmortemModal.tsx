import React, { useState } from 'react';
import {
  FileText,
  X,
  Copy,
  Check,
  Download,
  Printer,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PostmortemData } from './types';
import { exportPostmortemToMarkdown } from './markdown';

interface PostmortemModalProps {
  postmortem: PostmortemData;
  isOpen: boolean;
  onClose: () => void;
}

export const PostmortemModal: React.FC<PostmortemModalProps> = ({
  postmortem,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    const md = exportPostmortemToMarkdown(postmortem);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = exportPostmortemToMarkdown(postmortem);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `postmortem-${postmortem.id.toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = () => {
    if (postmortem.severity.startsWith('P1')) {
      return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
    }
    if (postmortem.severity.startsWith('P2')) {
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface-raised border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-text-primary">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  {postmortem.title}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge()}`}>
                  {postmortem.severity}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-text-dim">
                  {postmortem.status}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                {postmortem.id} • {postmortem.date} • Lead: {postmortem.leadInvestigator}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-xs font-medium text-text-primary transition-all"
              title="Copy Markdown to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-accent" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-xs font-medium text-text-primary transition-all"
              title="Download .md file"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-xs font-medium text-text-primary transition-all"
              title="Print / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-text-muted" />
              <span>PDF / Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-muted hover:text-text-primary transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
          {/* Executive Summary */}
          <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span>1. Executive Summary</span>
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {postmortem.executiveSummary}
            </p>
          </section>

          {/* Customer & Financial Impact Grid */}
          <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>2. Customer & Financial Impact</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-text-dim block uppercase">Financial Loss</span>
                <span className="text-base font-bold text-rose-400">
                  ₹{postmortem.impact.financialLossInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-text-dim block uppercase">Lowest Success Rate</span>
                <span className="text-base font-bold text-amber-400">
                  {postmortem.impact.successRateDuringIncident}%
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-text-dim block uppercase">Blast Radius</span>
                <span className="text-base font-bold text-text-primary">
                  {postmortem.impact.blastRadiusPercentage}%
                </span>
                <span className="text-[10px] text-text-dim block">
                  ({postmortem.impact.degradedServices.length} services)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border">
                <span className="text-[10px] text-text-dim block uppercase">Duration (TTD / TTR)</span>
                <span className="text-base font-bold text-accent">
                  {postmortem.impact.durationSeconds}s
                </span>
                <span className="text-[10px] text-text-dim block">
                  TTD: {postmortem.impact.timeToDetectS}s • TTR: {postmortem.impact.timeToRecoverS !== null ? `${postmortem.impact.timeToRecoverS}s` : '∞'}
                </span>
              </div>
            </div>
          </section>

          {/* Chronological Timeline */}
          <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>3. Incident Chronology & Timeline</span>
            </h3>
            <div className="space-y-2 border-l border-border/80 ml-2 pl-4">
              {postmortem.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border border-background ${
                      item.severity === 'critical'
                        ? 'bg-rose-500 ring-2 ring-rose-500/20'
                        : item.severity === 'warning'
                        ? 'bg-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-accent ring-2 ring-accent/20'
                    }`}
                  />
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim mb-0.5">
                    <span>{item.timestamp}</span>
                    <span className="text-accent font-bold">+{item.relativeTimeS}s</span>
                    <span className="capitalize px-1 rounded bg-surface-raised border border-border">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-snug">
                    {item.event}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Root Cause Analysis */}
          <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>4. Root Cause Analysis</span>
            </h3>
            <div className="p-3 rounded-lg bg-surface-raised border border-border mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-text-primary">
                  Origin: <strong className="text-accent">{postmortem.rootCause.originServiceName}</strong>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase font-bold">
                  {postmortem.rootCause.failurePattern.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                {postmortem.rootCause.explanation}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                Evidence Gathered:
              </span>
              {postmortem.rootCause.evidence.map((ev, i) => (
                <div key={i} className="flex items-center gap-1.5 text-text-muted text-[11px]">
                  <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Contributing Factors & What Went Well / Poorly */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What Went Well */}
            <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>What Went Well</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-text-muted">
                {postmortem.whatWentWell.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* What Went Poorly */}
            <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>What Went Poorly</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-text-muted">
                {postmortem.whatWentPoorly.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Prioritized Action Items */}
          <section className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span>5. Corrective Action Items</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-text-dim font-mono text-[10px]">
                    <th className="py-2 px-2.5">ID</th>
                    <th className="py-2 px-2 text-center">Pri</th>
                    <th className="py-2 px-3">Remediation Action</th>
                    <th className="py-2 px-2.5">Owner</th>
                    <th className="py-2 px-2.5 text-right">Cost Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans">
                  {postmortem.actionItems.map((act) => (
                    <tr key={act.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="py-2.5 px-2.5 font-mono text-text-dim text-[11px]">{act.id}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            act.priority === 'P0'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : act.priority === 'P1'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {act.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-text-primary block">{act.action}</span>
                        <span className="text-[10px] text-text-dim leading-tight block">{act.rationale}</span>
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-text-muted text-[11px] whitespace-nowrap">{act.owner}</td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-xs whitespace-nowrap">
                        {act.costDeltaInr > 0 ? (
                          <span className="text-amber-400">+₹{act.costDeltaInr.toLocaleString('en-IN')}/mo</span>
                        ) : (
                          <span className="text-emerald-400">Free (₹0)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
