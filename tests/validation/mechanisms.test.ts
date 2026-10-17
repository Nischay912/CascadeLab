import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../../src/sim/engine';
import {
  shopFastNaiveTemplate,
  shopFastHardenedTemplate,
} from '../../src/schema/templates';
import { ArchitectureSpec } from '../../src/schema/architecture';

describe('Phase 3 Acceptance Tests: Resilience Mechanisms', () => {
  describe('T6: Sync vs. Async Dependency Cascade Mechanics', () => {
    it('verifies that sync dependency slowdown increases caller S_eff and reduces caller capacity, while async does not', () => {
      const syncCallerSpec: ArchitectureSpec = {
        name: 'Sync vs Async Test',
        slo: { success_pct: 99.0, p95_ms: 500 },
        value_per_request_inr: 40,
        services: [
          {
            id: 'caller',
            entry: true,
            instances: { initial: 3, min: 2, max: 6 },
            concurrency: 50,
            service_time_ms: 10,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
          {
            id: 'sync-callee',
            entry: false,
            instances: { initial: 3, min: 2, max: 6 },
            concurrency: 50,
            service_time_ms: 20,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
          {
            id: 'async-callee',
            entry: false,
            instances: { initial: 3, min: 2, max: 6 },
            concurrency: 50,
            service_time_ms: 20,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
        ],
        edges: [
          {
            id: 'caller->sync-callee',
            from: 'caller',
            to: 'sync-callee',
            calls_per_request: 1.0,
            mode: 'sync',
            critical: true,
            timeout_ms: 1000,
            retries: 0,
            backoff: { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 },
            circuit_breaker: { enabled: false },
            cache: { hit_ratio: 0.0 },
            bulkhead_max_concurrent: null,
          },
          {
            id: 'caller->async-callee',
            from: 'caller',
            to: 'async-callee',
            calls_per_request: 1.0,
            mode: 'async', // async!
            critical: false,
            timeout_ms: 1000,
            retries: 0,
            backoff: { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 },
            circuit_breaker: { enabled: false },
            cache: { hit_ratio: 0.0 },
            bulkhead_max_concurrent: null,
          },
        ],
        workload: {
          entry: 'caller',
          pattern: 'constant',
          base_rps: 100,
          multiplier: 1.0,
        },
        faults: [
          {
            id: 'f_slow_sync',
            type: 'latency',
            target: 'sync-callee',
            factor: 5.0, // 20ms -> 100ms
            start_s: 10,
            end_s: 30,
          },
        ],
        seed: 42,
      };

      const engine = new SimulationEngine(syncCallerSpec, 42);
      const results = engine.runBatch(40);

      const baselineCallerSeff = results[5].services['caller'].serviceEffectiveMs;
      const degradedCallerSeff = results[15].services['caller'].serviceEffectiveMs;

      // Caller S_eff must increase because sync-callee is slow
      expect(degradedCallerSeff).toBeGreaterThan(baselineCallerSeff * 2);

      // Now test async slowdown: slowdown of async-callee should NOT affect caller S_eff
      const asyncFaultSpec: ArchitectureSpec = {
        ...syncCallerSpec,
        faults: [
          {
            id: 'f_slow_async',
            type: 'latency',
            target: 'async-callee',
            factor: 10.0,
            start_s: 10,
            end_s: 30,
          },
        ],
      };

      const asyncEngine = new SimulationEngine(asyncFaultSpec, 42);
      const asyncResults = asyncEngine.runBatch(40);

      const asyncBaselineSeff = asyncResults[5].services['caller'].serviceEffectiveMs;
      const asyncDegradedSeff = asyncResults[15].services['caller'].serviceEffectiveMs;

      // Caller S_eff should remain unchanged when async callee slows down
      expect(Math.abs(asyncDegradedSeff - asyncBaselineSeff)).toBeLessThan(1.0);
    });
  });

  describe('T7: Circuit Breaker State Transitions', () => {
    it('opens on sustained failures, fast-fails requests, half-opens and closes on recovery', () => {
      const breakerSpec: ArchitectureSpec = {
        name: 'Circuit Breaker Test',
        slo: { success_pct: 99.0, p95_ms: 500 },
        value_per_request_inr: 40,
        services: [
          {
            id: 'frontend',
            entry: true,
            instances: { initial: 2, min: 2, max: 4 },
            concurrency: 50,
            service_time_ms: 5,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
          {
            id: 'flaky-backend',
            instances: { initial: 2, min: 2, max: 4 },
            concurrency: 50,
            service_time_ms: 20,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
        ],
        edges: [
          {
            id: 'frontend->flaky-backend',
            from: 'frontend',
            to: 'flaky-backend',
            calls_per_request: 1.0,
            mode: 'sync',
            critical: true,
            timeout_ms: 500,
            retries: 1,
            backoff: { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 },
            circuit_breaker: {
              enabled: true,
              failure_rate_threshold: 0.5,
              min_calls: 10,
              open_duration_s: 10,
              probe_fraction: 0.2,
            },
            cache: { hit_ratio: 0.0 },
            bulkhead_max_concurrent: null,
          },
        ],
        workload: {
          entry: 'frontend',
          pattern: 'constant',
          base_rps: 50,
          multiplier: 1.0,
        },
        faults: [
          {
            id: 'f_error',
            type: 'error',
            target: 'flaky-backend',
            percentage: 80, // 80% errors trips breaker
            start_s: 10,
            end_s: 25,
          },
        ],
        seed: 42,
      };

      const engine = new SimulationEngine(breakerSpec, 42);
      const results = engine.runBatch(50);

      // Baseline t=5: circuit breaker is closed
      const edgeAt5 = results[5].edges['frontend->flaky-backend'];
      expect(edgeAt5.circuitBreakerState).toBe('closed');

      // Mid-incident t=20: circuit breaker has tripped to open
      const edgeAt20 = results[20].edges['frontend->flaky-backend'];
      expect(edgeAt20.circuitBreakerState).toBe('open');

      // Fast-fail: during open breaker, waitHeldMs is near-instant (~0.5ms)
      expect(edgeAt20.waitHeldMs).toBeLessThan(5.0);

      // Post-recovery t=45: circuit breaker resets to closed
      const edgeAt45 = results[45].edges['frontend->flaky-backend'];
      expect(edgeAt45.circuitBreakerState).toBe('closed');
    });
  });

  describe('T8: Autoscaler Spin-Up Lag & Capacity Caps', () => {
    it('verifies that autoscaler adds instances only after startup_delay_s and never exceeds max limit', () => {
      const autoscaleSpec: ArchitectureSpec = {
        name: 'Autoscale Test',
        slo: { success_pct: 99.0, p95_ms: 500 },
        value_per_request_inr: 40,
        services: [
          {
            id: 'scaler',
            entry: true,
            instances: { initial: 2, min: 2, max: 6 },
            concurrency: 2,
            service_time_ms: 20, // 100 req/s per instance, 2 instances = 200 req/s capacity
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: {
              enabled: true,
              target_util: 0.5,
              eval_period_s: 5,
              startup_delay_s: 15, // takes 15 seconds to start up!
              cooldown_s: 60,
            },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
        ],
        edges: [],
        workload: {
          entry: 'scaler',
          pattern: 'constant',
          base_rps: 300, // 300 RPS on initial 2 instances (cap 200) -> overload!
          multiplier: 1.0,
        },
        faults: [],
        seed: 42,
      };

      const engine = new SimulationEngine(autoscaleSpec, 42);
      const results = engine.runBatch(40);

      // At t=0: initial instances = 2
      expect(results[0].services['scaler'].instancesReady).toBe(2);

      // At t=10: scale-up triggered, but instances are in startup delay (instancesReady still 2)
      expect(results[10].services['scaler'].instancesReady).toBe(2);
      expect(results[10].services['scaler'].instancesStarting).toBeGreaterThan(0);

      // At t=25: startup_delay (15s) passed, ready instances have increased
      expect(results[25].services['scaler'].instancesReady).toBeGreaterThan(2);

      // At all times, ready instances never exceeds max (6)
      for (const tick of results) {
        expect(tick.services['scaler'].instancesReady).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('T9: Cache Stampede (Thundering Herd)', () => {
    it('verifies that cache flush produces an instantaneous load surge on backing store, decaying over warm_time_s', () => {
      const cacheSpec: ArchitectureSpec = {
        name: 'Cache Flush Test',
        slo: { success_pct: 99.0, p95_ms: 500 },
        value_per_request_inr: 40,
        services: [
          {
            id: 'web',
            entry: true,
            instances: { initial: 2, min: 2, max: 4 },
            concurrency: 50,
            service_time_ms: 5,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
          {
            id: 'backing-db',
            instances: { initial: 2, min: 2, max: 4 },
            concurrency: 50,
            service_time_ms: 10,
            queue_limit: 100,
            load_shedding: { enabled: false, threshold: 0.8 },
            autoscale: { enabled: false, target_util: 0.6, eval_period_s: 15, startup_delay_s: 45, cooldown_s: 120 },
            crash: { enabled: false, after_overload_s: 20, restart_delay_s: 30 },
            cost_inr_per_instance_month: 2000,
            zone_spread: ['a'],
          },
        ],
        edges: [
          {
            id: 'web->backing-db',
            from: 'web',
            to: 'backing-db',
            calls_per_request: 1.0,
            mode: 'sync',
            critical: true,
            timeout_ms: 500,
            retries: 0,
            backoff: { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 },
            circuit_breaker: { enabled: false },
            cache: { hit_ratio: 0.9, warm_time_s: 20 }, // 90% hit ratio initially
            bulkhead_max_concurrent: null,
          },
        ],
        workload: {
          entry: 'web',
          pattern: 'constant',
          base_rps: 100,
          multiplier: 1.0,
        },
        faults: [
          {
            id: 'f_cache_wipe',
            type: 'cache_flush',
            target: 'backing-db',
            start_s: 10,
            end_s: 30,
            warm_time_s: 20,
          },
        ],
        seed: 42,
      };

      const engine = new SimulationEngine(cacheSpec, 42);
      const results = engine.runBatch(40);

      // At t=5: 90% hit ratio => only 10% (10 RPS) hits backing-db
      const normalLoad = results[5].services['backing-db'].arrivalRate;
      expect(normalLoad).toBeCloseTo(10, 1);

      // At t=11 (immediately after flush): hit ratio wiped to 0% => 100% (100 RPS) slams backing-db (10x spike!)
      const flushedLoad = results[11].services['backing-db'].arrivalRate;
      expect(flushedLoad).toBeGreaterThan(80);

      // Over warm_time_s (t=25), cache warms up and load steadily declines
      const warmingLoad = results[25].services['backing-db'].arrivalRate;
      expect(warmingLoad).toBeLessThan(flushedLoad);
    });
  });

  describe('T14: Metastable Failure Detection in ShopFast', () => {
    it('verifies that ShopFast naive config stays failed after trigger ends, while hardened config recovers rapidly', () => {
      // 1. Run naive ShopFast: trigger is provider latency 5x from t=60 to t=120
      const naiveEngine = new SimulationEngine(shopFastNaiveTemplate, 42);
      const naiveResults = naiveEngine.runBatch(180);

      // At t=100 (mid-incident): system is degraded
      expect(naiveResults[100].userSuccessRate).toBeLessThan(80);

      // At t=160 (40s after trigger ended at t=120): naive system remains failed (Metastable)
      expect(naiveResults[160].userSuccessRate).toBeLessThan(shopFastNaiveTemplate.slo.success_pct);
      expect(naiveResults[160].isMetastable).toBe(true);

      // 2. Run hardened ShopFast: recovers within 30s after trigger ends
      const hardenedEngine = new SimulationEngine(shopFastHardenedTemplate, 42);
      const hardenedResults = hardenedEngine.runBatch(180);

      // At t=150 (30s after trigger ended): hardened system has recovered
      expect(hardenedResults[150].userSuccessRate).toBeGreaterThanOrEqual(85);
      expect(hardenedResults[150].isMetastable).toBe(false);
    });
  });
});
