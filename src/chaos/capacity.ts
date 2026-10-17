import { ArchitectureSpec } from '../schema/architecture';
import { SimulationEngine, SimulationTickMetrics } from '../sim/engine';
import { CapacitySweepPoint, CapacityCliffReport } from './types';

/**
 * Runs a deterministic capacity sweep across offered RPS from 0.2x to 4.0x baseline.
 * Detects the capacity cliff / knee point and isolates the primary bottleneck service.
 */
export function runCapacitySweep(
  spec: ArchitectureSpec,
  onProgress?: (step: number, totalSteps: number) => void
): CapacityCliffReport {
  const baseRps = Math.max(50, spec.workload.base_rps || 1000);
  const multipliers = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.3, 2.6, 3.0, 3.5, 4.0,
  ];

  const points: CapacitySweepPoint[] = [];
  let baselineP95 = 50;

  for (let i = 0; i < multipliers.length; i++) {
    const mult = multipliers[i];
    const offeredRps = Math.round(baseRps * mult);

    // Prepare clean spec with constant load and no faults
    const clonedSpec: ArchitectureSpec = JSON.parse(JSON.stringify(spec));
    clonedSpec.faults = [];
    clonedSpec.workload.pattern = 'constant';
    clonedSpec.workload.base_rps = offeredRps;
    clonedSpec.workload.multiplier = 1.0;

    // Run 20 ticks to reach steady-state
    const engine = new SimulationEngine(clonedSpec, 42);
    const ticks: SimulationTickMetrics[] = engine.runBatch(20);
    const steadyTick = ticks[ticks.length - 1];

    if (i === 0) {
      baselineP95 = Math.max(20, steadyTick.userP95Ms);
    }

    // Find the bottleneck service for this load point
    let highestUtil = 0;
    let bottleneckServiceId: string | null = null;

    for (const [sId, sMetrics] of Object.entries(steadyTick.services)) {
      if (sMetrics.utilization > highestUtil) {
        highestUtil = sMetrics.utilization;
        bottleneckServiceId = sId;
      }
    }

    const goodputRps = Math.round(offeredRps * (steadyTick.userSuccessRate / 100));

    points.push({
      offeredRps,
      goodputRps,
      successRate: Math.round(steadyTick.userSuccessRate * 10) / 10,
      p95Ms: Math.round(steadyTick.userP95Ms),
      bottleneckServiceId,
      bottleneckUtil: Math.round(highestUtil * 100) / 100,
    });

    if (onProgress) {
      onProgress(i + 1, multipliers.length);
    }
  }

  // Detect Knee Point:
  // The first point where system starts failing SLO or saturation kicks in:
  // 1. successRate < spec.slo.success_pct - 1
  // 2. bottleneckUtil >= 0.98
  // 3. goodput departs significantly (< 95% of offered load)
  // 4. p95 latency jumps > 2.5x baseline
  let kneeIndex = -1;
  const sloThreshold = Math.max(80, spec.slo.success_pct - 1);

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const isDegraded =
      pt.successRate < sloThreshold ||
      pt.bottleneckUtil >= 0.99 ||
      pt.goodputRps < pt.offeredRps * 0.94 ||
      pt.p95Ms > baselineP95 * 2.5;

    if (isDegraded) {
      kneeIndex = i;
      break;
    }
  }

  let kneeRps = baseRps;
  let primaryBottleneckId = spec.services[0]?.id || 'unknown';

  if (kneeIndex === -1) {
    // System is resilient across the full range
    kneeRps = points[points.length - 1].offeredRps;
    primaryBottleneckId = points[points.length - 1].bottleneckServiceId || primaryBottleneckId;
  } else if (kneeIndex === 0) {
    // Saturation already at lowest tested point
    kneeRps = points[0].offeredRps;
    primaryBottleneckId = points[0].bottleneckServiceId || primaryBottleneckId;
  } else {
    // Knee is between kneeIndex - 1 and kneeIndex
    const prevPt = points[kneeIndex - 1];
    const currPt = points[kneeIndex];

    // Linear interpolation for more precise knee location
    kneeRps = Math.round((prevPt.offeredRps + currPt.offeredRps) / 2);
    primaryBottleneckId = currPt.bottleneckServiceId || prevPt.bottleneckServiceId || primaryBottleneckId;
  }

  const maxGoodputRps = Math.max(...points.map((p) => p.goodputRps));
  const headroomRatio = Math.round((kneeRps / baseRps) * 100) / 100;

  return {
    baseRps,
    kneeRps,
    maxGoodputRps,
    headroomRatio,
    primaryBottleneckId,
    points,
  };
}
