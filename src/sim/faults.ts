import { FaultSpec } from '../schema/architecture';

export interface ServiceFaultModifiers {
  latencyMultiplier: number;
  injectedErrorRate: number;
  instanceReductionFraction: number;
  capacityFactor: number;
  isPartitioned: boolean;
  grayDegradationMs: number;
}

export interface EdgeFaultModifiers {
  isCut: boolean;
  cacheHitMultiplier: number;
}

/**
 * Evaluates all configured faults at second t and computes active impact per service and edge.
 */
export function evaluateActiveFaults(
  faults: FaultSpec[],
  t: number
): {
  activeFaults: FaultSpec[];
  serviceModifiers: Map<string, ServiceFaultModifiers>;
  edgeModifiers: Map<string, EdgeFaultModifiers>;
  downZones: Set<string>;
} {
  const activeFaults = faults.filter((f) => t >= f.start_s && t < f.end_s);
  const serviceModifiers = new Map<string, ServiceFaultModifiers>();
  const edgeModifiers = new Map<string, EdgeFaultModifiers>();
  const downZones = new Set<string>();

  const getServiceMod = (id: string): ServiceFaultModifiers => {
    let mod = serviceModifiers.get(id);
    if (!mod) {
      mod = {
        latencyMultiplier: 1.0,
        injectedErrorRate: 0.0,
        instanceReductionFraction: 0.0,
        capacityFactor: 1.0,
        isPartitioned: false,
        grayDegradationMs: 0.0,
      };
      serviceModifiers.set(id, mod);
    }
    return mod;
  };

  for (const fault of activeFaults) {
    switch (fault.type) {
      case 'latency': {
        const mod = getServiceMod(fault.target);
        mod.latencyMultiplier *= fault.factor || 5.0;
        break;
      }

      case 'error': {
        const mod = getServiceMod(fault.target);
        mod.injectedErrorRate = Math.min(1.0, mod.injectedErrorRate + (fault.percentage || 30) / 100);
        break;
      }

      case 'kill_instances': {
        const mod = getServiceMod(fault.target);
        mod.instanceReductionFraction = Math.min(
          1.0,
          mod.instanceReductionFraction + (fault.percentage || 50) / 100
        );
        break;
      }

      case 'brownout': {
        const mod = getServiceMod(fault.target);
        mod.capacityFactor *= (fault.percentage || 40) / 100;
        break;
      }

      case 'az_outage': {
        if (fault.zone) {
          downZones.add(fault.zone);
        }
        break;
      }

      case 'bad_deployment': {
        const mod = getServiceMod(fault.target);
        mod.injectedErrorRate = Math.min(1.0, mod.injectedErrorRate + (fault.percentage || 25) / 100);
        mod.latencyMultiplier *= fault.factor || 3.0;
        break;
      }

      case 'gray_failure': {
        const mod = getServiceMod(fault.target);
        // Creeps up latency linearly over incident duration
        const duration = Math.max(1, fault.end_s - fault.start_s);
        const elapsed = t - fault.start_s;
        const progress = Math.min(1.0, elapsed / duration);
        mod.grayDegradationMs += progress * (fault.factor ? fault.factor * 100 : 200);
        break;
      }

      case 'network_partition': {
        if (fault.target && fault.target_to) {
          const edgeKey = `${fault.target}->${fault.target_to}`;
          edgeModifiers.set(edgeKey, { isCut: true, cacheHitMultiplier: 1.0 });
        }
        break;
      }

      case 'cache_flush': {
        // Cache flushed to 0 at start, recovers over warm_time_s
        const warmTime = fault.warm_time_s || 30;
        const elapsed = t - fault.start_s;
        const recoveryProgress = Math.min(1.0, elapsed / warmTime);
        edgeModifiers.set(fault.target, {
          isCut: false,
          cacheHitMultiplier: recoveryProgress,
        });
        if (fault.target === 'cache' || fault.target.includes('cache')) {
          edgeModifiers.set('catalog->cache', {
            isCut: false,
            cacheHitMultiplier: recoveryProgress,
          });
        }
        break;
      }
    }
  }

  return { activeFaults, serviceModifiers, edgeModifiers, downZones };
}
