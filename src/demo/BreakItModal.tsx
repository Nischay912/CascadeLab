import React, { useState } from 'react';
import {
  Flame,
  X,
  Trophy,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { useArchitectureStore } from '../state/useArchitectureStore';
import {
  AVAILABLE_CHAOS_CARDS,
  CHAOS_BUDGET,
  evaluateBreakItRun,
  getLeaderboard,
  saveLeaderboardScore,
} from './breakItEngine';
import { BreakItScore } from './types';

interface BreakItModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BreakItModal: React.FC<BreakItModalProps> = ({ isOpen, onClose }) => {
  const currentSpec = useArchitectureStore((state) => state.currentSpec);

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>('Guest Judge');
  const [result, setResult] = useState<{
    destructionScore: number;
    moneyLostInr: number;
    blastRadiusPct: number;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<BreakItScore[]>(() => getLeaderboard());
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalPointsSpent = selectedCards.reduce((acc, cId) => {
    const card = AVAILABLE_CHAOS_CARDS.find((c) => c.id === cId);
    return acc + (card?.pointCost || 0);
  }, 0);

  const toggleCard = (cardId: string) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter((id) => id !== cardId));
    } else {
      const card = AVAILABLE_CHAOS_CARDS.find((c) => c.id === cardId);
      if (card && totalPointsSpent + card.pointCost <= CHAOS_BUDGET) {
        setSelectedCards([...selectedCards, cardId]);
      }
    }
  };

  const handleLaunchAttack = () => {
    if (selectedCards.length === 0) return;
    setIsSimulating(true);

    setTimeout(() => {
      try {
        const res = evaluateBreakItRun(currentSpec, selectedCards);
        setResult(res);

        // Save to leaderboard
        const newScore: BreakItScore = {
          id: `score-${Date.now()}`,
          playerName: playerName.trim() || 'Anonymous Judge',
          destructionScore: res.destructionScore,
          moneyLostInr: res.moneyLostInr,
          blastRadiusPct: res.blastRadiusPct,
          cardsUsed: selectedCards,
          date: new Date().toISOString().split('T')[0],
        };
        const updatedLb = saveLeaderboardScore(newScore);
        setLeaderboard(updatedLb);
      } catch (err) {
        console.error('Failed to run Break It:', err);
      } finally {
        setIsSimulating(false);
      }
    }, 400);
  };

  const handleResetGame = () => {
    setSelectedCards([]);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] bg-surface-raised border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-text-primary">
        {/* Top Header */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text-primary">
                  "Break It!" Chaos Challenge
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                  CHAOS BUDGET: {CHAOS_BUDGET} PTS
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Pick a combination of disaster cards within your budget to maximize cascading destruction!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-muted hover:text-text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
          {/* Points Meter Bar */}
          <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between shadow-noc">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs text-text-primary">Budget Utilization:</span>
              <span className="font-mono text-xs font-bold text-accent">
                {totalPointsSpent} / {CHAOS_BUDGET} Points
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-48 bg-surface-raised rounded-full h-2.5 overflow-hidden border border-border">
                <div
                  className={`h-full transition-all duration-200 ${
                    totalPointsSpent > 80 ? 'bg-rose-500' : 'bg-accent'
                  }`}
                  style={{ width: `${(totalPointsSpent / CHAOS_BUDGET) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-text-dim">
                {CHAOS_BUDGET - totalPointsSpent} left
              </span>
            </div>
          </div>

          {/* Cards Selection Grid */}
          <div>
            <span className="text-[11px] font-bold text-text-dim uppercase tracking-wider block mb-2.5">
              Select Disaster Cards ({selectedCards.length} selected):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_CHAOS_CARDS.map((card) => {
                const isSelected = selectedCards.includes(card.id);
                const canAfford = isSelected || totalPointsSpent + card.pointCost <= CHAOS_BUDGET;

                return (
                  <div
                    key={card.id}
                    onClick={() => canAfford && toggleCard(card.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30 scale-[1.02] shadow-noc'
                        : canAfford
                        ? 'bg-surface border-border hover:border-text-muted hover:bg-surface-raised'
                        : 'bg-surface/50 border-border/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-raised border border-border text-amber-400">
                          {card.pointCost} PTS
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-rose-400">ARMED</span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-text-primary mb-1">{card.title}</h4>
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="p-3.5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-noc">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-text-dim whitespace-nowrap">Player Name:</span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter Judge Name"
                className="px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border text-xs text-text-primary focus:outline-none focus:border-accent w-full sm:w-44 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {result && (
                <button
                  onClick={handleResetGame}
                  className="px-3 py-2 rounded-lg bg-surface-raised border border-border text-xs text-text-muted hover:text-text-primary transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Attack</span>
                </button>
              )}

              <button
                onClick={handleLaunchAttack}
                disabled={selectedCards.length === 0 || isSimulating}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-noc transition-all ${
                  selectedCards.length === 0 || isSimulating
                    ? 'bg-surface-raised text-text-muted cursor-not-allowed'
                    : 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                }`}
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>{isSimulating ? 'Simulating Cascade...' : 'Launch Chaos Attack!'}</span>
              </button>
            </div>
          </div>

          {/* Attack Result Card */}
          {result && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 shadow-noc">
              <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-3">
                <span className="font-bold text-xs text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>Destruction Evaluation Report</span>
                </span>
                <span className="text-2xl font-mono font-bold text-rose-400">
                  {result.destructionScore} <span className="text-xs text-rose-300">PTS</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded bg-surface border border-border">
                  <span className="text-[10px] text-text-dim block">Financial Damage</span>
                  <span className="text-base font-bold text-rose-400">
                    ₹{result.moneyLostInr.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-border">
                  <span className="text-[10px] text-text-dim block">Blast Radius</span>
                  <span className="text-base font-bold text-amber-400">
                    {result.blastRadiusPct}% of fleet
                  </span>
                </div>
                <div className="p-2.5 rounded bg-surface border border-border">
                  <span className="text-[10px] text-text-dim block">Leaderboard Rank</span>
                  <span className="text-base font-bold text-accent">
                    Top 5 Chaos Engineer
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-surface border border-border rounded-xl p-4 shadow-noc">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Hall of Chaos Leaderboard</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-text-dim font-mono text-[10px]">
                    <th className="py-1.5 px-2">Rank</th>
                    <th className="py-1.5 px-2">Player</th>
                    <th className="py-1.5 px-2 text-center">Score</th>
                    <th className="py-1.5 px-2 text-right">Revenue Lost</th>
                    <th className="py-1.5 px-2 text-right">Blast Radius</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 font-mono">
                  {leaderboard.map((lb, idx) => (
                    <tr
                      key={lb.id}
                      className={
                        idx === 0
                          ? 'text-amber-400 font-bold bg-amber-500/10'
                          : 'hover:bg-surface-raised/40 transition-colors'
                      }
                    >
                      <td className="py-2 px-2">#{idx + 1}</td>
                      <td className="py-2 px-2 font-sans font-semibold text-text-primary">
                        {lb.playerName}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-rose-400">
                        {lb.destructionScore}
                      </td>
                      <td className="py-2 px-2 text-right text-text-muted">
                        ₹{lb.moneyLostInr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-right text-text-dim">
                        {lb.blastRadiusPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
