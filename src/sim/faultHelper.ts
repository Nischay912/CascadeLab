import { ArchitectureSpec, FaultSpec, WorkloadSpec } from '../schema/architecture';

export interface SmartFaultDefinition {
  id: string;
  label: string;
  description: string;
  defaultDurationSeconds: number;
}

export const FAULT_DEFINITIONS: Record<string, SmartFaultDefinition> = {
  latency: {
    id: 'latency',
    label: 'Provider Lag 5x',
    description: '5x latency injection on downstream provider / external dependency',
    defaultDurationSeconds: 90,
  },
  kill_instances: {
    id: 'kill_instances',
    label: 'Kill 50% Nodes',
    description: 'Instant crash of 50% replicas on core service tier',
    defaultDurationSeconds: 90,
  },
  cache_flush: {
    id: 'cache_flush',
    label: 'Wipe Redis Cache',
    description: 'Cold-cache flush triggering backing store stampede',
    defaultDurationSeconds: 90,
  },
  az_outage: {
    id: 'az_outage',
    label: 'Kill Zone B',
    description: 'AWS / GCP Zone B availability outage across multi-zone nodes',
    defaultDurationSeconds: 90,
  },
  error: {
    id: 'error',
    label: '30% Error Rate',
    description: '30% unhandled 5xx exceptions at entry / gateway tier',
    defaultDurationSeconds: 90,
  },
  gray_failure: {
    id: 'gray_failure',
    label: 'Gray Degradation',
    description: 'Silent insidious latency creep & queue degradation',
    defaultDurationSeconds: 90,
  },
};

/**
 * Intelligently resolves the optimal target service and parameters
 * for any fault type across ANY architecture (template, AI-generated, or imported).
 */
export function resolveSmartFault(
  faultType: string,
  spec: ArchitectureSpec,
  currentTime: number = 0
): FaultSpec {
  const services = spec.services || [];
  const start_s = currentTime === 0 ? 0 : Math.round(currentTime);
  const duration = FAULT_DEFINITIONS[faultType]?.defaultDurationSeconds || 60;
  const end_s = currentTime === 0 ? duration : Math.min(180, Math.round(currentTime) + 60);

  switch (faultType) {
    case 'latency': {
      // Find downstream external provider, payment provider, database, or leaf service
      const target =
        services.find(
          (s) =>
            s.role === 'external' ||
            /provider|payment|external|thirdparty|partner|vendor|stripe|bank/i.test(s.id || s.name || '')
        ) ||
        services.find(
          (s) =>
            s.role === 'database' ||
            /db|database|storage|sql|mongo|postgres|rds/i.test(s.id || s.name || '')
        ) ||
        (services.length > 1 ? services[services.length - 1] : services[0]);

      return {
        id: `fault_latency_${Date.now()}`,
        type: 'latency',
        target: target ? target.id : 'payment-provider',
        start_s,
        end_s,
        factor: 5,
      };
    }

    case 'kill_instances': {
      // Find core domain or auth service with multiple instances (>= 2)
      const target =
        services.find(
          (s) =>
            /auth|identity|user|account|session|token|login/i.test(s.id || s.name || '') &&
            s.instances.initial >= 2
        ) ||
        // If no auth service with >= 2 instances, pick whichever service has the most instances
        [...services].sort((a, b) => b.instances.initial - a.instances.initial)[0] ||
        services.find((s) => /auth|identity|user|account|session|token|login/i.test(s.id || s.name || '')) ||
        services[Math.floor(services.length / 2)] ||
        services[0];

      return {
        id: `fault_kill_${Date.now()}`,
        type: 'kill_instances',
        target: target ? target.id : 'auth',
        start_s,
        end_s,
        percentage: 50,
      };
    }

    case 'cache_flush': {
      // Find cache, redis, memcached, or backing data service
      const target =
        services.find((s) => s.role === 'cache' || /cache|redis|memcache|session-store|kv/i.test(s.id || s.name || '')) ||
        services.find((s) =>
          spec.edges.some((e) => e.to === s.id && e.cache && (e.cache.hit_ratio || 0) > 0)
        ) ||
        services.find((s) => s.role === 'database' || /db|database/i.test(s.id || s.name || '')) ||
        (services.length > 1 ? services[1] : services[0]);

      return {
        id: `fault_cache_${Date.now()}`,
        type: 'cache_flush',
        target: target ? target.id : 'cache',
        start_s,
        end_s,
        warm_time_s: 30,
      };
    }

    case 'az_outage': {
      // AWS / GCP Zone B outage across all services
      return {
        id: `fault_az_${Date.now()}`,
        type: 'az_outage',
        target: 'all',
        zone: 'b',
        start_s,
        end_s,
      };
    }

    case 'error': {
      // 30% error rate on entry / gateway / router service
      const target =
        services.find((s) => s.entry || s.id === spec.workload.entry) ||
        services.find((s) => /gateway|ingress|api|router|proxy|entry|web|frontend/i.test(s.id || s.name || '')) ||
        services[0];

      return {
        id: `fault_error_${Date.now()}`,
        type: 'error',
        target: target ? target.id : spec.workload.entry || 'api-gateway',
        start_s,
        end_s,
        percentage: 30,
      };
    }

    case 'gray_failure': {
      // Subtle gray failure on middle-tier service
      const midIdx = Math.floor(services.length / 2);
      const target =
        services.find(
          (s) => s.role === 'service' && !s.entry && s.id !== spec.workload.entry
        ) ||
        services[midIdx] ||
        (services.length > 1 ? services[1] : services[0]);

      return {
        id: `fault_gray_${Date.now()}`,
        type: 'gray_failure',
        target: target ? target.id : 'catalog',
        start_s,
        end_s,
        percentage: 35,
        factor: 4,
      };
    }

    default: {
      return {
        id: `fault_${faultType}_${Date.now()}`,
        type: faultType as any,
        target: services[services.length - 1]?.id || 'payment-provider',
        start_s,
        end_s,
        factor: 5,
      };
    }
  }
}

/**
 * Resolves new WorkloadSpec when a user selects a workload profile button.
 */
export function resolveSmartWorkload(
  pattern: string,
  currentWorkload: WorkloadSpec
): WorkloadSpec {
  const base_rps = currentWorkload.base_rps || 600;
  let multiplier = 1.0;
  if (pattern === 'flash_sale') {
    multiplier = 3.0;
  } else if (pattern === 'ramp') {
    multiplier = 3.33;
  } else if (pattern === 'diurnal') {
    multiplier = 1.5;
  } else if (pattern === 'constant') {
    multiplier = 1.0;
  }

  return {
    ...currentWorkload,
    pattern: pattern as any,
    multiplier,
    base_rps,
  };
}

/**
 * Returns human-readable label for a target service in UI badges.
 */
export function getSmartTargetDisplayName(fault: FaultSpec, spec: ArchitectureSpec): string {
  if (fault.target === 'all') {
    return fault.zone ? `Zone ${fault.zone.toUpperCase()}` : 'All Services';
  }
  const svc = spec.services.find((s) => s.id === fault.target);
  return svc?.name || fault.target;
}
