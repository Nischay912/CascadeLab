import { WorkloadSpec } from '../schema/architecture';

/**
 * Computes the offered external arrival rate (RPS) at a specific simulation second t.
 */
export function getOfferedWorkloadRps(workload: WorkloadSpec, t: number): number {
  const { pattern, base_rps, multiplier = 1.0, ramp_time_s = 90 } = workload;
  const peakRps = Math.round(base_rps * (multiplier || 1.0));

  switch (pattern) {
    case 'constant':
      return Math.round(base_rps * multiplier);

    case 'ramp': {
      // Linear climb from base_rps up to peakRps over 90s, with immediate slight lift at t=0
      const climbDuration = Math.max(45, ramp_time_s);
      const progress = Math.min(1.0, Math.max(0, t / climbDuration));
      // Starts at base_rps * 1.15 at t=0 so clicking ramp immediately registers visually
      const startRps = Math.round(base_rps * 1.15);
      if (t >= climbDuration) return peakRps;
      return Math.round(startRps + (peakRps - startRps) * progress);
    }

    case 'spike': {
      // Immediate sharp spike from t=0..40s, then exponential decay back to baseline
      if (t <= 35) return peakRps;
      const decayTime = t - 35;
      const decay = Math.exp(-decayTime / 25);
      return Math.round(base_rps + (peakRps - base_rps) * decay);
    }

    case 'diurnal': {
      // 60-second full day/night cycle (oscillates between 0.5x night valley and 1.5x day peak)
      const period = 60;
      const sine = Math.sin((t / period) * 2 * Math.PI); // [-1, 1]
      // At t=0, sine is 0, so factor is 1.0 (baseline). Peak at t=15s (1.5x), valley at t=45s (0.5x)
      const factor = 1.0 + 0.5 * sine;
      return Math.round(base_rps * factor);
    }

    case 'flash_sale': {
      // Immediate 3.0x peak surge from t=0..90s, then gradual cool-down to baseline
      if (t <= 90) return peakRps;
      if (t <= 130) {
        const cooldown = (130 - t) / 40;
        return Math.round(base_rps + (peakRps - base_rps) * cooldown);
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
