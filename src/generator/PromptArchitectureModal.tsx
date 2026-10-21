import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  Layers,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Car,
  Utensils,
  Film,
  CreditCard,
  Bot,
  Cpu,
  Gamepad2,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import {
  synthesizeArchitectureFromPrompt,
  SynthesizedArchitectureResult,
  PROMPT_PRESETS,
  PromptPreset,
} from './promptArchitectureEngine';
import { useArchitectureStore } from '../state/useArchitectureStore';

interface PromptArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployed?: (archName: string) => void;
}

const PRESET_ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="w-4 h-4 text-amber-400" />,
  Utensils: <Utensils className="w-4 h-4 text-orange-400" />,
  Film: <Film className="w-4 h-4 text-rose-400" />,
  CreditCard: <CreditCard className="w-4 h-4 text-emerald-400" />,
  Bot: <Bot className="w-4 h-4 text-cyan-400" />,
  Cpu: <Cpu className="w-4 h-4 text-sky-400" />,
  Gamepad2: <Gamepad2 className="w-4 h-4 text-purple-400" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4 text-pink-400" />,
};

export const PromptArchitectureModal: React.FC<PromptArchitectureModalProps> = ({
  isOpen,
  onClose,
  onDeployed,
}) => {
  const { deploySynthesizedArchitecture } = useArchitectureStore();

  const [prompt, setPrompt] = useState(
    'Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway.'
  );
  const [trafficScale, setTrafficScale] = useState<'low' | 'medium' | 'high' | 'peak'>('medium');
  const [mode, setMode] = useState<'fragile_naive' | 'hardened'>('fragile_naive');
  const [includeSpof, setIncludeSpof] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedResult, setSynthesizedResult] =
    useState<SynthesizedArchitectureResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (synthesizedResult && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [synthesizedResult]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PromptPreset) => {
    setPrompt(preset.prompt);
    setError(null);
  };

  const handleSynthesize = () => {
    if (!prompt.trim()) {
      setError('Please enter a natural language prompt description.');
      return;
    }
    setError(null);
    setIsSynthesizing(true);

    // Provide a brief realistic cybernetic delay for UX
    setTimeout(() => {
      try {
        const result = synthesizeArchitectureFromPrompt(prompt, {
          mode,
          trafficScale,
          includeSpof,
          includeFault: true,
        });
        setSynthesizedResult(result);
        setIsSynthesizing(false);
      } catch (err: any) {
        setError(err.message || 'Failed to synthesize architecture spec.');
        setSynthesizedResult(null);
        setIsSynthesizing(false);
      }
    }, 400);
  };

  const handleDeployToCanvas = () => {
    if (!synthesizedResult) return;
    deploySynthesizedArchitecture(synthesizedResult.spec);
    if (onDeployed) {
      onDeployed(synthesizedResult.summary.architectureName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-surface border border-border/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-text-primary">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-raised">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent/30 to-purple-500/30 border border-accent/40 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Prompt-to-Architecture Studio
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-semibold uppercase tracking-wider">
                  NLP Topology Engine
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Synthesize microservice DAG topologies, Little's Law queues, and chaos scenarios from natural language prompts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
          {/* Preset Inspiration Pills */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-2">
              ⚡ 1-Click Inspiration Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all group ${
                    prompt === preset.prompt
                      ? 'bg-accent/15 border-accent text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                      : 'bg-surface-raised border-border/70 hover:border-accent/40 text-text-muted hover:text-text-primary'
                  }`}
                >
                  <div className="p-1.5 rounded-md bg-background/50 border border-border group-hover:border-accent/40 flex-shrink-0">
                    {PRESET_ICONS[preset.icon] || <Layers className="w-4 h-4 text-accent" />}
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-xs block truncate text-text-primary">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-text-dim block truncate">
                      {preset.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Natural Language Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-accent" />
                Describe Your Distributed Architecture
              </label>
              <span className="text-[10px] font-mono text-text-dim">
                Type any microservice stack, queues, databases, or cloud dependencies
              </span>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway..."
                rows={3}
                className="w-full bg-background border border-border/80 focus:border-accent rounded-xl p-3 text-xs text-text-primary placeholder:text-text-dim/60 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all font-mono leading-relaxed resize-none shadow-inner"
              />
              {prompt && (
                <button
                  onClick={() => setPrompt('')}
                  className="absolute top-2.5 right-2.5 text-text-dim hover:text-text-primary text-[10px] font-mono bg-surface px-1.5 py-0.5 rounded border border-border"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Generation Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-raised/70 border border-border/70 p-3 rounded-xl">
            {/* Traffic Scale */}
            <div>
              <label className="text-[10px] font-mono uppercase text-text-muted block mb-1.5">
                Ingress Offered Load
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['low', 'medium', 'high', 'peak'] as const).map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setTrafficScale(scale)}
                    className={`py-1 text-[10px] font-mono uppercase font-bold rounded transition-colors ${
                      trafficScale === scale
                        ? 'bg-accent text-background'
                        : 'bg-surface border border-border text-text-muted hover:text-white'
                    }`}
                  >
                    {scale === 'low'
                      ? '250'
                      : scale === 'medium'
                      ? '750'
                      : scale === 'high'
                      ? '1.5k'
                      : '2.5k'}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Reliability Posture */}
            <div>
              <label className="text-[10px] font-mono uppercase text-text-muted block mb-1.5">
                Reliability Posture
              </label>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <button
                  onClick={() => setMode('fragile_naive')}
                  className={`py-1 px-1.5 rounded text-center transition-colors font-bold ${
                    mode === 'fragile_naive'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                      : 'bg-surface border border-border text-text-muted hover:text-white'
                  }`}
                  title="Include naive startup defaults for chaos testing (missing breakers, retry storm traps)"
                >
                  Naive (Chaos Ready)
                </button>
                <button
                  onClick={() => setMode('hardened')}
                  className={`py-1 px-1.5 rounded text-center transition-colors font-bold ${
                    mode === 'hardened'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-surface border border-border text-text-muted hover:text-white'
                  }`}
                  title="Include pre-configured circuit breakers, exponential jitter, and load shedding"
                >
                  Pre-Hardened
                </button>
              </div>
            </div>

            {/* SPOF Switch */}
            <div>
              <label className="text-[10px] font-mono uppercase text-text-muted block mb-1.5">
                Single Point of Failure (SPOF)
              </label>
              <button
                onClick={() => setIncludeSpof(!includeSpof)}
                className={`w-full py-1 px-2 rounded text-center font-mono text-[10px] font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  includeSpof
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {includeSpof ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Include Database SPOF</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Full Clustered Redundancy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-dim">
              Generates calibrated microservices, queues, caches, and Dagre coordinates.
            </span>
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent to-blue-500 text-background font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.35)] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSynthesizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Topology...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Architecture</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Synthesized Preview Drawer */}
          {synthesizedResult && (
            <div
              ref={previewRef}
              className="p-4 rounded-xl bg-background border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {synthesizedResult.summary.domain}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {synthesizedResult.summary.architectureName}
                    </h3>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    {synthesizedResult.summary.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="text-center px-2 py-1 bg-surface rounded border border-border">
                    <span className="text-accent font-bold">
                      {synthesizedResult.summary.servicesCount}
                    </span>
                    <span className="text-[10px] text-text-dim block">Services</span>
                  </div>
                  <div className="text-center px-2 py-1 bg-surface rounded border border-border">
                    <span className="text-cyan-400 font-bold">
                      {synthesizedResult.summary.edgesCount}
                    </span>
                    <span className="text-[10px] text-text-dim block">Edges</span>
                  </div>
                  <div className="text-center px-2 py-1 bg-surface rounded border border-border">
                    <span className="text-emerald-400 font-bold">
                      {synthesizedResult.spec.workload.base_rps}
                    </span>
                    <span className="text-[10px] text-text-dim block">Base RPS</span>
                  </div>
                </div>
              </div>

              {/* Tiers Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {synthesizedResult.summary.tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface border border-border/70 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase text-accent font-semibold block mb-1">
                        {tier.tierName}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tier.services.map((svcName, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-background border border-border text-text-primary"
                          >
                            {svcName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Insights */}
              <div className="p-3 rounded-lg bg-surface-raised border border-border/60">
                <span className="text-[10px] font-mono uppercase font-bold text-text-muted block mb-1">
                  Architecture Insights & Calibration
                </span>
                <ul className="space-y-1">
                  {synthesizedResult.summary.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deploy Action */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{synthesizedResult.summary.suggestedExperiment}</span>
                </div>
                <button
                  onClick={handleDeployToCanvas}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-background font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Deploy to Digital Twin Canvas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
