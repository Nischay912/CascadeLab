import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bot,
} from 'lucide-react';
import { DEFEND_IT_MOVES, evaluateDefendItRun } from './defendItEngine';
import { DefendItResult } from './types';

interface DefendItModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DefendItModal: React.FC<DefendItModalProps> = ({ isOpen, onClose }) => {
  const [selectedMoves, setSelectedMoves] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [result, setResult] = useState<DefendItResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMoves([]);
      setTimeLeft(90);
      setIsTimerRunning(true);
      setResult(null);
      return;
    }

    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0 && !result) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning, timeLeft, result]);

  if (!isOpen) return null;

  const toggleMove = (moveId: string) => {
    if (selectedMoves.includes(moveId)) {
      setSelectedMoves(selectedMoves.filter((id) => id !== moveId));
    } else if (selectedMoves.length < 3) {
      setSelectedMoves([...selectedMoves, moveId]);
    }
  };

  const handleDeployDefenses = () => {
    setIsTimerRunning(false);
    const res = evaluateDefendItRun(selectedMoves);
    setResult(res);
  };

  const handleRestart = () => {
    setSelectedMoves([]);
    setTimeLeft(90);
    setIsTimerRunning(true);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-surface-raised border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-text-primary">
        {/* Top Header */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  "Defend It!" Incident Triage Challenge
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  PICK UP TO 3 MOVES
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                A live P1 cascade is raging. You have 90 seconds and 3 config edits to restore SLO!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Countdown Clock */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
                timeLeft < 20
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-surface border-border text-amber-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-muted hover:text-text-primary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs custom-scrollbar">
          {/* Active Emergency Banner */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 shadow-noc">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-rose-400 font-bold block mb-0.5">
                Active Incident Alert: Payment Hang + 2.5× Traffic Flash Crowd
              </strong>
              <span>
                Downstream Payment Gateway is taking 600ms+ per call. Upstream checkout threads are exhausted by retries, causing entry brownout. User success rate has plummeted below 35%!
              </span>
            </div>
          </div>

          {/* Defense Moves Selection (if not submitted) */}
          {!result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                  Available SRE Defense Moves:
                </span>
                <span className="font-mono text-xs font-bold text-accent">
                  Selected: {selectedMoves.length} / 3 Moves
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFEND_IT_MOVES.map((move) => {
                  const isSelected = selectedMoves.includes(move.id);
                  const canSelect = isSelected || selectedMoves.length < 3;

                  return (
                    <div
                      key={move.id}
                      onClick={() => canSelect && toggleMove(move.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-noc'
                          : canSelect
                          ? 'bg-surface border-border hover:border-text-muted hover:bg-surface-raised'
                          : 'bg-surface/50 border-border/40 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              move.costDeltaInr > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {move.costDeltaInr > 0
                              ? `+₹${move.costDeltaInr.toLocaleString('en-IN')}/mo`
                              : 'Free (₹0)'}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> DEPLOYED
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-text-primary mb-1">
                          {move.title}
                        </h4>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          {move.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={handleDeployDefenses}
                  disabled={selectedMoves.length === 0}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold shadow-noc transition-all ${
                    selectedMoves.length === 0
                      ? 'bg-surface-raised text-text-muted cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-background font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 fill-current" />
                  <span>Deploy Selected Defenses ({selectedMoves.length}/3)</span>
                </button>
              </div>
            </div>
          )}

          {/* Defense Result Screen */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Scorecard */}
              <div
                className={`p-5 rounded-xl border shadow-noc ${
                  result.stars === 3
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : result.stars === 2
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-rose-500/10 border-rose-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-border gap-2 mb-3">
                  <div>
                    <span className="text-xl font-bold">
                      {result.stars === 3 ? '⭐⭐⭐ SRE HERO' : result.stars === 2 ? '⭐⭐ SERVICE DEGRADED' : '💀 PLATFORM COLLAPSE'}
                    </span>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {result.sloAchieved ? 'User SLO Restored Above 94%' : 'Failed to Rescue Platform SLO'}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className={`text-2xl font-bold ${
                        result.playerSuccessRate >= 94
                          ? 'text-emerald-400'
                          : result.playerSuccessRate >= 80
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {result.playerSuccessRate}%
                    </span>
                    <span className="text-[10px] text-text-dim block">success during disaster</span>
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  {result.commentary}
                </p>

                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-2.5 rounded bg-surface border border-border">
                    <span className="text-[10px] text-text-dim block">Financial Loss</span>
                    <span className="text-sm font-bold text-rose-400">
                      ₹{result.playerMoneyLostInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-surface border border-border">
                    <span className="text-[10px] text-text-dim block">p95 Latency</span>
                    <span className="text-sm font-bold text-accent">
                      {result.playerLatencyP95} ms
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto-Harden Optimiser Comparison Card */}
              <div className="p-4 rounded-xl bg-surface border border-accent/40 shadow-noc">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-accent" />
                  <h4 className="font-bold text-xs text-text-primary">
                    CascadeLab Auto-Harden Optimiser's Answer:
                  </h4>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed mb-3">
                  The Auto-Harden optimiser selected: <strong>Circuit Breaker on Payments</strong> + <strong>Full Jitter Backoff</strong> + <strong>API Gateway Load Shedding</strong>.
                  Achieved <strong>{result.autoHardenSuccessRate}% success</strong> with <strong>₹0 extra monthly cost</strong>!
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-hover border border-border text-xs text-text-primary transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Defense Strategy</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
