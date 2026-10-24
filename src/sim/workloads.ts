import { WorkloadSpec } from '../schema/architecture';

/**
 * Computes the offered external arrival rate (RPS) at a specific simulation second t.
 */
export function getOfferedWorkloadRps(workload: WorkloadSpec, t: number): number {
  const { pattern, base_rps, multiplier = 1.0 } = workload;
  // Ensure non-constant stress profiles always produce an authentic surge (at least 2.8x - 3.0x base load)
  const peakMultiplier = Math.max(multiplier || 1.0, pattern === 'constant' ? 1.0 : 3.0);
  const peakRps = Math.round(base_rps * peakMultiplier);

  switch (pattern) {
    case 'constant':
      return Math.round(base_rps * (multiplier || 1.0));

    case 'flash_sale':
    case 'spike': {
      // SRE Chaos Experiment Timeline:
      // 0s <= t < 30s: Pre-incident nominal baseline (e.g. 600 RPS) -> 100% HEALTHY GREEN
      // 30s <= t < 36s: Rapid surge onset
      // 36s <= t <= 95s: Full peak surge sustained (e.g. 1800 RPS) -> RED DOT AT 30s!
      //   -> At 43s (00:43): Active overload / broken
      //   -> At 79s (01:19): Active overload / broken (NEVER healed before green dot!)
      //   -> At 96s (01:36): Active overload / broken (NEVER healed before green dot!)
      // 95s < t <= 104s: Fast linear cooldown back to baseline (600 RPS)
      // 104s < t <= 180s: Post-recovery nominal baseline restored (600 RPS) -> GREEN DOT AT 110s!
      if (t < 30) return base_rps;
      if (t < 36) return Math.round(base_rps + (peakRps - base_rps) * ((t - 30) / 6));
      if (t <= 95) return peakRps;
      if (t <= 104) return Math.round(base_rps + (peakRps - base_rps) * ((104 - t) / 9));
      return base_rps;
    }

    case 'ramp': {
      // 0s <= t < 25s: Nominal baseline -> 100% HEALTHY GREEN
      // 25s <= t <= 38s: Rapid progressive influx climb to peak (1800 RPS) -> RED DOT AT 25s!
      // 38s < t <= 95s: Peak influx sustained overload!
      //   -> At 43s (00:43): Active influx overload / broken
      //   -> At 79s (01:19): Active overload / broken (NEVER healed before green dot!)
      //   -> At 96s (01:36): Active overload / broken (NEVER healed before green dot!)
      // 95s < t <= 104s: Cooldown back to baseline
      // 104s < t <= 180s: Post-recovery nominal baseline -> GREEN DOT AT 110s!
      if (t < 25) return base_rps;
      if (t <= 38) return Math.round(base_rps + (peakRps - base_rps) * ((t - 25) / 13));
      if (t <= 95) return peakRps;
      if (t <= 104) return Math.round(base_rps + (peakRps - base_rps) * ((104 - t) / 9));
      return base_rps;
    }

    case 'diurnal': {
      // Daily Rush Hour Cycle:
      // 0s <= t < 25s: Nominal baseline -> 100% HEALTHY GREEN
      // 25s <= t <= 38s: Morning rush hour surge to peak demand (1800 RPS) -> RED DOT AT 30s!
      // 38s < t <= 95s: Peak rush hour plateau sustained overload!
      //   -> At 43s (00:43): Active rush hour overload / broken
      //   -> At 79s (01:19): Active overload / broken (NEVER healed before green dot!)
      //   -> At 96s (01:36): Active overload / broken (NEVER healed before green dot!)
      // 95s < t <= 104s: Evening cooldown to nominal baseline
      // 104s < t <= 180s: Post-recovery nominal baseline -> GREEN DOT AT 110s!
      if (t < 25) return base_rps;
      if (t <= 38) return Math.round(base_rps + (peakRps - base_rps) * ((t - 25) / 13));
      if (t <= 95) return peakRps;
      if (t <= 104) return Math.round(base_rps + (peakRps - base_rps) * ((104 - t) / 9));
      return base_rps;
    }

    case 'custom': {
      if (!workload.custom_curve || workload.custom_curve.length === 0) {
        return base_rps;
      }
      const index = Math.min(Math.floor(t), workload.custom_curve.length - 1);
      return workload.custom_curve[index] || base_rps;
    }

    default:
      return base_rps;
  }
}
