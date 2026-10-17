import yaml from 'js-yaml';
import {
  ArchitectureSpec,
  validateArchitecture,
  generateEdgeId,
} from './architecture';

/**
 * Parses either a JSON or YAML string into a validated ArchitectureSpec.
 */
export function parseArchitectureYamlOrJson(content: string): ArchitectureSpec {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    try {
      parsed = yaml.load(content);
    } catch (e: any) {
      throw new Error(`Failed to parse YAML or JSON: ${e.message}`);
    }
  }

  const validation = validateArchitecture(parsed);
  if (!validation.success || !validation.data) {
    throw new Error(`Architecture validation failed:\n${validation.errors?.join('\n')}`);
  }
  return validation.data;
}

/**
 * Serializes an ArchitectureSpec into a clean YAML string.
 */
export function exportArchitectureToYaml(spec: ArchitectureSpec): string {
  return yaml.dump(spec, {
    indent: 2,
    noRefs: true,
    sortKeys: false,
  });
}

/**
 * Parses a docker-compose.yml file into a valid CascadeLab ArchitectureSpec.
 * Maps services, replicas, and depends_on dependencies into a full graph.
 */
export function importFromDockerCompose(composeYaml: string): ArchitectureSpec {
  let compose: any;
  try {
    compose = yaml.load(composeYaml);
  } catch (e: any) {
    throw new Error(`Invalid Docker Compose YAML: ${e.message}`);
  }

  if (!compose || typeof compose !== 'object' || !compose.services) {
    throw new Error('Docker Compose file must contain a "services" block.');
  }

  const rawServices = compose.services;
  const serviceKeys = Object.keys(rawServices);

  if (serviceKeys.length === 0) {
    throw new Error('No services defined in Docker Compose file.');
  }

  const services: ArchitectureSpec['services'] = [];
  const edges: ArchitectureSpec['edges'] = [];

  let potentialEntry = serviceKeys[0];

  for (const sKey of serviceKeys) {
    const raw = rawServices[sKey] || {};

    // Replicas from deploy.replicas or scale
    const replicas =
      raw.deploy?.replicas ||
      raw.scale ||
      (sKey.includes('db') || sKey.includes('redis') || sKey.includes('mongo') ? 1 : 3);

    // Identify entry service (e.g., exposed port 80, 443, 8080, or named gateway/proxy)
    const hasExposedPorts = Array.isArray(raw.ports) && raw.ports.length > 0;
    const isNamedEntry =
      sKey.includes('gateway') ||
      sKey.includes('nginx') ||
      sKey.includes('ingress') ||
      sKey.includes('proxy') ||
      sKey.includes('web');

    if (hasExposedPorts || isNamedEntry) {
      potentialEntry = sKey;
    }

    // Role detection
    let role = 'Backend Service';
    if (sKey.includes('db') || sKey.includes('postgres') || sKey.includes('mysql')) {
      role = 'Database Store';
    } else if (sKey.includes('redis') || sKey.includes('cache') || sKey.includes('memcached')) {
      role = 'Cache Store';
    } else if (sKey.includes('queue') || sKey.includes('kafka') || sKey.includes('rabbit')) {
      role = 'Message Broker';
    } else if (isNamedEntry) {
      role = 'API Gateway';
    }

    services.push({
      id: sKey,
      name: raw.container_name || sKey.toUpperCase(),
      role,
      entry: false, // will set entry on potentialEntry afterwards
      instances: {
        initial: replicas,
        min: Math.max(1, Math.floor(replicas / 2)),
        max: Math.max(replicas * 3, 10),
      },
      concurrency: sKey.includes('db') ? 100 : 50,
      service_time_ms: sKey.includes('db') ? 8 : 15,
      queue_limit: 200,
      load_shedding: { enabled: false, threshold: 0.8 },
      autoscale: {
        enabled: !sKey.includes('db'),
        target_util: 0.6,
        eval_period_s: 15,
        startup_delay_s: 45,
        cooldown_s: 120,
      },
      crash: {
        enabled: true,
        after_overload_s: 20,
        restart_delay_s: 30,
      },
      cost_inr_per_instance_month: sKey.includes('db') ? 4500 : 2500,
      zone_spread: ['a', 'b'],
    });

    // Parse depends_on
    if (raw.depends_on) {
      let dependencies: string[] = [];
      if (Array.isArray(raw.depends_on)) {
        dependencies = raw.depends_on;
      } else if (typeof raw.depends_on === 'object') {
        dependencies = Object.keys(raw.depends_on);
      }

      for (const dep of dependencies) {
        if (serviceKeys.includes(dep)) {
          edges.push({
            id: generateEdgeId(sKey, dep),
            from: sKey,
            to: dep,
            calls_per_request: 1.0,
            mode: 'sync',
            critical: true,
            timeout_ms: 1500,
            retries: 2,
            backoff: { mode: 'none', jitter: false, base_delay_ms: 100, max_delay_ms: 2000 },
            circuit_breaker: {
              enabled: false,
              failure_rate_threshold: 0.5,
              min_calls: 10,
              open_duration_s: 15,
              probe_fraction: 0.1,
            },
            cache: { hit_ratio: 0.0, warm_time_s: 30 },
            bulkhead_max_concurrent: null,
          });
        }
      }
    }
  }

  // Set entry service
  for (const svc of services) {
    if (svc.id === potentialEntry) {
      svc.entry = true;
    }
  }

  const spec: ArchitectureSpec = {
    name: 'Imported from Docker Compose',
    description: `Auto-generated topology from docker-compose with ${services.length} services`,
    slo: { success_pct: 99.0, p95_ms: 800 },
    value_per_request_inr: 40,
    services,
    edges,
    workload: {
      entry: potentialEntry,
      pattern: 'constant',
      base_rps: 500,
      multiplier: 1.0,
      duration_s: 180,
      ramp_time_s: 30,
    },
    faults: [],
    seed: 42,
  };

  return spec;
}
