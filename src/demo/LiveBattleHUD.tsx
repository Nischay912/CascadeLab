import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  ShieldCheck,
  Clock,
  Zap,
  TrendingDown,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import { useSimulationStore } from '../state/useSimulationStore';
import { DEFEND_IT_MOVES } from './defendItEngine';

export interface LiveBattleState {
  mode: 'break_it' | 'defend_it';
  cards?: string[];
  playerName?: string;
  deployedMoves?: string[];
  initialTime?: number;
}

interface LiveBattleHUDProps {
  battle: LiveBattleState;
  onFinishBattle: (finalMetrics?: any) => void;
  onCancelBattle: () => void;
}

export const LiveBattleHUD: React.FC<LiveBattleHUDProps> = ({
  battle,
  onFinishBattle,
  onCancelBattle,
}) => {
  const { currentSpec, setSpec } = useArchitectureStore();
  const { currentMetrics, isRunning, toggleRunning } = useSimulationStore();

  const totalDuration = battle.mode === 'break_it' ? 30 : 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDuration);
  const [deployedMoves, setDeployedMoves] = useState<string[]>(battle.deployedMoves || []);
  const [peakMoneyLost, setPeakMoneyLost] = useState<number>(0);
  const [peakBlastRadius, setPeakBlastRadius] = useState<number>(0);

  const peakMoneyLostRef = useRef(0);
  const peakBlastRadiusRef = useRef(0);
  const deployedMovesRef = useRef<string[]>(battle.deployedMoves || []);

  // Track peak damage metrics live from real simulation telemetry
  useEffect(() => {
    if (currentMetrics) {
      const money = currentMetrics.cumulativeMoneyLostInr || 0;
      if (money > peakMoneyLostRef.current) {
        peakMoneyLostRef.current = money;
        setPeakMoneyLost(money);
      }
      const degradedCount = Object.values(currentMetrics.services || {}).filter(
        (s) => s.utilization > 0.85 || s.successRate < 90 || s.queue > 10 || s.instancesCrashed > 0
      ).length;
      const blastPct = Math.round((degradedCount / Math.max(1, currentSpec.services.length)) * 100);
      if (blastPct > peakBlastRadiusRef.current) {
        peakBlastRadiusRef.current = blastPct;
        setPeakBlastRadius(blastPct);
      }
    }
  }, [currentMetrics, currentSpec.services.length]);

  const handleFinish = () => {
    onFinishBattle({
      peakMoneyLost: peakMoneyLostRef.current,
      peakBlastRadius: peakBlastRadiusRef.current,
      deployedMoves: deployedMovesRef.current,
    });
  };

  // Live battle countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Ensure simulation is running at speed 2x or 4x
  useEffect(() => {
    if (!isRunning) {
      toggleRunning();
    }
  }, []);

  const handleApplyDefenseMove = (moveId: string) => {
    if (deployedMovesRef.current.includes(moveId) || deployedMovesRef.current.length >= 3) return;

    const move = DEFEND_IT_MOVES.find((m) => m.id === moveId);
    if (!move) return;

    const cloned = JSON.parse(JSON.stringify(currentSpec));
    const updated = move.applyMove(cloned);
    setSpec(updated);
    const updatedMoves = [...deployedMovesRef.current, moveId];
    deployedMovesRef.current = updatedMoves;
    setDeployedMoves(updatedMoves);
  };

  const progressPct = ((totalDuration - secondsRemaining) / totalDuration) * 100;
  const liveSuccessRate = currentMetrics?.userSuccessRate ?? 100;

  // Active combo multiplier for Break It derived from live retry amplification and active faults
  const liveAmplification = currentMetrics?.amplification ?? 1.0;
  const comboMultiplier =
    currentMetrics?.activeFaults && currentMetrics.activeFaults.length > 1
      ? 2.5
      : liveAmplification > 2
      ? 2.0
      : liveAmplification > 1.2
      ? 1.5
      : 1.0;

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`rounded-2xl border backdrop-blur-md p-4 shadow-2xl transition-all ${
          battle.mode === 'break_it'
            ? 'bg-surface-raised/95 border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.35)]'
            : 'bg-surface-raised/95 border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
        }`}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/80">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                battle.mode === 'break_it'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {battle.mode === 'break_it' ? <Flame className="w-4 h-4 animate-bounce" /> : <ShieldAlert className="w-4 h-4 animate-pulse" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wider text-text-primary">
                  {battle.mode === 'break_it' ? '🔥 CHAOS ATTACK BATTLE IN PROGRESS' : '🚨 SEV-1 OUTAGE: INCIDENT COMMANDER DRILL'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/30 animate-pulse">
                  4× SPEED
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                {battle.mode === 'break_it'
                  ? `Player: ${battle.playerName || 'Guest Judge'} • Attacks Active: ${battle.cards?.length || 2} Disasters`
                  : 'Deploy up to 3 emergency countermeasures to restore SLO ≥ 85% before time runs out!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFinish}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 ${
                battle.mode === 'break_it'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              Finish & Score
            </button>
            <button
              onClick={onCancelBattle}
              className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary border border-transparent hover:border-border transition-colors"
              title="Abort Battle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-2">
          {/* Timer */}
          <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
            <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-accent" />
              <span>Time Left</span>
            </span>
            <span className="text-xl font-black font-mono text-accent tabular-nums">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-1 mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  battle.mode === 'break_it' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${100 - progressPct}%` }}
              />
            </div>
          </div>

          {/* User Success Rate / Blast Radius */}
          {battle.mode === 'break_it' ? (
            <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span>Blast Radius</span>
              </span>
              <span className="text-xl font-black font-mono text-rose-400 tabular-nums">
                {peakBlastRadius}% <span className="text-xs font-normal text-text-dim">fleet</span>
              </span>
              <span className="text-[10px] text-text-muted truncate">
                {Math.round(currentMetrics?.entryRps ?? 0)} Ingress RPS
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>SLO Health</span>
              </span>
              <span
                className={`text-xl font-black font-mono tabular-nums ${
                  liveSuccessRate >= 85
                    ? 'text-status-healthy'
                    : liveSuccessRate >= 60
                    ? 'text-status-degraded'
                    : 'text-status-failing'
                }`}
              >
                {liveSuccessRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-text-muted">Target: ≥ 85% SLO</span>
            </div>
          )}

          {/* Financial Damage Live */}
          <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
            <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
              <span className="text-rose-400 font-bold">₹</span>
              <span>Damage Done</span>
            </span>
            <span className="text-xl font-black font-mono text-rose-400 tabular-nums truncate">
              ₹{Math.round(peakMoneyLost || currentMetrics?.cumulativeMoneyLostInr || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-text-dim">Revenue bleed</span>
          </div>

          {/* Combo / Moves */}
          {battle.mode === 'break_it' ? (
            <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Combo Multi</span>
              </span>
              <span className="text-xl font-black font-mono text-amber-400 tabular-nums">
                {comboMultiplier.toFixed(1)}×
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">RETRY WAVE</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-surface border border-border flex flex-col">
              <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-accent" />
                <span>Moves Used</span>
              </span>
              <span className="text-xl font-black font-mono text-accent tabular-nums">
                {deployedMoves.length} / 3
              </span>
              <span className="text-[10px] text-text-muted">Emergency budget</span>
            </div>
          )}
        </div>

        {/* Mode Specific Interactive Control Bar */}
        {battle.mode === 'defend_it' && (
          <div className="mt-3 pt-2.5 border-t border-border flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-text-primary whitespace-nowrap">
              Deploy Countermeasure ({3 - deployedMoves.length} left):
            </span>
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
              {DEFEND_IT_MOVES.slice(0, 4).map((m) => {
                const isUsed = deployedMoves.includes(m.id);
                return (
                  <button
                    key={m.id}
                    disabled={isUsed || deployedMoves.length >= 3}
                    onClick={() => handleApplyDefenseMove(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                      isUsed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                        : deployedMoves.length >= 3
                        ? 'opacity-40 bg-surface border border-border cursor-not-allowed text-text-dim'
                        : 'bg-surface hover:bg-surface-hover border border-accent/40 text-accent hover:border-accent active:scale-95'
                    }`}
                  >
                    <span>{isUsed ? '✓' : '+'}</span>
                    <span className="truncate max-w-[130px]">{m.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
