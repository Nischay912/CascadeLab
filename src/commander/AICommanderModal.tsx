import React, { useState } from 'react';
import {
  Bot,
  Shield,
  Zap,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Terminal,
  Radio,
  X,
} from 'lucide-react';
import { useCommanderStore } from './useCommanderStore';
import { DefconLevel, CommanderMitigation } from './types';
import { ArchitectureSpec } from '../schema/architecture';

interface AICommanderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpec: ArchitectureSpec;
  onApplyMitigation: (mitigation: CommanderMitigation) => void;
  onTriggerChaosScenario?: (scenario: string) => void;
  resilienceScore?: number;
}

const DEFCON_CONFIG: Record<
  DefconLevel,
  { label: string; text: string; bg: string; border: string; color: string; badge: string }
> = {
  DEFCON_5: {
    label: 'DEFCON 5',
    text: 'NOMINAL OPERATIONS',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  DEFCON_4: {
    label: 'DEFCON 4',
    text: 'GUARDED / MINOR JITTER',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    color: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  },
  DEFCON_3: {
    label: 'DEFCON 3',
    text: 'ELEVATED SERVICE DEGRADATION',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    color: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  DEFCON_2: {
    label: 'DEFCON 2',
    text: 'HIGH THREAT / CASCADING FAILURE',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    color: 'text-orange-400',
    badge: 'bg-orange-500/25 text-orange-300 border-orange-500/50',
  },
  DEFCON_1: {
    label: 'DEFCON 1',
    text: 'CRITICAL SEV-1 SYSTEM BLACKOUT',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/50',
    color: 'text-rose-400',
    badge: 'bg-rose-500/30 text-rose-300 border-rose-500/60 animate-pulse',
  },
};

export const AICommanderModal: React.FC<AICommanderModalProps> = ({
  isOpen,
  onClose,
  currentSpec,
  onApplyMitigation,
  onTriggerChaosScenario,
  resilienceScore = 100,
}) => {
  const {
    mode,
    threatLevel,
    logs,
    activeMitigation,
    appliedMitigationsCount,
    setMode,
    clearLogs,
  } = useCommanderStore();

  const [activeTab, setActiveTab] = useState<'console' | 'threat' | 'drills'>('console');
  const [isDeploying, setIsDeploying] = useState(false);

  if (!isOpen) return null;

  const defcon = DEFCON_CONFIG[threatLevel];

  const handleExecuteMitigation = (mitigation: CommanderMitigation) => {
    setIsDeploying(true);
    setTimeout(() => {
      onApplyMitigation(mitigation);
      setIsDeploying(false);
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-surface-raised border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-text-primary animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Bar */}
        <div className="p-4 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(56,189,248,0.35)]">
              <Bot className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  AI Autonomous Incident Commander
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/30">
                  AIOps v2.4
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Patrolling <span className="text-text-primary font-medium">{currentSpec.name || 'System Topology'}</span> • Real-time autonomous threat triage & self-healing
              </p>
            </div>
          </div>

          {/* Right Status Actions & Defcon Pill */}
          <div className="flex items-center gap-2.5">
            {/* Defcon Indicator */}
            <div
              className={`px-3 py-1 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm ${defcon.badge}`}
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{defcon.label}</span>
              <span className="hidden md:inline font-normal opacity-90">• {defcon.text}</span>
            </div>

            {/* Mode Selector Toggle */}
            <div className="bg-surface-raised border border-border rounded-lg p-0.5 flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('advisory')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mode === 'advisory'
                    ? 'bg-accent text-background font-bold shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="AI alerts human SRE and waits for authorization before applying fixes"
              >
                Co-Pilot
              </button>
              <button
                type="button"
                onClick={() => setMode('autonomous')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  mode === 'autonomous'
                    ? 'bg-emerald-500 text-background font-bold shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="AI self-heals system automatically without human intervention when SLO is breached"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Pilot</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 border-b border-border bg-surface-raised/50 gap-2 flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('console')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'console'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Tactical Telemetry Stream</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface border border-border">
              {logs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('threat')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'threat'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Active Threat Triage & Mitigation</span>
            {activeMitigation && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('drills')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'drills'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Chaos Fire Drills</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'console' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-text-muted text-[11px] pb-1 border-b border-border/60">
                <span>Streaming live tactical telemetry events & autonomous decisions:</span>
                <button
                  onClick={clearLogs}
                  className="hover:text-text-primary transition-colors text-[10px] font-sans flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear Console
                </button>
              </div>

              {/* Terminal Box */}
              <div className="bg-[#070B14] border border-border/80 rounded-xl p-3.5 space-y-2.5 max-h-[420px] overflow-y-auto shadow-inner text-text-primary">
                {logs.length === 0 ? (
                  <div className="text-text-muted text-center py-8">
                    No active incident logs. System telemetry is calm.
                  </div>
                ) : (
                  logs.map((log) => {
                    const badgeColor =
                      log.level === 'critical'
                        ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                        : log.level === 'warning'
                        ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                        : log.level === 'action'
                        ? 'text-sky-400 bg-sky-500/15 border-sky-500/30'
                        : log.level === 'recovery'
                        ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                        : 'text-text-muted bg-surface border-border';

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-2.5 hover:bg-surface/30 p-1.5 rounded transition-colors"
                      >
                        <span className="text-accent font-semibold flex-shrink-0">
                          {log.timestamp}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border flex-shrink-0 ${badgeColor}`}
                        >
                          {log.level}
                        </span>
                        <div className="flex-1 min-w-0 font-sans text-xs">
                          <span className="font-semibold text-text-primary mr-1.5">
                            {log.title}:
                          </span>
                          <span className="text-text-muted leading-relaxed">
                            {log.message}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'threat' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column: Threat Status */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
                      Threat Radar Status
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${defcon.badge}`}>
                      {defcon.label}
                    </span>
                  </div>

                  <h3 className={`text-lg font-bold tracking-tight mb-2 ${defcon.color}`}>
                    {defcon.text}
                  </h3>

                  <p className="text-xs text-text-muted leading-relaxed mb-4">
                    The AI Commander analyzes queue saturation, Little's Law thread exhaustion,
                    and exponential backoff harmonic resonances to prevent cascading cluster blackouts.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                    <div className="bg-surface-raised p-2.5 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Mitigations Executed</span>
                      <span className="text-base font-bold text-accent">{appliedMitigationsCount}</span>
                    </div>
                    <div className="bg-surface-raised p-2.5 rounded-lg border border-border">
                      <span className="text-text-muted text-[10px] block">Resilience Rating</span>
                      <span className="text-base font-bold text-emerald-400">{resilienceScore}/100</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-raised border border-border text-xs text-text-dim flex items-center gap-2">
                  <Bot className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>
                    Operating in <strong className="text-text-primary capitalize">{mode} mode</strong>.
                    {mode === 'advisory'
                      ? ' Human authorization required to apply mitigations.'
                      : ' Auto-pilot will self-heal failures automatically.'}
                  </span>
                </div>
              </div>

              {/* Right Column: Prescribed Tactical Mitigation */}
              <div className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
                      Prescribed Countermeasure
                    </span>
                    {activeMitigation && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/40 uppercase">
                        {activeMitigation.mechanism.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {activeMitigation ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-text-primary">
                        {activeMitigation.title}
                      </h4>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {activeMitigation.description}
                      </p>

                      <div className="p-3 rounded-lg bg-surface-raised border border-accent/20 text-xs space-y-1.5">
                        <span className="font-mono font-semibold text-accent text-[11px] block">
                          SRE Queueing Theory Rationale:
                        </span>
                        <p className="text-text-dim text-[11px] leading-relaxed">
                          {activeMitigation.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Estimated SLO Recovery: +{activeMitigation.estimatedRecoveryPct}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-center text-text-muted space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-medium text-text-primary">
                        Zero Mitigations Required
                      </p>
                      <p className="text-[11px] text-text-dim max-w-xs mx-auto">
                        Digital Twin is running nominally. Inject chaos or trigger a fire drill to test AI self-healing.
                      </p>
                    </div>
                  )}
                </div>

                {activeMitigation && (
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isDeploying}
                      onClick={() => handleExecuteMitigation(activeMitigation)}
                      className="w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent/90 text-background font-bold text-xs transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>{isDeploying ? 'Deploying Self-Healing...' : 'Authorize & Deploy Mitigation'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'drills' && (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">
                Trigger simulated real-world disaster drills to watch the AI Incident Commander detect,
                isolate, and autonomously remediate cascading failures in real time:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onTriggerChaosScenario?.('provider_latency');
                    setActiveTab('threat');
                  }}
                  className="p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-left transition-all hover:border-accent/40 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-text-primary group-hover:text-accent">
                      Payment Provider 5x Latency
                    </span>
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Triggers 1,200ms latency on external bank switch. AI Commander detects caller thread lock and trips circuit breaker.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerChaosScenario?.('cache_flush');
                    setActiveTab('threat');
                  }}
                  className="p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-left transition-all hover:border-accent/40 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-text-primary group-hover:text-accent">
                      Redis Cache Wipe Herd
                    </span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Flushes 100% of cached keys. AI Commander detects database connection saturation and deploys pod autoscale burst.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTriggerChaosScenario?.('az_outage');
                    setActiveTab('threat');
                  }}
                  className="p-3.5 rounded-xl bg-surface hover:bg-surface-hover border border-border text-left transition-all hover:border-accent/40 group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-text-primary group-hover:text-accent">
                      Zone B Availability Outage
                    </span>
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Blacks out 50% of cross-zone replicas. AI Commander activates adaptive load shedding to preserve core checkout flow.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
