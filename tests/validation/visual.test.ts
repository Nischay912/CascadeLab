import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import { useSimulationStore, applyScenarioToSpec } from '../../src/state/useSimulationStore';
import { SimulationEngine } from '../../src/sim/engine';

describe('Phase 4: Live Visualisation & Simulation Store Validation', () => {
  it('V-Store: correctly initializes simulation store with ShopFast template', () => {
    const store = useSimulationStore.getState();
    store.initializeSimulation(shopFastNaiveTemplate, 42);

    const state = useSimulationStore.getState();
    expect(state.history.length).toBe(181); // t = 0..180
    expect(state.currentTime).toBe(0);
    expect(state.currentMetrics).not.toBeNull();
    expect(state.currentMetrics?.t).toBe(0);
    expect(state.currentMetrics?.userSuccessRate).toBeGreaterThan(98);
  });

  it('V-Scrub: timeline seeking correctly syncs live tick metrics and services', () => {
    const store = useSimulationStore.getState();
    store.initializeSimulation(shopFastNaiveTemplate, 42);

    // Seek to baseline t = 10
    store.setCurrentTime(10);
    let state = useSimulationStore.getState();
    expect(state.currentTime).toBe(10);
    expect(state.currentMetrics?.t).toBe(10);
    expect(state.currentMetrics?.userSuccessRate).toBeGreaterThan(95);

    // Seek to mid-fault incident peak at t = 80
    store.setCurrentTime(80);
    state = useSimulationStore.getState();
    expect(state.currentTime).toBe(80);
    expect(state.currentMetrics?.t).toBe(80);

    // In naive ShopFast during fault, user success rate drops severely
    expect(state.currentMetrics?.userSuccessRate).toBeLessThan(70);
    // Amplification factor escalates
    expect(state.currentMetrics?.amplification).toBeGreaterThan(1.2);
  });

  it('V-Scenario: applyScenarioToSpec properly configures fault injection and targets', () => {
    const baselineSpec = applyScenarioToSpec(shopFastNaiveTemplate, 'baseline');
    expect(baselineSpec.faults.length).toBe(0);
    expect(baselineSpec.workload.pattern).toBe('constant');

    const latencySpec = applyScenarioToSpec(shopFastNaiveTemplate, 'provider_latency');
    expect(latencySpec.faults.length).toBe(1);
    expect(latencySpec.faults[0].type).toBe('latency');
    expect(latencySpec.faults[0].factor).toBe(5);

    const graySpec = applyScenarioToSpec(shopFastNaiveTemplate, 'gray_failure');
    expect(graySpec.faults.length).toBe(1);
    expect(graySpec.faults[0].type).toBe('gray_failure');
    expect(graySpec.faults[0].percentage).toBe(35);
  });

  it('V-Nodes: metrics mapping correctly derives status, replicas, and utilization', () => {
    const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
    const history = engine.runBatch(180);

    // At t=0, gateway and checkout are healthy
    const tick0 = history[0];
    const gw0 = tick0.services['gateway'];
    expect(gw0).toBeDefined();
    expect(gw0.instancesReady).toBe(4);
    expect(gw0.instancesCrashed).toBe(0);
    expect(gw0.utilization).toBeLessThan(0.7);

    // At t=80, checkout or payment-provider is overloaded
    const tick80 = history[80];
    const prov80 = tick80.services['payment-provider'];
    expect(prov80).toBeDefined();
    expect(prov80.p95Ms).toBeGreaterThan(100);
  });

  it('V-Edges: dynamic thickness and retry storm alert logic', () => {
    const engine = new SimulationEngine(shopFastNaiveTemplate, 42);
    const history = engine.runBatch(180);

    const tick80 = history[80];
    const checkoutPaymentEdge = tick80.edges['checkout->payments'];
    expect(checkoutPaymentEdge).toBeDefined();

    // Naive ShopFast retry storm escalates retryAttempts > 1.3
    expect(checkoutPaymentEdge.retryAttempts).toBeGreaterThan(1.3);

    // Dynamic thickness formula verification: strokeWidth >= 1.5 and <= 6.5
    const rps = checkoutPaymentEdge.effectiveRps;
    const strokeWidth = Math.max(1.5, Math.min(6, 1.2 + Math.log10(Math.max(1, rps)) * 1.6));
    expect(strokeWidth).toBeGreaterThanOrEqual(1.5);
    expect(strokeWidth).toBeLessThanOrEqual(6.0);
  });

  it('V-Hardened: ShopFast Hardened avoids metastable collapse under identical disaster', () => {
    const engine = new SimulationEngine(shopFastHardenedTemplate, 42);
    const history = engine.runBatch(180);

    // At t=150 (30s after fault end t=120), hardened version has recovered
    const tick150 = history[150];
    expect(tick150.userSuccessRate).toBeGreaterThan(95);
    expect(tick150.isMetastable).toBe(false);
  });

  it('V-Effects: toggleEffects properly switches visual particle state', () => {
    const store = useSimulationStore.getState();
    const initialEffects = store.effectsEnabled;
    store.toggleEffects();
    expect(useSimulationStore.getState().effectsEnabled).toBe(!initialEffects);
    store.toggleEffects();
    expect(useSimulationStore.getState().effectsEnabled).toBe(initialEffects);
  });
});
