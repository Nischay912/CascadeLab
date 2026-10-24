import { ArchitectureSpec, FaultSpec } from '../schema/architecture';
import { SimulationTickMetrics } from './engine';

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
    label: 'Wipe Cache / Store',
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
 * Resolves the target service for a given fault type on the current architecture.
 * Prioritizes actual external providers (Payment GW, Stripe) over internal hubs (Payments Hub).
 */
export function resolveTargetServiceForFault(
  faultType: string,
  spec: ArchitectureSpec
): { id: string; name: string } {
  const services = spec.services || [];
  if (services.length === 0) {
    return { id: 'gateway', name: 'Gateway' };
  }

  switch (faultType) {
    case 'latency': {
      // 1. First priority: any explicitly marked external dependency
      const external = services.find((s) => s.role === 'external');
      if (external) return { id: external.id, name: external.name || external.id };

      // 2. Second priority: service matching external/provider/upstream/vendor/stripe/razorpay/bank
      // (explicitly skip internal payments hub if an external exists)
      const provider = services.find(
        (s) =>
          s.id !== 'payments' &&
          /provider|external|thirdparty|partner|vendor|stripe|razorpay|bank|upstream/i.test(
            s.id || s.name || ''
          )
      );
      if (provider) return { id: provider.id, name: provider.name || provider.id };

      // 3. Third priority: leaf dependency (service with no outgoing edges, except entry)
      const leaf = services.find((s) => !s.entry && !spec.edges.some((e) => e.from === s.id));
      if (leaf) return { id: leaf.id, name: leaf.name || leaf.id };

      // 4. Fourth priority: database
      const db = services.find(
        (s) =>
          s.role === 'database' ||
          /db|database|storage|sql|mongo|postgres|rds/i.test(s.id || s.name || '')
      );
      if (db) return { id: db.id, name: db.name || db.id };

      const fallback = services[services.length - 1];
      return { id: fallback.id, name: fallback.name || fallback.id };
    }

    case 'kill_instances': {
      // Find core domain or auth service with multiple instances (>= 2)
      const authWithReplicas = services.find(
        (s) =>
          /auth|identity|user|account|session|token|login/i.test(s.id || s.name || '') &&
          s.instances.initial >= 2
      );
      if (authWithReplicas) return { id: authWithReplicas.id, name: authWithReplicas.name || authWithReplicas.id };

      // If no auth with >= 2 replicas, pick service with the highest replica count
      const highestReplicas = [...services].sort((a, b) => b.instances.initial - a.instances.initial)[0];
      if (highestReplicas && highestReplicas.instances.initial >= 2) {
        return { id: highestReplicas.id, name: highestReplicas.name || highestReplicas.id };
      }

      const mid = services[Math.floor(services.length / 2)] || services[0];
      return { id: mid.id, name: mid.name || mid.id };
    }

    case 'cache_flush': {
      // Find cache, redis, memcached, or backing data service
      const cache = services.find(
        (s) =>
          s.role === 'cache' ||
          /cache|redis|memcache|session-store|kv/i.test(s.id || s.name || '')
      );
      if (cache) return { id: cache.id, name: cache.name || cache.id };

      const edgeCacheTarget = services.find((s) =>
        spec.edges.some((e) => e.to === s.id && e.cache && (e.cache.hit_ratio || 0) > 0)
      );
      if (edgeCacheTarget) return { id: edgeCacheTarget.id, name: edgeCacheTarget.name || edgeCacheTarget.id };

      const db = services.find((s) => s.role === 'database' || /db|database/i.test(s.id || s.name || ''));
      if (db) return { id: db.id, name: db.name || db.id };

      const fallback = services.length > 1 ? services[1] : services[0];
      return { id: fallback.id, name: fallback.name || fallback.id };
    }

    case 'az_outage': {
      return { id: 'all', name: 'Zone B (Multi-Zone)' };
    }

    case 'error': {
      // Ingress entry gateway
      const entry =
        services.find((s) => s.entry || s.id === spec.workload.entry) ||
        services.find((s) => /gateway|ingress|api|router|proxy|entry|web|frontend/i.test(s.id || s.name || '')) ||
        services[0];
      return { id: entry.id, name: entry.name || entry.id };
    }

    case 'gray_failure': {
      // Middle-tier domain service
      const midIdx = Math.floor(services.length / 2);
      const mid =
        services.find((s) => s.role === 'service' && !s.entry && s.id !== spec.workload.entry) ||
        services[midIdx] ||
        (services.length > 1 ? services[1] : services[0]);
      return { id: mid.id, name: mid.name || mid.id };
    }

    default: {
      const fallback = services[services.length - 1] || services[0];
      return { id: fallback.id, name: fallback.name || fallback.id };
    }
  }
}

/**
 * Intelligently resolves the optimal target service and parameters
 * for any fault type across ANY architecture (template, AI-generated, or imported).
 */
export function resolveSmartFault(
  faultType: string,
  spec: ArchitectureSpec,
  currentTime: number = 0,
  targetOverride?: string
): FaultSpec {
  // SRE Chaos Experiment Window:
  // If injecting during pre-incident baseline (currentTime < 25s), schedule fault cleanly
  // from 30s (Red Dot on Seekbar) to 95s, ensuring the incident remains actively broken
  // throughout the entire red-to-green window (including 00:43, 01:19, and 01:36),
  // and completely heals at exactly 110s (Green Dot on Seekbar).
  // If injecting dynamically mid-playback (currentTime >= 25s), fire immediately for 55 seconds.
  let start_s = 30;
  let end_s = 95;
  if (currentTime >= 25 && currentTime < 140) {
    start_s = Math.round(currentTime);
    end_s = Math.min(160, Math.round(currentTime) + 55);
  } else if (currentTime >= 140) {
    start_s = 30;
    end_s = 95;
  }

  const resolved = resolveTargetServiceForFault(faultType, spec);
  const targetId = targetOverride || resolved.id;

  switch (faultType) {
    case 'latency': {
      return {
        id: `fault_latency_${Date.now()}`,
        type: 'latency',
        target: targetId,
        start_s,
        end_s,
        factor: 5,
      };
    }

    case 'kill_instances': {
      return {
        id: `fault_kill_${Date.now()}`,
        type: 'kill_instances',
        target: targetId,
        start_s,
        end_s,
        percentage: 50,
      };
    }

    case 'cache_flush': {
      return {
        id: `fault_cache_${Date.now()}`,
        type: 'cache_flush',
        target: targetId,
        start_s,
        end_s,
        warm_time_s: 30,
      };
    }

    case 'az_outage': {
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
      return {
        id: `fault_error_${Date.now()}`,
        type: 'error',
        target: targetId,
        start_s,
        end_s,
        percentage: 30,
      };
    }

    case 'gray_failure': {
      return {
        id: `fault_gray_${Date.now()}`,
        type: 'gray_failure',
        target: targetId,
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
        target: targetId,
        start_s,
        end_s,
        factor: 5,
      };
    }
  }
}

export interface DynamicWorkloadProfile {
  id: string;
  title: string;
  desc: string;
  pattern: 'constant' | 'flash_sale' | 'ramp' | 'diurnal' | 'spike';
  multiplier: number;
  calculatedRps: number;
}

/**
 * Returns dynamic, architecture-contextual workload profiles.
 * Adapts to any base_rps (100 to 10,000 RPS) and domain (Gaming, Streaming, Rides, Banking, E-Commerce).
 */
export function getArchitectureWorkloadProfiles(spec: ArchitectureSpec): DynamicWorkloadProfile[] {
  const baseRps = spec.workload?.base_rps || 600;
  const name = (spec.name || '').toLowerCase();
  const desc = (spec.description || '').toLowerCase();
  const allText = `${name} ${desc}`;

  // Strict word-boundary matching so words like 'common' do NOT trigger 'mmo'
  const isEcommerce = /\b(shop|shopping|store|ecommerce|e-commerce|retail|cart|checkout|orders?|catalog)\b/i.test(allText);
  const isGaming = /\b(game|games|gaming|pubg|battle|matchmaking|players?|anti-cheat|fps|mmo|esports)\b/i.test(allText);
  const isStreaming = /\b(stream|streaming|video|cdn|hls|drm|manifest|media|vod|broadcast)\b/i.test(allText);
  const isRides = /\b(ride|rides|driver|drivers|trip|trips|cab|cabs|taxi|fleet|dispatch|commute)\b/i.test(allText);
  const isBanking = /\b(bank|banking|upi|switch|fintech|transactions?|settlement|ledger)\b/i.test(allText);

  // If explicitly ecommerce (like ShopFast), return E-Commerce profiles
  if (isEcommerce) {
    return [
      {
        id: 'constant',
        title: 'Constant Baseline',
        desc: `${baseRps} RPS steady load`,
        pattern: 'constant',
        multiplier: 1.0,
        calculatedRps: baseRps,
      },
      {
        id: 'flash_sale',
        title: 'Flash Sale Peak',
        desc: `Surge from ${baseRps} to ${Math.round(baseRps * 3)} RPS (3x)`,
        pattern: 'flash_sale',
        multiplier: 3.0,
        calculatedRps: Math.round(baseRps * 3),
      },
      {
        id: 'ramp',
        title: 'Gradual Ramp Up',
        desc: `Linear climb 0 to ${Math.round(baseRps * 3.33)} RPS`,
        pattern: 'ramp',
        multiplier: 3.33,
        calculatedRps: Math.round(baseRps * 3.33),
      },
      {
        id: 'diurnal',
        title: 'Diurnal Wave',
        desc: `Day / night curve (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
        pattern: 'diurnal',
        multiplier: 1.5,
        calculatedRps: Math.round(baseRps * 1.4),
      },
    ];
  }

  if (isGaming) {
    return [
      {
        id: 'constant',
        title: 'Lobby Baseline',
        desc: `${baseRps} RPS steady player traffic`,
        pattern: 'constant',
        multiplier: 1.0,
        calculatedRps: baseRps,
      },
      {
        id: 'flash_sale',
        title: 'Weekend Match Surge',
        desc: `Surge to ${Math.round(baseRps * 3)} RPS (3x queue)`,
        pattern: 'flash_sale',
        multiplier: 3.0,
        calculatedRps: Math.round(baseRps * 3),
      },
      {
        id: 'ramp',
        title: 'Tournament Finals Influx',
        desc: `Climb 0 to ${Math.round(baseRps * 3.33)} RPS`,
        pattern: 'ramp',
        multiplier: 3.33,
        calculatedRps: Math.round(baseRps * 3.33),
      },
      {
        id: 'diurnal',
        title: 'Daily Player Wave',
        desc: `Peak hours (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
        pattern: 'diurnal',
        multiplier: 1.5,
        calculatedRps: Math.round(baseRps * 1.4),
      },
    ];
  }

  if (isStreaming) {
    return [
      {
        id: 'constant',
        title: 'Off-Peak CDN Streams',
        desc: `${baseRps} RPS baseline throughput`,
        pattern: 'constant',
        multiplier: 1.0,
        calculatedRps: baseRps,
      },
      {
        id: 'flash_sale',
        title: 'World Cup / Live Stream Surge',
        desc: `Instant surge to ${Math.round(baseRps * 3)} RPS`,
        pattern: 'flash_sale',
        multiplier: 3.0,
        calculatedRps: Math.round(baseRps * 3),
      },
      {
        id: 'ramp',
        title: 'Prime-Time Binge Ramp',
        desc: `Linear climb to ${Math.round(baseRps * 3.33)} RPS`,
        pattern: 'ramp',
        multiplier: 3.33,
        calculatedRps: Math.round(baseRps * 3.33),
      },
      {
        id: 'diurnal',
        title: '24hr Viewership Curve',
        desc: `Day / night broadcast (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
        pattern: 'diurnal',
        multiplier: 1.5,
        calculatedRps: Math.round(baseRps * 1.4),
      },
    ];
  }

  if (isRides) {
    return [
      {
        id: 'constant',
        title: 'City Fleet Baseline',
        desc: `${baseRps} RPS steady ride requests`,
        pattern: 'constant',
        multiplier: 1.0,
        calculatedRps: baseRps,
      },
      {
        id: 'flash_sale',
        title: 'Rainstorm Surge Peak',
        desc: `Surge to ${Math.round(baseRps * 3)} RPS (3x surge)`,
        pattern: 'flash_sale',
        multiplier: 3.0,
        calculatedRps: Math.round(baseRps * 3),
      },
      {
        id: 'ramp',
        title: 'Morning Commute Ramp',
        desc: `Climb 0 to ${Math.round(baseRps * 3.33)} RPS`,
        pattern: 'ramp',
        multiplier: 3.33,
        calculatedRps: Math.round(baseRps * 3.33),
      },
      {
        id: 'diurnal',
        title: '24hr Trip Demand Curve',
        desc: `Commute peaks (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
        pattern: 'diurnal',
        multiplier: 1.5,
        calculatedRps: Math.round(baseRps * 1.4),
      },
    ];
  }

  if (isBanking) {
    return [
      {
        id: 'constant',
        title: 'Core Switch Baseline',
        desc: `${baseRps} RPS steady financial switch`,
        pattern: 'constant',
        multiplier: 1.0,
        calculatedRps: baseRps,
      },
      {
        id: 'flash_sale',
        title: 'Salary Day / Festive Spike',
        desc: `Surge to ${Math.round(baseRps * 3)} RPS (3x)`,
        pattern: 'flash_sale',
        multiplier: 3.0,
        calculatedRps: Math.round(baseRps * 3),
      },
      {
        id: 'ramp',
        title: 'Clearing Settlement Ramp',
        desc: `Linear climb to ${Math.round(baseRps * 3.33)} RPS`,
        pattern: 'ramp',
        multiplier: 3.33,
        calculatedRps: Math.round(baseRps * 3.33),
      },
      {
        id: 'diurnal',
        title: 'Banking Hours Oscillation',
        desc: `Market hours (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
        pattern: 'diurnal',
        multiplier: 1.5,
        calculatedRps: Math.round(baseRps * 1.4),
      },
    ];
  }

  // Default E-Commerce / Web Platform
  return [
    {
      id: 'constant',
      title: 'Constant Baseline',
      desc: `${baseRps} RPS steady load`,
      pattern: 'constant',
      multiplier: 1.0,
      calculatedRps: baseRps,
    },
    {
      id: 'flash_sale',
      title: 'Flash Sale Peak',
      desc: `Surge from ${baseRps} to ${Math.round(baseRps * 3)} RPS (3x)`,
      pattern: 'flash_sale',
      multiplier: 3.0,
      calculatedRps: Math.round(baseRps * 3),
    },
    {
      id: 'ramp',
      title: 'Gradual Ramp Up',
      desc: `Linear climb 0 to ${Math.round(baseRps * 3.33)} RPS`,
      pattern: 'ramp',
      multiplier: 3.33,
      calculatedRps: Math.round(baseRps * 3.33),
    },
    {
      id: 'diurnal',
      title: 'Diurnal Wave',
      desc: `Day / night curve (${Math.round(baseRps * 0.6)} - ${Math.round(baseRps * 1.4)} RPS)`,
      pattern: 'diurnal',
      multiplier: 1.5,
      calculatedRps: Math.round(baseRps * 1.4),
    },
  ];
}

/**
 * Returns dynamic, architecture-specific fault button descriptors.
 */
export function getArchitectureFaultDeck(spec: ArchitectureSpec) {
  const latencyTarget = resolveTargetServiceForFault('latency', spec);
  const killTarget = resolveTargetServiceForFault('kill_instances', spec);
  const cacheTarget = resolveTargetServiceForFault('cache_flush', spec);
  const errorTarget = resolveTargetServiceForFault('error', spec);
  const grayTarget = resolveTargetServiceForFault('gray_failure', spec);

  return [
    {
      id: 'latency',
      label: `Provider Lag (5x)`,
      targetName: latencyTarget.name,
      targetId: latencyTarget.id,
      description: `5x latency injection on ${latencyTarget.name}`,
    },
    {
      id: 'kill_instances',
      label: `Kill 50% Nodes`,
      targetName: killTarget.name,
      targetId: killTarget.id,
      description: `Crash 50% replicas on ${killTarget.name}`,
    },
    {
      id: 'cache_flush',
      label: `Wipe Cache / Herd`,
      targetName: cacheTarget.name,
      targetId: cacheTarget.id,
      description: `Flush cache on ${cacheTarget.name}`,
    },
    {
      id: 'az_outage',
      label: `Kill Zone B`,
      targetName: 'Zone B Outage',
      targetId: 'all',
      description: `Simulate cloud Zone B AZ failure across multi-zone services`,
    },
    {
      id: 'error',
      label: `30% Error Rate`,
      targetName: errorTarget.name,
      targetId: errorTarget.id,
      description: `30% unhandled 5xx exceptions on ${errorTarget.name}`,
    },
    {
      id: 'gray_failure',
      label: `Gray Degradation`,
      targetName: grayTarget.name,
      targetId: grayTarget.id,
      description: `Silent degradation creeping up on ${grayTarget.name}`,
    },
  ];
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

/**
 * Computes the real-time operational resilience score (0..100) dynamically
 * for ANY architecture topology (templates, custom imports, or AI-generated).
 *
 * Factors in:
 * 1. User Success Rate vs SLO (50% weight)
 * 2. Latency SLA Compliance vs SLO (25% weight)
 * 3. Fleet Replicas Availability / Health (25% weight)
 */
export function calculateLiveResilienceScore(
  spec: ArchitectureSpec,
  metrics: SimulationTickMetrics | null
): number {
  if (!metrics) return 100;

  const successRate = metrics.userSuccessRate ?? 100;
  const p95LatencyMs = metrics.userP95Ms ?? (spec.slo?.p95_ms || 300);
  const sloP95 = spec.slo?.p95_ms || 400;
  const sloSuccess = spec.slo?.success_pct || 99;

  // 1. Success Component (50%)
  const successScore = Math.max(0, Math.min(100, (successRate / sloSuccess) * 100));

  // 2. Latency SLA Compliance (25%)
  const latencyScore =
    p95LatencyMs <= sloP95
      ? 100
      : Math.max(0, Math.min(100, (sloP95 / p95LatencyMs) * 100));

  // 3. Fleet Instance Health (25%)
  const totalCrashed = metrics.crashedInstances ?? 0;
  const totalActive = metrics.activeInstances ?? 1;
  const totalFleet = totalActive + totalCrashed;
  const fleetScore = totalFleet > 0 ? Math.max(0, Math.min(100, (totalActive / totalFleet) * 100)) : 100;

  const composite = Math.round(
    0.50 * successScore +
    0.25 * latencyScore +
    0.25 * fleetScore
  );

  return Math.max(0, Math.min(100, composite));
}
