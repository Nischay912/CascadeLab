import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from '../sim/engine';
import { ChaosCard, BreakItScore } from './types';

export const CHAOS_BUDGET = 100;

export const AVAILABLE_CHAOS_CARDS: ChaosCard[] = [
  {
    id: 'kill_db_spof',
    title: 'Orders DB 100% Outage',
    description: 'Instant crash of single-node database. Tests SPOF survival and fast failure.',
    pointCost: 45,
    iconType: 'kill',
    applyFault: (spec) => {
      spec.faults.push({
        type: 'kill_instances',
        target: 'orders-db',
        percentage: 100,
        start_s: 2,
        end_s: 85,
      });
    },
  },
  {
    id: 'provider_hang',
    title: 'Payment Gateway 5× Latency Hang',
    description: 'Forces external payment calls to take 600ms+. Tests caller worker pool exhaustion.',
    pointCost: 35,
    iconType: 'latency',
    applyFault: (spec) => {
      spec.faults.push({
        type: 'latency',
        target: 'payment-provider',
        factor: 5,
        start_s: 2,
        end_s: 85,
      });
    },
  },
  {
    id: 'flash_surge',
    title: '3× Flash Crowd Traffic Surge',
    description: 'Sudden 300% entry traffic spike. Tests autoscaler lag and load shedding.',
    pointCost: 30,
    iconType: 'traffic',
    applyFault: (spec) => {
      spec.workload.pattern = 'spike';
      spec.workload.multiplier = 3.0;
    },
  },
  {
    id: 'datacenter_az',
    title: 'Availability Zone A Datacenter Cut',
    description: 'Drops all instances deployed in zone "a". Tests multi-zone redundancy.',
    pointCost: 40,
    iconType: 'az',
    applyFault: (spec) => {
      spec.faults.push({
        type: 'az_outage',
        zone: 'a',
        target: 'all',
        start_s: 2,
        end_s: 85,
      });
    },
  },
  {
    id: 'thundering_cache',
    title: 'Redis Cache 100% Flush',
    description: 'Cold cache invalidation. Floods backend databases with thundering herds.',
    pointCost: 25,
    iconType: 'cache',
    applyFault: (spec) => {
      spec.faults.push({
        type: 'cache_flush',
        target: 'cache',
        warm_time_s: 30,
        start_s: 2,
        end_s: 85,
      });
    },
  },
  {
    id: 'gateway_brownout',
    title: 'API Gateway 40% Brownout',
    description: 'Cuts gateway compute capacity to 40%. Forces severe entry queue overflow.',
    pointCost: 25,
    iconType: 'gray',
    applyFault: (spec) => {
      spec.faults.push({
        type: 'brownout',
        target: 'gateway',
        percentage: 40,
        start_s: 2,
        end_s: 85,
      });
    },
  },
];

/**
 * Executes a "Break It!" challenge run and computes the destruction score.
 */
export function evaluateBreakItRun(
  baseSpec: ArchitectureSpec,
  selectedCardIds: string[]
): {
  destructionScore: number;
  moneyLostInr: number;
  blastRadiusPct: number;
  ticks: SimulationTickMetrics[];
} {
  const clonedSpec: ArchitectureSpec = JSON.parse(JSON.stringify(baseSpec));
  clonedSpec.faults = [];

  for (const cardId of selectedCardIds) {
    const card = AVAILABLE_CHAOS_CARDS.find((c) => c.id === cardId);
    if (card) {
      card.applyFault(clonedSpec);
    }
  }

  const engine = new SimulationEngine(clonedSpec, 42);
  const ticks = engine.runBatch(90);
  const finalTick = ticks[ticks.length - 1];

  // Blast radius calculation
  const degradedServices = new Set<string>();
  for (const tick of ticks) {
    for (const [sId, sMetrics] of Object.entries(tick.services)) {
      if (
        sMetrics.utilization > 0.95 ||
        sMetrics.successRate < 85 ||
        sMetrics.instancesCrashed > 0 ||
        sMetrics.queue > 15
      ) {
        degradedServices.add(sId);
      }
    }
  }

  const blastRadiusPct = Math.round(
    (degradedServices.size / Math.max(1, clonedSpec.services.length)) * 100
  );
  const moneyLostInr = finalTick.cumulativeMoneyLostInr;

  // Destruction score: damage formula rewarding financial impact + blast radius
  const destructionScore = Math.round((moneyLostInr / 1000) * 1.5 + blastRadiusPct * 2.0);

  return {
    destructionScore,
    moneyLostInr,
    blastRadiusPct,
    ticks,
  };
}

const STORAGE_KEY = 'cascadelab_breakit_leaderboard';

const DEFAULT_LEADERBOARD: BreakItScore[] = [
  {
    id: 'lb-1',
    playerName: 'Priya (Chaos Lead)',
    destructionScore: 312,
    moneyLostInr: 58000,
    blastRadiusPct: 85,
    cardsUsed: ['kill_db_spof', 'provider_hang'],
    date: '2026-10-18',
  },
  {
    id: 'lb-2',
    playerName: 'Anand (Principal SRE)',
    destructionScore: 265,
    moneyLostInr: 45000,
    blastRadiusPct: 77,
    cardsUsed: ['provider_hang', 'flash_surge'],
    date: '2026-10-17',
  },
  {
    id: 'lb-3',
    playerName: 'Vikram (Staff DevOps)',
    destructionScore: 218,
    moneyLostInr: 34000,
    blastRadiusPct: 62,
    cardsUsed: ['datacenter_az', 'thundering_cache'],
    date: '2026-10-16',
  },
];

export function getLeaderboard(): BreakItScore[] {
  if (typeof window === 'undefined') return DEFAULT_LEADERBOARD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEADERBOARD;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LEADERBOARD;
  }
}

export function saveLeaderboardScore(score: BreakItScore): BreakItScore[] {
  const current = getLeaderboard();
  const existingIdx = current.findIndex(
    (e) => e.playerName.trim().toLowerCase() === score.playerName.trim().toLowerCase()
  );
  let updated: BreakItScore[];
  if (existingIdx >= 0) {
    if (score.destructionScore >= current[existingIdx].destructionScore) {
      current[existingIdx] = score;
    }
    updated = [...current];
  } else {
    updated = [...current, score];
  }
  updated.sort((a, b) => b.destructionScore - a.destructionScore);
  const trimmed = updated.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota
  }
  return trimmed;
}

export function resetLeaderboard(): BreakItScore[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage quota
  }
  return DEFAULT_LEADERBOARD;
}
