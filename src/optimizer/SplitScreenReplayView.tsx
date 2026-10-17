import React, { useState, useEffect, useMemo } from 'react';
import {
  Columns2,
  Play,
  Pause,
  RotateCcw,
  Flame,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../schema/templates';
import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from '../sim/engine';

export const SplitScreenReplayView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<
    'provider_latency' | 'flash_sale' | 'spof_crash' | 'az_outage'
  >('provider_latency');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Build baseline and hardened specs with the selected scenario fault
  const { naiveSpec, hardenedSpec } = useMemo(() => {
    const naive: ArchitectureSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    const hardened: ArchitectureSpec = JSON.parse(JSON.stringify(shopFastHardenedTemplate));

    const applyFault = (spec: ArchitectureSpec) => {
      spec.faults = [];
      if (selectedScenario === 'provider_latency') {
        spec.faults.push({
          type: 'latency',
          target: 'payment-provider',
          factor: 5,
          start_s: 30,
          end_s: 90,
        });
      } else if (selectedScenario === 'flash_sale') {
        spec.workload.pattern = 'spike';
        spec.workload.multiplier = 3.0;
      } else if (selectedScenario === 'spof_crash') {
        spec.faults.push({
          type: 'kill_instances',
          target: 'orders-db',
          percentage: 100,
          start_s: 30,
          end_s: 75,
        });
      } else if (selectedScenario === 'az_outage') {
        spec.faults.push({
          type: 'az_outage',
          zone: 'a',
          target: 'all',
          start_s: 30,
          end_s: 90,
        });
      }
    };

    applyFault(naive);
    applyFault(hardened);

    return { naiveSpec: naive, hardenedSpec: hardened };
  }, [selectedScenario]);

  // Run full batches for both sides with identical seed
  const { naiveHistory, hardenedHistory } = useMemo(() => {
    const seed = 42;
    const naiveEngine = new SimulationEngine(naiveSpec, seed);
    const hardenedEngine = new SimulationEngine(hardenedSpec, seed);

    return {
      naiveHistory: naiveEngine.runBatch(120),
      hardenedHistory: hardenedEngine.runBatch(120),
    };
  }, [naiveSpec, hardenedSpec]);

  // Animation ticker loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTimestamp) / 1000;
        if (delta >= 1 / (10 * playbackSpeed)) {
          setCurrentTime((prev) => {
            if (prev >= 120) {
              setIsPlaying(false);
              return 120;
            }
            return prev + 1;
          });
          lastTimestamp = now;
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed]);

  const naiveTick: SimulationTickMetrics = naiveHistory[currentTime] || naiveHistory[0];
  const hardenedTick: SimulationTickMetrics = hardenedHistory[currentTime] || hardenedHistory[0];

  const moneySaved = Math.max(0, naiveTick.cumulativeMoneyLostInr - hardenedTick.cumulativeMoneyLostInr);

  return (
    <div className="w-full h-full flex flex-col bg-background text-text-primary overflow-y-auto p-4 select-none custom-scrollbar">
      {/* Top Header & Synchronized Replay Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-border gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/30">
            <Columns2 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-wide">
              Split-Screen Synchronized Replay (Deterministic Seed = 42)
            </h2>
            <p className="text-[11px] text-text-muted">
              Live side-by-side contrast of unhardened cascading collapse vs. auto-hardened resilience
            </p>
          </div>
        </div>

        {/* Preset Disaster Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-mono">Disaster:</span>
          <select
            value={selectedScenario}
            onChange={(e) => {
              setSelectedScenario(e.target.value as any);
              setCurrentTime(0);
              setIsPlaying(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-primary font-medium focus:outline-none focus:border-accent"
          >
            <option value="provider_latency">External Gateway 5× Latency Hang</option>
            <option value="flash_sale">3× Flash Crowd Traffic Spike</option>
            <option value="spof_crash">Orders DB (SPOF) 100% Outage</option>
            <option value="az_outage">Availability Zone A Datacenter Outage</option>
          </select>
        </div>
      </div>

      {/* Synchronized Timeline Scrubber Bar */}
      <div className="my-3 p-3 rounded-xl bg-surface-raised border border-border shadow-noc flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-accent hover:bg-accent-hover text-background font-bold transition-all shadow-noc"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="p-2 rounded-lg bg-surface border border-border text-text-muted hover:text-text-primary transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Time Slider */}
        <div className="flex-1 flex items-center gap-3">
          <span className="font-mono text-xs text-accent font-bold min-w-[45px]">
            {currentTime}s
          </span>
          <input
            type="range"
            min={0}
            max={120}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="flex-1 h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
          />
          <span className="font-mono text-xs text-text-dim">120s</span>
        </div>

        {/* Playback speed buttons */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5 text-xs font-mono">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-0.5 rounded transition-all ${
                playbackSpeed === spd
                  ? 'bg-accent text-background font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>

      {/* Center Impact Difference Pill */}
      <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-around text-xs shadow-noc my-1 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-text-dim">Success Rate Delta:</span>
          <span className="text-emerald-400 font-bold">
            +{Math.round((hardenedTick.userSuccessRate - naiveTick.userSuccessRate) * 10) / 10}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-dim">Latency Reduction:</span>
          <span className="text-accent font-bold">
            -{Math.max(0, Math.round(naiveTick.userP95Ms - hardenedTick.userP95Ms))}ms
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-dim">Disaster Loss Averted:</span>
          <span className="text-amber-400 font-bold">
            ₹{moneySaved.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Dual Split Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mt-2">
        {/* LEFT: Unhardened Baseline */}
        <div className="p-4 rounded-xl bg-surface-raised border border-rose-500/30 shadow-noc flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Unhardened Architecture
                  </h3>
                  <span className="text-[10px] text-rose-400 font-mono">Naive Defaults (L1–L16 Violations)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                CASCADING COLLAPSE
              </span>
            </div>

            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Success Rate</span>
                <span
                  className={`text-lg font-bold ${
                    naiveTick.userSuccessRate >= 80
                      ? 'text-emerald-400'
                      : naiveTick.userSuccessRate >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {naiveTick.userSuccessRate}%
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">p95 Latency</span>
                <span className="text-lg font-bold text-text-primary">
                  {naiveTick.userP95Ms}ms
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Amplification</span>
                <span className="text-lg font-bold text-amber-400">
                  {naiveTick.amplification}×
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Money Lost</span>
                <span className="text-lg font-bold text-rose-400 truncate block">
                  ₹{naiveTick.cumulativeMoneyLostInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Observed Failure Behaviors */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                Active Failure Dynamics at {currentTime}s:
              </div>
              {naiveTick.amplification > 1.5 && (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Retry Storm Amplification: Unbounded retries multiplied load {naiveTick.amplification}×.</span>
                </div>
              )}
              {naiveTick.crashedInstances > 0 && (
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Crash Loop: {naiveTick.crashedInstances} replicas died from memory/thread exhaustion.</span>
                </div>
              )}
              {naiveTick.userSuccessRate < 80 && naiveTick.amplification <= 1.5 && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thread Starvation: Synchronous caller workers locked waiting for downstream response.</span>
                </div>
              )}
              {naiveTick.userSuccessRate >= 80 && (
                <div className="p-2 rounded bg-surface border border-border text-text-dim">
                  Normal baseline operations prior to incident onset.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Hardened Architecture */}
        <div className="p-4 rounded-xl bg-surface-raised border border-emerald-500/30 shadow-noc flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                    Hardened Architecture
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono">Auto-Harden Config (Circuit Breakers + Load Shedding)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                HIGH RESILIENCE
              </span>
            </div>

            {/* KPI Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs font-mono">
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Success Rate</span>
                <span className="text-lg font-bold text-emerald-400">
                  {hardenedTick.userSuccessRate}%
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">p95 Latency</span>
                <span className="text-lg font-bold text-text-primary">
                  {hardenedTick.userP95Ms}ms
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Amplification</span>
                <span className="text-lg font-bold text-emerald-400">
                  {hardenedTick.amplification}×
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-text-dim block">Money Lost</span>
                <span className="text-lg font-bold text-text-primary truncate block">
                  ₹{hardenedTick.cumulativeMoneyLostInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Active Protection Mechanisms */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-text-dim uppercase tracking-wider mb-1">
                Active Resilience Guards at {currentTime}s:
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Circuit Breakers: Fast-fail trips under failure rate threshold, instantly returning fallbacks.</span>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exponential Jitter: Random backoff prevents resonant synchronized retry surges.</span>
              </div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-AZ Standby: Automatic replica failover eliminates single point of failure outages.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
