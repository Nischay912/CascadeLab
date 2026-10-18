import { ArchitectureSpec } from '../schema/architecture';

export interface ChaosCard {
  id: string;
  title: string;
  description: string;
  pointCost: number;
  iconType: 'kill' | 'latency' | 'traffic' | 'az' | 'cache' | 'gray';
  applyFault: (spec: ArchitectureSpec) => void;
}

export interface BreakItScore {
  id: string;
  playerName: string;
  destructionScore: number;
  moneyLostInr: number;
  blastRadiusPct: number;
  cardsUsed: string[];
  date: string;
}

export interface DefenseMove {
  id: string;
  title: string;
  description: string;
  category: 'circuit_breaker' | 'retry_jitter' | 'replica_scale' | 'load_shedding' | 'timeout';
  costDeltaInr: number;
  applyMove: (spec: ArchitectureSpec) => ArchitectureSpec;
}

export interface DefendItResult {
  playerSuccessRate: number;
  playerLatencyP95: number;
  playerMoneyLostInr: number;
  sloAchieved: boolean;
  stars: 1 | 2 | 3;
  playerMoves: string[];
  autoHardenMoves: string[];
  autoHardenSuccessRate: number;
  commentary: string;
}

export interface DemoDirectorStep {
  id: number;
  title: string;
  badge: string;
  narration: string;
  tab?: 'graph' | 'split' | 'optimizer' | 'chaos' | 'capacity' | 'reality';
  actionName: string;
}
