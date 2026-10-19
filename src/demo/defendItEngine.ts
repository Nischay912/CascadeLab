import { ArchitectureSpec } from '../schema/architecture';
import { shopFastNaiveTemplate } from '../schema/templates';
import { SimulationEngine } from '../sim/engine';
import { DefenseMove, DefendItResult } from './types';

export const DEFEND_IT_MOVES: DefenseMove[] = [
  {
    id: 'cb_payments',
    title: 'Deploy Circuit Breaker on Payment Gateway',
    description: 'Fast-fails hanging payment calls at 50% failure rate, protecting checkout worker threads.',
    category: 'circuit_breaker',
    costDeltaInr: 0,
    applyMove: (spec) => {
      const pEdge = spec.edges.find((e) => e.to === 'payment-provider');
      if (pEdge) {
        pEdge.circuit_breaker = {
          enabled: true,
          failure_rate_threshold: 0.5,
          min_calls: 10,
          open_duration_s: 15,
          probe_fraction: 0.1,
        };
      }
      const cEdge = spec.edges.find((e) => e.to === 'payments');
      if (cEdge) {
        cEdge.circuit_breaker = {
          enabled: true,
          failure_rate_threshold: 0.5,
          min_calls: 10,
          open_duration_s: 15,
          probe_fraction: 0.1,
        };
      }
      return spec;
    },
  },
  {
    id: 'jitter_checkout',
    title: 'Full Jitter Exponential Backoff',
    description: 'Caps retries to 1 and randomizes backoff delays, stopping resonant retry wave amplification.',
    category: 'retry_jitter',
    costDeltaInr: 0,
    applyMove: (spec) => {
      spec.edges.forEach((edge) => {
        if (edge.retries > 0) {
          edge.retries = Math.min(1, edge.retries);
          edge.backoff = {
            mode: 'exponential',
            jitter: true,
            base_delay_ms: 50,
            max_delay_ms: 1000,
          };
        }
      });
      return spec;
    },
  },
  {
    id: 'scale_db',
    title: 'Scale Orders DB (Standby Replica across Multi-AZ)',
    description: 'Increases Orders DB from 1 to 2 replicas and spreads to zones [a, b].',
    category: 'replica_scale',
    costDeltaInr: 7500,
    applyMove: (spec) => {
      const db = spec.services.find((s) => s.id === 'orders-db');
      if (db) {
        db.instances.initial = 2;
        db.instances.min = 2;
        db.instances.max = 4;
        db.zone_spread = ['a', 'b'];
      }
      return spec;
    },
  },
  {
    id: 'load_shed_gw',
    title: 'Adaptive Load Shedding on API Gateway',
    description: 'Drops excess calls when entry queue reaches 80% saturation to maintain 100% throughput.',
    category: 'load_shedding',
    costDeltaInr: 0,
    applyMove: (spec) => {
      const gw = spec.services.find((s) => s.id === 'gateway');
      if (gw) {
        gw.load_shedding = { enabled: true, threshold: 0.8 };
      }
      return spec;
    },
  },
  {
    id: 'bulkhead_threads',
    title: 'Bulkhead Thread Pool Isolation',
    description: 'Caps concurrency pool slots to prevent slow dependencies from exhausting global threads.',
    category: 'circuit_breaker',
    costDeltaInr: 0,
    applyMove: (spec) => {
      const pay = spec.services.find((s) => s.id === 'payments');
      if (pay) {
        pay.concurrency = 40;
      }
      return spec;
    },
  },
  {
    id: 'cache_warm',
    title: 'Pre-warm Cache Layer (80% Hit Ratio)',
    description: 'Absorbs read traffic volume to protect backend catalog store from database saturation.',
    category: 'circuit_breaker',
    costDeltaInr: 1500,
    applyMove: (spec) => {
      const cacheEdge = spec.edges.find((e) => e.to === 'cache' || e.to === 'products-db');
      if (cacheEdge && cacheEdge.cache) {
        cacheEdge.cache.hit_ratio = 0.8;
      }
      return spec;
    },
  },
];

/**
 * Builds the standard Defend It live disaster incident spec:
 * 5x latency on payment-provider + 2.5x traffic surge.
 */
function buildDisasterSpec(): ArchitectureSpec {
  const spec: ArchitectureSpec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
  spec.workload.pattern = 'spike';
  spec.workload.multiplier = 2.5;
  spec.faults = [
    {
      type: 'latency',
      target: 'payment-provider',
      factor: 5,
      start_s: 2,
      end_s: 85,
    },
  ];
  return spec;
}

/**
 * Evaluates the player's 3 chosen defensive moves against the live disaster,
 * and compares directly with Auto-Harden's optimal solution.
 */
export function evaluateDefendItRun(playerMoveIds: string[]): DefendItResult {
  // 1. Evaluate Player's Configuration
  let playerSpec = buildDisasterSpec();
  for (const moveId of playerMoveIds) {
    const move = DEFEND_IT_MOVES.find((m) => m.id === moveId);
    if (move) {
      playerSpec = move.applyMove(playerSpec);
    }
  }

  const playerEngine = new SimulationEngine(playerSpec, 42);
  const playerTicks = playerEngine.runBatch(90);
  const playerFinal = playerTicks[playerTicks.length - 1];

  let sumSuccess = 0;
  for (let t = 2; t < 80; t++) {
    sumSuccess += playerTicks[t].gatewayAcceptanceRate ?? playerTicks[t].userSuccessRate;
  }
  const playerSuccessRate = Math.round((sumSuccess / 78) * 10) / 10;
  const sloAchieved = playerSuccessRate >= 85.0;

  let stars: 1 | 2 | 3 = 1;
  if (sloAchieved && playerFinal.cumulativeMoneyLostInr < 1000000) {
    stars = 3;
  } else if (playerSuccessRate >= 70.0) {
    stars = 2;
  }

  // 2. Evaluate Auto-Harden's Reference Answer
  const autoHardenMoves = ['cb_payments', 'jitter_checkout', 'load_shed_gw'];
  let autoSpec = buildDisasterSpec();
  for (const mId of autoHardenMoves) {
    const move = DEFEND_IT_MOVES.find((m) => m.id === mId);
    if (move) {
      autoSpec = move.applyMove(autoSpec);
    }
  }

  const autoEngine = new SimulationEngine(autoSpec, 42);
  const autoTicks = autoEngine.runBatch(90);
  let autoSum = 0;
  for (let t = 2; t < 80; t++) {
    autoSum += autoTicks[t].gatewayAcceptanceRate ?? autoTicks[t].userSuccessRate;
  }
  const autoHardenSuccessRate = Math.round((autoSum / 78) * 10) / 10;

  // 3. Build diagnostic commentary
  let commentary = '';
  if (stars === 3) {
    commentary =
      'Brilliant SRE leadership! You deployed circuit breakers and mitigated retry storms, preserving the 99% user SLO with virtually zero revenue loss.';
  } else if (stars === 2) {
    commentary =
      'Good defensive triage! You kept the system partially operational, but unjittered retry bursts or unhedged thread pools still leaked some customer transactions.';
  } else {
    commentary =
      'Platform brownout! Synchronous caller threads locked up waiting for the hanging payment provider, causing cascading worker collapse across checkout and API gateway.';
  }

  return {
    playerSuccessRate,
    playerLatencyP95: playerFinal.userP95Ms,
    playerMoneyLostInr: playerFinal.cumulativeMoneyLostInr,
    sloAchieved,
    stars,
    playerMoves: playerMoveIds,
    autoHardenMoves,
    autoHardenSuccessRate,
    commentary,
  };
}
