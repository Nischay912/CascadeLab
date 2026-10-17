import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  ShieldAlert,
  Zap,
  Activity,
  Maximize2,
  FileText,
  Flame,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { ResilienceRing } from './ResilienceRing';

interface TopNavProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  selectedTemplate: string;
  onSelectTemplate: (tpl: string) => void;
  selectedScenario: string;
  onSelectScenario: (sc: string) => void;
  resilienceScore: number;
  onAutoHarden: () => void;
  onOpenBreakIt: () => void;
  onOpenPostmortem: () => void;
  onOpenRealityCheck: () => void;
  isPresenterMode: boolean;
  onTogglePresenterMode: () => void;
  userSuccessRate?: number;
  userP95Ms?: number;
  cumulativeMoneyLostInr?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  onToggleRun,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  selectedTemplate,
  onSelectTemplate,
  selectedScenario,
  onSelectScenario,
  resilienceScore,
  onAutoHarden,
  onOpenBreakIt,
  onOpenPostmortem,
  onOpenRealityCheck,
  isPresenterMode,
  onTogglePresenterMode,
  userSuccessRate = 99.2,
  userP95Ms = 410,
  cumulativeMoneyLostInr = 0,
}) => {
  return (
    <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between gap-4 select-none flex-shrink-0 z-30 shadow-noc">
      {/* Left: Brand & Selectors */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_12px_rgba(56,189,248,0.3)]">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-text-primary">CascadeLab</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono bg-accent/20 text-accent rounded font-medium border border-accent/30">
                NOC Twin
              </span>
            </div>
            <p className="text-[10px] text-text-muted hidden sm:block">Microservice Resilience Simulator</p>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border mx-1" />

        {/* Template Selector */}
        <div className="relative group">
          <select
            value={selectedTemplate}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="appearance-none bg-surface-raised hover:bg-surface-hover border border-border text-text-primary text-xs font-medium py-1.5 pl-3 pr-7 rounded-md cursor-pointer transition-colors focus:outline-none focus:border-accent"
          >
            <option value="shopfast">ShopFast (Naive - 13 Services)</option>
            <option value="shopfast_hardened">ShopFast (Hardened Reference)</option>
            <option value="ridehailing">Ride-Hailing Fleet</option>
            <option value="streaming">Video Streaming Edge</option>
            <option value="payments">UPI / Payments Switch</option>
            <option value="quickcommerce">Quick-Commerce Delivery</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Scenario Selector */}
        <div className="relative group">
          <select
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="appearance-none bg-surface-raised hover:bg-surface-hover border border-border text-text-primary text-xs font-medium py-1.5 pl-3 pr-7 rounded-md cursor-pointer transition-colors focus:outline-none focus:border-accent"
          >
            <option value="baseline">Baseline (600 RPS, Normal)</option>
            <option value="flash_sale">Flash Sale (3x Surge Peak)</option>
            <option value="provider_latency">Payment Provider Latency 5x</option>
            <option value="az_outage">Zone B Availability Outage</option>
            <option value="cache_flush">Redis Cache Wipe (Herd)</option>
            <option value="gray_failure">Silent Gray Failure</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-2 bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
        <button
          onClick={onToggleRun}
          title={isRunning ? 'Pause simulation (Space)' : 'Start simulation (Space)'}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-status-degraded/20 text-status-degraded hover:bg-status-degraded/30 border border-status-degraded/30'
              : 'bg-accent/20 text-accent hover:bg-accent/30 border border-accent/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isRunning ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={onStep}
          title="Step 1 second forward"
          className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          title="Reset simulation state (R)"
          className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-border mx-0.5" />

        {/* Speed selectors */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {[1, 4, 16].map((s) => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                speed === s
                  ? 'bg-accent text-background font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        <div className="h-4 w-[1px] bg-border mx-0.5" />
        <span className="text-[10px] font-mono text-text-dim px-1" title="Deterministic Mulberry32 seed">
          Seed: <span className="text-text-muted">42</span>
        </span>
      </div>

      {/* Right: Live Telemetry & Actions */}
      <div className="flex items-center gap-3">
        {/* SLO Pill */}
        <div className="hidden lg:flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-md border border-border text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              userSuccessRate >= 99
                ? 'bg-status-healthy animate-pulse'
                : userSuccessRate >= 90
                ? 'bg-status-degraded'
                : 'bg-status-failing animate-ping'
            }`}
          />
          <span className="font-mono font-medium text-text-primary tabular-nums">
            {userSuccessRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-text-muted">SLO</span>
        </div>

        {/* p95 Pill */}
        <div className="hidden xl:flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-md border border-border text-xs">
          <Activity className="w-3 h-3 text-accent" />
          <span className="text-text-muted text-[10px]">p95:</span>
          <span
            className={`font-mono font-medium tabular-nums ${
              userP95Ms > 800 ? 'text-status-failing font-bold' : 'text-text-primary'
            }`}
          >
            {Math.round(userP95Ms)}ms
          </span>
        </div>

        {/* ₹ Lost Counter */}
        <div className="hidden md:flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-md border border-border text-xs font-mono">
          <span
            className={`font-bold tabular-nums ${
              cumulativeMoneyLostInr > 0 ? 'text-status-failing' : 'text-text-muted'
            }`}
          >
            ₹ {Math.round(cumulativeMoneyLostInr).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-text-dim">lost</span>
        </div>

        {/* Resilience Ring */}
        <ResilienceRing score={resilienceScore} />

        {/* Primary Action: Auto-Harden */}
        <button
          onClick={onAutoHarden}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent to-blue-500 text-background font-semibold text-xs rounded-md shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:brightness-110 active:scale-95 transition-all"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Auto-Harden</span>
        </button>

        {/* Quick Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenBreakIt}
            title="Break It! (Chaos Challenge Game)"
            className="p-1.5 rounded hover:bg-surface-hover text-status-degraded hover:text-white transition-colors"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenPostmortem}
            title="Generate SRE Postmortem"
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenRealityCheck}
            title="Reality Check (Real-stack vs simulation validation)"
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePresenterMode}
            title={isPresenterMode ? 'Exit Presenter Mode' : 'Enter Presenter Mode (Large screens / projector)'}
            className={`p-1.5 rounded transition-colors ${
              isPresenterMode
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-surface-hover text-text-muted hover:text-text-primary'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
