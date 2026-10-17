import { WorkloadSpec } from '../schema/architecture';

/**
 * Computes the offered external arrival rate (RPS) at a specific simulation second t.
 */
export function getOfferedWorkloadRps(workload: WorkloadSpec, t: number): number {
  const { pattern, base_rps, multiplier, ramp_time_s = 30 } = workload;
  const peakRps = base_rps * multiplier;

  switch (pattern) {
    case 'constant':
      return base_rps * multiplier;

    case 'ramp': {
      if (t <= 0) return base_rps;
      if (t >= ramp_time_s) return peakRps;
      const progress = t / ramp_time_s;
      return base_rps + (peakRps - base_rps) * progress;
    }

    case 'spike': {
      // Baseline until t=30, sharp spike between 30 and 70, then exponential decay
      if (t < 30) return base_rps;
      if (t <= 70) return peakRps;
      const decayTime = t - 70;
      const decay = Math.exp(-decayTime / 20);
      return base_rps + (peakRps - base_rps) * decay;
    }

    case 'diurnal': {
      // Smooth sine curve oscillating between 0.5 * base and peak
      const period = 120; // 2 minute cycle in simulation
      const sine = (Math.sin((t / period) * 2 * Math.PI) + 1) / 2; // [0, 1]
      return base_rps * (0.6 + 0.8 * sine) * multiplier;
    }

    case 'flash_sale': {
      // 0..30s: baseline (e.g. 600 RPS)
      // 30..45s: rapid pre-surge buildup
      // 45..120s: sustained flash sale peak (e.g. 1800 RPS)
      // 120..150s: cool-down back to baseline
      if (t < 30) return base_rps;
      if (t < 45) {
        const ramp = (t - 30) / 15;
        return base_rps + (peakRps - base_rps) * ramp;
      }
      if (t <= 120) return peakRps;
      if (t < 150) {
        const cooldown = (150 - t) / 30;
        return base_rps + (peakRps - base_rps) * cooldown;
      }
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
