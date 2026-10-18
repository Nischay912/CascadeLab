import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate } from '../../src/schema/templates';
import {
  AVAILABLE_CHAOS_CARDS,
  CHAOS_BUDGET,
  evaluateBreakItRun,
  getLeaderboard,
  saveLeaderboardScore,
} from '../../src/demo/breakItEngine';
import { DEFEND_IT_MOVES, evaluateDefendItRun } from '../../src/demo/defendItEngine';
import { DEMO_DIRECTOR_STEPS } from '../../src/demo/directorScript';

describe('Phase 10: Break It! Chaos Challenge Game', () => {
  it('provides disaster cards conforming to chaos budget', () => {
    expect(AVAILABLE_CHAOS_CARDS.length).toBeGreaterThanOrEqual(6);
    AVAILABLE_CHAOS_CARDS.forEach((card) => {
      expect(card.pointCost).toBeGreaterThan(0);
      expect(card.pointCost).toBeLessThanOrEqual(CHAOS_BUDGET);
    });
  });

  it('evaluates chaos destruction score and blast radius', () => {
    const run = evaluateBreakItRun(shopFastNaiveTemplate, ['kill_db_spof', 'provider_hang']);

    expect(run.destructionScore).toBeGreaterThan(0);
    expect(run.moneyLostInr).toBeGreaterThan(0);
    expect(run.blastRadiusPct).toBeGreaterThan(0);
    expect(run.ticks.length).toBe(91); // 0 to 90
  });

  it('persists and ranks scores in local leaderboard', () => {
    const initialLb = getLeaderboard();
    expect(initialLb.length).toBeGreaterThan(0);

    const testScore = {
      id: 'test-score',
      playerName: 'Lead Chaos Architect',
      destructionScore: 999,
      moneyLostInr: 99000,
      blastRadiusPct: 95,
      cardsUsed: ['kill_db_spof', 'provider_hang'],
      date: '2026-10-18',
    };

    const updated = saveLeaderboardScore(testScore);
    expect(updated[0].playerName).toBe('Lead Chaos Architect');
    expect(updated[0].destructionScore).toBe(999);
  });
});

describe('Phase 10: Defend It! Live Incident Challenge Game', () => {
  it('provides defensive SRE moves', () => {
    expect(DEFEND_IT_MOVES.length).toBeGreaterThanOrEqual(6);
  });

  it('rewards full 3 stars when deploying optimal defense combination', () => {
    // Optimal defensive triad: Circuit breaker on payments + Jitter on retries + API Gateway load shedding
    const result = evaluateDefendItRun(['cb_payments', 'jitter_checkout', 'load_shed_gw']);

    expect(result.sloAchieved).toBe(true);
    expect(result.playerSuccessRate).toBeGreaterThanOrEqual(85.0);
    expect(result.stars).toBe(3);
    expect(result.autoHardenMoves.length).toBe(3);
    expect(result.autoHardenSuccessRate).toBeGreaterThanOrEqual(85.0);
  });

  it('penalizes inadequate defenses during live incident', () => {
    // Sub-optimal defense: only cache warm (does not protect against payment hang)
    const result = evaluateDefendItRun(['cache_warm']);

    expect(result.sloAchieved).toBe(false);
    expect(result.stars).toBeLessThan(3);
  });
});

describe('Phase 10: Demo Director Presenter Tour', () => {
  it('defines 6 structured presentation steps with narrations', () => {
    expect(DEMO_DIRECTOR_STEPS.length).toBe(6);
    DEMO_DIRECTOR_STEPS.forEach((step, idx) => {
      expect(step.id).toBe(idx + 1);
      expect(step.title).toBeDefined();
      expect(step.narration.length).toBeGreaterThan(30);
      expect(step.badge).toBeDefined();
    });
  });
});
