import { create } from 'zustand';
import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from '../sim/engine';

export type ScenarioType =
  | 'baseline'
  | 'flash_sale'
  | 'provider_latency'
  | 'az_outage'
  | 'cache_flush'
  | 'gray_failure'
  | 'custom';

interface SimulationState {
  currentTime: number;
  maxTime: number;
  isRunning: boolean;
  speed: number;
  seed: number;
  selectedScenario: ScenarioType;
  history: SimulationTickMetrics[];
  currentMetrics: SimulationTickMetrics | null;
  originNodeId: string | null;
  effectsEnabled: boolean;

  // Actions
  initializeSimulation: (spec: ArchitectureSpec, seed?: number) => void;
  runSimulationBatch: (spec: ArchitectureSpec, durationSeconds?: number, seed?: number, forceCustom?: boolean) => void;
  startLiveBattle: (spec: ArchitectureSpec, durationSeconds?: number, speed?: number) => void;
  setCurrentTime: (t: number) => void;
  setSpeed: (speed: number) => void;
  setScenario: (scenario: ScenarioType, spec: ArchitectureSpec) => void;
  toggleRunning: () => void;
  pauseSimulation: () => void;
  stepForward: () => void;
  resetSimulation: () => void;
  toggleEffects: () => void;
}

/**
 * Builds a modified ArchitectureSpec according to the chosen scenario.
 */
export function applyScenarioToSpec(
  baseSpec: ArchitectureSpec,
  scenario: ScenarioType
): ArchitectureSpec {
  const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(baseSpec));

  // Find target external provider or db
  const externalSvc = cloned.services.find(
    (s) => s.id.includes('provider') || s.id.includes('external')
  ) || cloned.services[cloned.services.length - 1];
  const targetId = externalSvc ? externalSvc.id : 'payment-provider';

  const cacheSvc = cloned.services.find(
    (s) => s.id.includes('cache') || s.id.includes('redis')
  );
  const cacheId = cacheSvc ? cacheSvc.id : 'cache';

  switch (scenario) {
    case 'baseline':
      cloned.faults = [];
      cloned.workload.pattern = 'constant';
      cloned.workload.multiplier = 1.0;
      break;

    case 'flash_sale':
      cloned.faults = [];
      cloned.workload.pattern = 'flash_sale';
      cloned.workload.multiplier = 3;
      break;

    case 'provider_latency':
      cloned.faults = [
        {
          type: 'latency',
          target: targetId,
          factor: 5,
          start_s: 60,
          end_s: 120,
        },
      ];
      break;

    case 'az_outage':
      cloned.faults = [
        {
          type: 'az_outage',
          zone: 'b',
          target: 'all',
          start_s: 60,
          end_s: 120,
        },
      ];
      break;

    case 'cache_flush':
      cloned.faults = [
        {
          type: 'cache_flush',
          target: cacheId,
          start_s: 60,
          end_s: 90,
        },
      ];
      break;

    case 'gray_failure':
      cloned.faults = [
        {
          type: 'gray_failure',
          target: targetId,
          percentage: 35,
          factor: 4,
          start_s: 60,
          end_s: 120,
        },
      ];
      break;

    case 'custom':
      // Preserve custom faults and workload as authored
      break;
  }

  return cloned;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  currentTime: 0,
  maxTime: 180,
  isRunning: false,
  speed: 1,
  seed: 42,
  selectedScenario: 'provider_latency',
  history: [],
  currentMetrics: null,
  originNodeId: null,
  effectsEnabled: true,

  initializeSimulation: (spec: ArchitectureSpec, seed = 42) => {
    const { selectedScenario } = get();
    const effectiveSpec = applyScenarioToSpec(spec, selectedScenario);
    const engine = new SimulationEngine(effectiveSpec, seed);
    const history = engine.runBatch(180);
    const initialMetrics = history[0] || null;

    // Detect origin node
    const firstFault = effectiveSpec.faults[0];
    const originNodeId = firstFault ? (firstFault.target === 'all' ? null : firstFault.target) : null;

    set({
      history,
      currentMetrics: initialMetrics,
      currentTime: 0,
      maxTime: 180,
      isRunning: false,
      seed,
      originNodeId,
    });
  },

  startLiveBattle: (spec: ArchitectureSpec, durationSeconds = 90, speed = 2) => {
    const engine = new SimulationEngine(spec, 42);
    const history = engine.runBatch(durationSeconds);
    const initialMetrics = history[0] || null;

    const firstFault = spec.faults[0];
    const originNodeId = firstFault ? (firstFault.target === 'all' ? null : firstFault.target) : null;

    set({
      selectedScenario: 'custom',
      history,
      currentMetrics: initialMetrics,
      currentTime: 0,
      maxTime: durationSeconds,
      speed,
      isRunning: true,
      seed: 42,
      originNodeId,
    });
  },

  runSimulationBatch: (
    spec: ArchitectureSpec,
    durationSeconds = 180,
    seed = 42,
    forceCustom = false
  ) => {
    const { selectedScenario, currentTime } = get();
    const effectiveScenario: ScenarioType = forceCustom ? 'custom' : selectedScenario;
    const effectiveSpec = applyScenarioToSpec(spec, effectiveScenario);
    const engine = new SimulationEngine(effectiveSpec, seed);
    const history = engine.runBatch(durationSeconds);
    const safeTime = Math.min(currentTime, history.length - 1);

    const firstFault = effectiveSpec.faults[0];
    const originNodeId = firstFault ? (firstFault.target === 'all' ? null : firstFault.target) : null;

    set({
      selectedScenario: effectiveScenario,
      history,
      currentMetrics: history[safeTime] || history[0],
      maxTime: durationSeconds,
      seed,
      originNodeId,
    });
  },

  setScenario: (scenario: ScenarioType, spec: ArchitectureSpec) => {
    const { seed } = get();
    const effectiveSpec = applyScenarioToSpec(spec, scenario);
    const engine = new SimulationEngine(effectiveSpec, seed);
    const history = engine.runBatch(180);

    const firstFault = effectiveSpec.faults[0];
    const originNodeId = firstFault ? (firstFault.target === 'all' ? null : firstFault.target) : null;

    set({
      selectedScenario: scenario,
      history,
      currentTime: 0,
      maxTime: 180,
      isRunning: false,
      currentMetrics: history[0] || null,
      originNodeId,
    });
  },

  setCurrentTime: (time: number) => {
    const { history, maxTime } = get();
    const safeTime = Math.max(0, Math.min(maxTime, Math.round(time)));
    const metrics = history[safeTime] || history[history.length - 1] || null;
    set({
      currentTime: safeTime,
      currentMetrics: metrics,
    });
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  toggleRunning: () => {
    const { isRunning, currentTime, maxTime } = get();
    if (!isRunning && currentTime >= maxTime) {
      set({ currentTime: 0, isRunning: true });
    } else {
      set({ isRunning: !isRunning });
    }
  },

  pauseSimulation: () => {
    set({ isRunning: false });
  },

  stepForward: () => {
    const { currentTime, maxTime, history } = get();
    if (currentTime < maxTime) {
      const nextTime = currentTime + 1;
      set({
        currentTime: nextTime,
        currentMetrics: history[nextTime] || null,
      });
    } else {
      set({ isRunning: false });
    }
  },

  resetSimulation: () => {
    const { history } = get();
    set({
      currentTime: 0,
      maxTime: 180,
      isRunning: false,
      currentMetrics: history[0] || null,
    });
  },

  toggleEffects: () => {
    set((state) => ({ effectsEnabled: !state.effectsEnabled }));
  },
}));
