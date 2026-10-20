import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  ShieldAlert,
  Flame,
  FileText,
  Layers,
  ChevronDown,
  Activity,
  Zap,
  Maximize2,
  Trash2,
  Bot,
} from 'lucide-react';
import { ResilienceRing } from './ResilienceRing';
import { CustomArchitectureEntry } from '../state/useArchitectureStore';
import { DefconLevel } from '../commander/types';

interface TopNavProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onStep: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  selectedTemplate: string;
  onSelectTemplate: (templateKey: string) => void;
  customArchitectures?: CustomArchitectureEntry[];
  onDeleteCustomArchitecture?: () => void;
  selectedScenario: string;
  onSelectScenario: (scenarioKey: string) => void;
  onAutoHarden: () => void;
  onOpenCommander?: () => void;
  commanderThreatLevel?: DefconLevel;
  onOpenBreakIt: () => void;
  onOpenDefendIt?: () => void;
  onOpenPostmortem: () => void;
  onOpenRealityCheck: () => void;
  isPresenterMode?: boolean;
  onTogglePresenterMode?: () => void;
  resilienceScore?: number;
  userSuccessRate?: number;
  userP95Ms?: number;
  cumulativeMoneyLostInr?: number;
  valuePerRequestInr?: number;
  onUpdateValuePerRequest?: (val: number) => void;
  onInjectFault?: (faultType: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  onToggleRun,
  onReset,
  onStep,
  speed,
  onChangeSpeed,
  selectedTemplate,
  onSelectTemplate,
  customArchitectures,
  onDeleteCustomArchitecture,
  selectedScenario,
  onSelectScenario,
  onAutoHarden,
  onOpenCommander,
  commanderThreatLevel = 'DEFCON_5',
  onOpenBreakIt,
  onOpenDefendIt,
  onOpenPostmortem,
  onOpenRealityCheck,
  isPresenterMode = false,
  onTogglePresenterMode,
  resilienceScore = 15,
  userSuccessRate = 100,
  userP95Ms = 45,
  cumulativeMoneyLostInr = 0,
  valuePerRequestInr = 500,
  onUpdateValuePerRequest,
  onInjectFault,
}) => {
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(String(valuePerRequestInr));

  return (
    <header
      data-testid="top-nav"
      className="h-14 border-b border-border bg-surface px-2 sm:px-3 flex items-center justify-between gap-1.5 select-none z-30 flex-shrink-0 w-full overflow-hidden"
    >
      {/* Left: Brand + Architecture / Scenario Selectors */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_12px_rgba(56,189,248,0.3)] flex-shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm tracking-tight text-text-primary">CascadeLab</span>
            <span className="px-1.5 py-0.5 text-xs font-mono bg-accent/20 text-accent rounded font-bold border border-accent/30 hidden md:inline">
              NOC
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border mx-0.5 hidden sm:block" />

        {/* Template Selector */}
        <div className="relative group">
          <select
            value={selectedTemplate}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="appearance-none bg-surface-raised hover:bg-surface-hover border border-border text-text-primary text-xs font-medium py-1.5 pl-2 pr-6 rounded-md cursor-pointer transition-colors focus:outline-none focus:border-accent max-w-[130px] sm:max-w-[155px] truncate"
            title="Switch microservices architecture"
          >
            <optgroup label="Default Benchmark Architectures">
              <option value="shopfast">ShopFast (Naive - 13 Services)</option>
              <option value="shopfast_hardened">ShopFast (Hardened Reference)</option>
              <option value="ridehailing">Ride-Hailing Fleet (6 Services)</option>
              <option value="streaming">Video Streaming Edge (7 Services)</option>
              <option value="payments">UPI / Payments Switch (8 Services)</option>
              <option value="quickcommerce">Quick-Commerce Delivery (6 Services)</option>
            </optgroup>
            {customArchitectures && customArchitectures.length > 0 && (
              <optgroup label="Custom / Imported Architectures">
                {customArchitectures.map((arch) => (
                  <option key={arch.id} value={arch.id}>
                    {arch.name} ({arch.spec.services.length} services)
                  </option>
                ))}
              </optgroup>
            )}
            {/* Fallback for legacy state keys if not found in customArchitectures list */}
            {['imported', 'custom', 'docker-compose'].includes(selectedTemplate) &&
              (!customArchitectures || !customArchitectures.some((c) => c.id === selectedTemplate)) && (
                <optgroup label="Imported Architecture">
                  <option value={selectedTemplate}>Custom Architecture (Imported)</option>
                </optgroup>
              )}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Delete / Unload Custom Architecture Action */}
        {(selectedTemplate.startsWith('custom_') ||
          ['imported', 'custom', 'docker-compose'].includes(selectedTemplate) ||
          Boolean(customArchitectures && customArchitectures.some((c) => c.id === selectedTemplate))) &&
          onDeleteCustomArchitecture && (
            <button
              onClick={onDeleteCustomArchitecture}
              className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center justify-center hover:shadow-noc active:scale-95 flex-shrink-0"
              title="Delete current custom architecture"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

        {/* Scenario Selector */}
        <div className="relative group hidden sm:block">
          <select
            value={selectedScenario}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="appearance-none bg-surface-raised hover:bg-surface-hover border border-border text-text-primary text-xs font-medium py-1.5 pl-2 pr-6 rounded-md cursor-pointer transition-colors focus:outline-none focus:border-accent max-w-[130px] lg:max-w-[155px] truncate"
          >
            <option value="baseline">Baseline (600 RPS, Normal)</option>
            <option value="flash_sale">Flash Sale (3x Surge Peak)</option>
            <option value="provider_latency">Payment Provider Latency 5x</option>
            <option value="az_outage">Zone B Availability Outage</option>
            <option value="cache_flush">Redis Cache Wipe (Herd)</option>
            <option value="gray_failure">Silent Gray Failure</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Inject Fault Dropdown (Only on wide 1750px+ screens; on smaller screens use Left Panel Fault Deck) */}
        {onInjectFault && (
          <div className="relative group hidden min-[1750px]:block">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onInjectFault(e.target.value);
                  e.target.value = '';
                }
              }}
              className="appearance-none bg-status-failing/15 hover:bg-status-failing/25 border border-status-failing/40 text-status-failing text-xs font-semibold py-1.5 pl-2 pr-6 rounded-md cursor-pointer transition-colors focus:outline-none focus:border-status-failing max-w-[125px] truncate"
            >
              <option value="" disabled>⚡ Fault</option>
              <option value="latency">Payment Latency (5×)</option>
              <option value="kill_instances">Kill 50% Auth Nodes</option>
              <option value="kill_100">Kill Orders DB (SPOF)</option>
              <option value="cache_flush">Redis Cache Wipe</option>
              <option value="az_outage">Zone B AZ Outage</option>
              <option value="gray_failure">Gray Silent Failure</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-status-failing absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 bg-surface-raised px-1.5 sm:px-2 py-1 rounded-lg border border-border flex-shrink-0">
        <button
          onClick={onToggleRun}
          title={isRunning ? 'Pause simulation (Space)' : 'Start simulation (Space)'}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            isRunning
              ? 'bg-status-degraded/20 text-status-degraded hover:bg-status-degraded/30 border border-status-degraded/30'
              : 'bg-accent text-background hover:brightness-110 font-bold'
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={onStep}
          title="Step 1 second forward"
          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          title="Reset simulation state (R)"
          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-border mx-0.5" />

        {/* Speed selectors */}
        <div className="flex items-center gap-0.5 text-xs font-mono">
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

        <div className="h-4 w-[1px] bg-border mx-0.5 hidden 2xl:block" />
        <span className="text-xs font-mono text-text-muted px-1 hidden 2xl:inline" title="Deterministic Mulberry32 seed">
          Seed: <span className="text-text-primary font-bold">42</span>
        </span>
      </div>

      {/* Right: Live Telemetry & Actions (Fits cleanly without overflowing) */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Live Scenario Ingress Success Pill */}
        <div
          data-testid="live-success"
          className="flex items-center gap-1 bg-surface-raised px-2 py-1 rounded-md border border-border text-xs font-mono flex-shrink-0"
          title="Live Scenario Ingress Success Rate (SLO target: 99.0%)"
        >
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              userSuccessRate >= 99
                ? 'bg-status-healthy animate-pulse'
                : userSuccessRate >= 90
                ? 'bg-status-degraded'
                : 'bg-status-failing animate-ping'
            }`}
          />
          <span className="font-bold text-text-primary tabular-nums">
            {userSuccessRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-text-muted hidden xl:inline">Live</span>
        </div>

        {/* p95 Pill (Only on wide 1750px+ screens; also permanently displayed in footer timeline) */}
        <div className="hidden min-[1750px]:flex items-center gap-1.5 bg-surface-raised px-2.5 py-1 rounded-md border border-border text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="text-text-muted">p95:</span>
          <span
            className={`font-bold tabular-nums ${
              userP95Ms > 800 ? 'text-status-failing font-bold' : 'text-text-primary'
            }`}
          >
            {Math.round(userP95Ms)}ms
          </span>
        </div>

        {/* ₹ Lost Counter */}
        <div
          data-testid="money-lost"
          className="flex items-center gap-1 sm:gap-1.5 bg-surface-raised hover:bg-surface-hover px-2 sm:px-2.5 py-1 rounded-md border border-border text-xs font-mono cursor-pointer transition-colors"
          title={`Financial Loss Model (Spec §3.3):\nTotal Lost = Failed User Journeys × ₹${valuePerRequestInr} (Gross Value per Transaction).\nClick to edit default ₹${valuePerRequestInr} assumption.`}
          onClick={() => setIsEditingValue((prev) => !prev)}
        >
          {isEditingValue ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-text-muted">₹</span>
              <input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => {
                  const val = Number(tempValue);
                  if (val > 0 && onUpdateValuePerRequest) onUpdateValuePerRequest(val);
                  setIsEditingValue(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = Number(tempValue);
                    if (val > 0 && onUpdateValuePerRequest) onUpdateValuePerRequest(val);
                    setIsEditingValue(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingValue(false);
                  }
                }}
                className="w-16 bg-surface border border-accent text-accent font-bold px-1 py-0.5 rounded text-xs focus:outline-none"
                autoFocus
              />
              <span className="text-[10px] text-accent">↵</span>
            </div>
          ) : (
            <>
              <span
                className={`font-bold tabular-nums ${
                  cumulativeMoneyLostInr > 0 ? 'text-status-failing' : 'text-text-muted'
                }`}
              >
                ₹ {Math.round(cumulativeMoneyLostInr).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-text-dim hidden xl:inline">lost</span>
              <span className="text-[9px] text-accent/70 hover:text-accent ml-0.5 hidden min-[1750px]:inline" title="Gross Merchandise Value per transaction">(₹{valuePerRequestInr})</span>
            </>
          )}
        </div>

        {/* Resilience Ring */}
        <ResilienceRing score={resilienceScore} />

        {/* Primary Action: Auto-Harden */}
        <button
          onClick={onAutoHarden}
          title="Auto-Harden optimizer (searches optimal circuit breakers, timeouts, retries)"
          className="flex items-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-accent to-blue-500 text-background font-bold text-xs rounded-md shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:brightness-110 active:scale-95 transition-all flex-shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Auto-Harden</span>
        </button>

        {/* AI Autonomous Incident Commander Action */}
        {onOpenCommander && (
          <button
            onClick={onOpenCommander}
            title="Open AI Autonomous Incident Commander (AIOps Threat Radar & Self-Healing)"
            className={`flex items-center gap-1.5 px-2 py-1.5 font-bold text-xs rounded-md transition-all active:scale-95 border flex-shrink-0 ${
              commanderThreatLevel === 'DEFCON_1'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-pulse'
                : commanderThreatLevel === 'DEFCON_2'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                : commanderThreatLevel === 'DEFCON_3'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-surface-raised hover:bg-surface-hover text-text-primary border-border hover:border-accent/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="hidden min-[1650px]:inline">AI Commander</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold leading-none flex-shrink-0 ${
                commanderThreatLevel === 'DEFCON_1'
                  ? 'bg-rose-500 text-white'
                  : commanderThreatLevel === 'DEFCON_2'
                  ? 'bg-orange-500 text-white'
                  : commanderThreatLevel === 'DEFCON_3'
                  ? 'bg-amber-500 text-black'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {commanderThreatLevel ? commanderThreatLevel.replace('_', ' ') : 'DEFCON 5'}
            </span>
          </button>
        )}

        {/* Quick Tools */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={onOpenBreakIt}
            title="Break It! (Chaos Challenge Game)"
            className="p-1.5 rounded hover:bg-surface-hover text-status-degraded hover:text-white transition-colors"
          >
            <Flame className="w-4 h-4" />
          </button>
          {onOpenDefendIt && (
            <button
              onClick={onOpenDefendIt}
              title="Defend It! (Live Incident Commander Game)"
              className="p-1.5 rounded hover:bg-surface-hover text-emerald-400 hover:text-white transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          )}
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
