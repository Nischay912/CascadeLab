import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from './engine';

export interface WorkerRunMessage {
  type: 'RUN_BATCH';
  spec: ArchitectureSpec;
  durationSeconds?: number;
  seed?: number;
}

export interface WorkerResultMessage {
  type: 'BATCH_COMPLETE';
  results: SimulationTickMetrics[];
  elapsedMs: number;
}

// In Web Worker context (self is DedicatedWorkerGlobalScope)
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (e: MessageEvent<WorkerRunMessage>) => {
    const { type, spec, durationSeconds = 180, seed = 42 } = e.data;
    if (type === 'RUN_BATCH') {
      const startTime = performance.now();
      const engine = new SimulationEngine(spec, seed);
      const results = engine.runBatch(durationSeconds);
      const elapsedMs = performance.now() - startTime;

      const response: WorkerResultMessage = {
        type: 'BATCH_COMPLETE',
        results,
        elapsedMs,
      };
      self.postMessage(response);
    }
  };
}

/**
 * Helper to run simulation in current thread or offload to worker if available.
 */
export function runSimulationDirect(
  spec: ArchitectureSpec,
  durationSeconds: number = 180,
  seed: number = 42
): { results: SimulationTickMetrics[]; elapsedMs: number } {
  const startTime = performance.now();
  const engine = new SimulationEngine(spec, seed);
  const results = engine.runBatch(durationSeconds);
  const elapsedMs = performance.now() - startTime;
  return { results, elapsedMs };
}
