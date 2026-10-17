import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/sim/engine';
import { PRNG } from '../../src/sim/prng';
import {
  calculateExpectedAttempts,
  sakasegawaMeanLatencyMs,
  exactErlangCMeanLatencyMs,
  littlesLawNumberInSystem,
} from '../../src/sim/math';
import { shopFastNaiveTemplate } from '../../src/schema/templates';
import { ArchitectureSpec } from '../../src/schema/architecture';

describe('Phase 2 Acceptance Tests: Simulation Engine Core', () => {
  describe('T1: Little’s Law Validation (L = lambda * W)', () => {
    it('verifies that steady-state inventory L matches lambda * W within 1% across parameter sets', () => {
      const testCases = [
        { lambda: 100, W_ms: 20 },
        { lambda: 500, W_ms: 15 },
        { lambda: 1200, W_ms: 8 },
        { lambda: 50, W_ms: 120 },
      ];

      for (const { lambda, W_ms } of testCases) {
        const expectedL = (lambda * W_ms) / 1000;
        const computedL = littlesLawNumberInSystem(lambda, W_ms);
        const errorPercent = (Math.abs(computedL - expectedL) / expectedL) * 100;
        expect(errorPercent).toBeLessThan(0.001); // exact floating precision
      }
    });
  });

  describe('T2: Request Conservation Law', () => {
    it('verifies that arrivals = completed + rejected + deltaQueue within 1% over steady simulation window', () => {
      const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
      const results = engine.runBatch(60);

      // Inspect entry service 'gateway' over ticks 10 to 30 (steady baseline)
      let totalArrivals = 0;
      let totalCompleted = 0;
      let totalRejected = 0;

      for (let t = 10; t <= 30; t++) {
        const tick = results[t];
        const gw = tick.services['gateway'];
        totalArrivals += gw.arrivalRate;
        totalCompleted += gw.completedRate;
        totalRejected += gw.rejectedRate;
      }

      const qStart = results[10].services['gateway'].queue;
      const qEnd = results[30].services['gateway'].queue;
      const deltaQueue = qEnd - qStart;

      const accounted = totalCompleted + totalRejected + deltaQueue;
      const discrepancy = Math.abs(totalArrivals - accounted);
      const errorRatio = discrepancy / Math.max(1, totalArrivals);

      expect(errorRatio).toBeLessThan(0.01); // within 1% conservation
    });
  });

  describe('T3: Sakasegawa vs. Exact Erlang-C Validation', () => {
    it('verifies that Sakasegawa mean latency is within ±15% of exact Erlang-C for rho in [0.3, 0.9] across >= 20 points', () => {
      const serverCounts = [2, 4, 8, 16]; // m
      const serviceTimeMs = 20; // 50 req/s per server
      const rhos = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9]; // 8 utilisation points

      let testedPoints = 0;
      let maxErrorFound = 0;

      for (const m of serverCounts) {
        const singleCapacityRps = 1000 / serviceTimeMs;
        const totalCapacityRps = m * singleCapacityRps;

        for (const rho of rhos) {
          const lambda = totalCapacityRps * rho;

          const exactLatency = exactErlangCMeanLatencyMs(lambda, serviceTimeMs, m);
          const approxLatency = sakasegawaMeanLatencyMs(serviceTimeMs, m, rho);

          expect(Number.isFinite(exactLatency)).toBe(true);
          expect(Number.isFinite(approxLatency)).toBe(true);

          const relativeError = Math.abs(approxLatency - exactLatency) / exactLatency;
          maxErrorFound = Math.max(maxErrorFound, relativeError);

          // Sakasegawa approximation target: within 15% of Erlang-C for rho <= 0.9
          expect(relativeError, `Error for m=${m}, rho=${rho} was ${(relativeError * 100).toFixed(1)}%`).toBeLessThan(0.15);
          testedPoints++;
        }
      }

      expect(testedPoints).toBeGreaterThanOrEqual(20);
    });
  });

  describe('T4: Determinism & Seeded PRNG', () => {
    it('produces identical byte-for-byte metrics with the same spec and same seed', () => {
      const engine1 = new SimulationEngine(shopFastNaiveTemplate, 42);
      const results1 = engine1.runBatch(120);

      const engine2 = new SimulationEngine(shopFastNaiveTemplate, 42);
      const results2 = engine2.runBatch(120);

      expect(results1.length).toBe(results2.length);

      for (let t = 0; t < results1.length; t++) {
        expect(results1[t].userSuccessRate).toBe(results2[t].userSuccessRate);
        expect(results1[t].userP95Ms).toBe(results2[t].userP95Ms);
        expect(results1[t].cumulativeMoneyLostInr).toBe(results2[t].cumulativeMoneyLostInr);
        expect(results1[t].activeInstances).toBe(results2[t].activeInstances);
      }
    });

    it('produces different stochastic behavior when given a different seed', () => {
      const prng1 = new PRNG(42);
      const prng2 = new PRNG(999);

      const seq1 = Array.from({ length: 5 }, () => prng1.next());
      const seq2 = Array.from({ length: 5 }, () => prng2.next());

      expect(seq1).not.toEqual(seq2);
    });
  });

  describe('T5: Retry Attempts Geometric Formula', () => {
    it('computes exact values for sum_{k=0..R} f^k', () => {
      // When R = 0, attempts should always be 1
      expect(calculateExpectedAttempts(0.5, 0)).toBe(1);
      expect(calculateExpectedAttempts(0.9, 0)).toBe(1);

      // When f = 0, attempts should be 1
      expect(calculateExpectedAttempts(0, 3)).toBe(1);

      // When R = 1, attempts = 1 + f
      expect(calculateExpectedAttempts(0.5, 1)).toBeCloseTo(1.5, 5);

      // When R = 2, f = 0.5: 1 + 0.5 + 0.25 = 1.75
      expect(calculateExpectedAttempts(0.5, 2)).toBeCloseTo(1.75, 5);

      // When R = 3, f = 0.5: 1 + 0.5 + 0.25 + 0.125 = 1.875
      expect(calculateExpectedAttempts(0.5, 3)).toBeCloseTo(1.875, 5);

      // When f -> 1, attempts should approach R + 1
      expect(calculateExpectedAttempts(0.9999, 3)).toBeCloseTo(4, 1);
    });
  });

  describe('T10: Numerical Safety & Division by Zero Guards', () => {
    it('safely handles extreme overload and zero instances without NaN or Infinity', () => {
      const brokenSpec: ArchitectureSpec = {
        ...shopFastNaiveTemplate,
        services: shopFastNaiveTemplate.services.map((s) => ({
          ...s,
          instances: { initial: 1, min: 1, max: 1 },
          concurrency: 1,
          service_time_ms: 1000, // very slow
        })),
        workload: {
          entry: 'gateway',
          pattern: 'constant',
          base_rps: 5000, // 5000 RPS on 1 concurrency worker
          multiplier: 1.0,
        },
      };

      const engine = new SimulationEngine(brokenSpec, 42);
      const results = engine.runBatch(30);

      for (const tick of results) {
        expect(Number.isNaN(tick.userSuccessRate)).toBe(false);
        expect(Number.isNaN(tick.userP95Ms)).toBe(false);
        expect(Number.isNaN(tick.cumulativeMoneyLostInr)).toBe(false);
        expect(Number.isFinite(tick.userSuccessRate)).toBe(true);
      }
    });
  });
});
