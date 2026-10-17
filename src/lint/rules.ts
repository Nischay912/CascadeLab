import { ArchitectureSpec } from '../schema/architecture';
import {
  findArticulationPoints,
  detectSyncCycles,
  findRetryAmplificationPaths,
  findTimeoutInversions,
} from './graph';

export interface LintFinding {
  id: string;
  ruleId: string; // 'L1' .. 'L16'
  severity: 'critical' | 'warning' | 'info';
  title: string;
  target: string;
  targetType: 'service' | 'edge' | 'path' | 'system';
  reason: string;
  fix: string;
  autoFix?: (spec: ArchitectureSpec) => ArchitectureSpec;
}

export type LintRule = {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  evaluate: (spec: ArchitectureSpec) => LintFinding[];
};

// Deep clone utility for immutable auto-fix operations
function cloneSpec(spec: ArchitectureSpec): ArchitectureSpec {
  return JSON.parse(JSON.stringify(spec));
}

export const lintRules: LintRule[] = [
  // L1: Retries with no backoff
  {
    id: 'L1',
    title: 'Retries with No Backoff',
    severity: 'critical',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.edges.forEach((edge, idx) => {
        if (edge.retries > 0 && (!edge.backoff || edge.backoff.mode === 'none')) {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          const isCritical = edge.retries >= 3;
          findings.push({
            id: `L1-${edgeId}-${idx}`,
            ruleId: 'L1',
            severity: isCritical ? 'critical' : 'warning',
            title: isCritical ? 'Retry Storm Trap (R >= 3, No Backoff)' : 'Retries Without Backoff',
            target: `${edge.from} → ${edge.to}`,
            targetType: 'edge',
            reason: `Edge '${edge.from} → ${edge.to}' has ${edge.retries} retries with no backoff delay, triggering an instant retry storm during callee slowdown.`,
            fix: 'Add exponential backoff with full jitter (mode: exponential, jitter: true)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetEdge = updated.edges.find(
                (e) => (e.id || `${e.from}->${e.to}`) === edgeId
              );
              if (targetEdge) {
                targetEdge.backoff = {
                  mode: 'exponential',
                  base_delay_ms: 100,
                  max_delay_ms: 2000,
                  jitter: true,
                };
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L2: Retries without jitter
  {
    id: 'L2',
    title: 'Retries Without Jitter',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.edges.forEach((edge, idx) => {
        if (edge.retries > 0 && edge.backoff && edge.backoff.mode !== 'none' && !edge.backoff.jitter) {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          findings.push({
            id: `L2-${edgeId}-${idx}`,
            ruleId: 'L2',
            severity: 'warning',
            title: 'Retries Without Jitter',
            target: `${edge.from} → ${edge.to}`,
            targetType: 'edge',
            reason: `Edge '${edge.from} → ${edge.to}' has backoff configured without jitter, causing recurring synchronized waves when clients retry.`,
            fix: 'Enable randomized full jitter on retry backoff (jitter: true)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetEdge = updated.edges.find(
                (e) => (e.id || `${e.from}->${e.to}`) === edgeId
              );
              if (targetEdge?.backoff) {
                targetEdge.backoff.jitter = true;
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L3: Excessive retries (R > 3)
  {
    id: 'L3',
    title: 'Excessive Retries (R > 3)',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.edges.forEach((edge, idx) => {
        if (edge.retries > 3) {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          findings.push({
            id: `L3-${edgeId}-${idx}`,
            ruleId: 'L3',
            severity: 'warning',
            title: 'Excessive Retries (R > 3)',
            target: `${edge.from} → ${edge.to}`,
            targetType: 'edge',
            reason: `Edge '${edge.from} → ${edge.to}' configures ${edge.retries} retries. Each failed request generates ${1 + edge.retries}× load amplification downstream.`,
            fix: 'Cap retries to 2 or 3 and rely on circuit breaker fallback',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetEdge = updated.edges.find(
                (e) => (e.id || `${e.from}->${e.to}`) === edgeId
              );
              if (targetEdge) {
                targetEdge.retries = 2;
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L4: Retry-depth amplification
  {
    id: 'L4',
    title: 'Retry-Depth Amplification (> 8x)',
    severity: 'critical',
    evaluate: (spec) => {
      const paths = findRetryAmplificationPaths(spec, 8);
      return paths.map((p, idx) => ({
        id: `L4-path-${idx}`,
        ruleId: 'L4',
        severity: 'critical',
        title: 'Dangerous Retry Depth Amplification',
        target: p.path.join(' → '),
        targetType: 'path',
        reason: `Synchronous call chain ${p.path.join(' → ')} multiplies failed attempts by ${p.amplification.toFixed(1)}× downstream, guaranteeing cascading collapse.`,
        fix: 'Reduce retries along intermediate steps and add circuit breakers',
        autoFix: (orig) => {
          const updated = cloneSpec(orig);
          for (let i = 0; i < p.path.length - 1; i++) {
            const from = p.path[i];
            const to = p.path[i + 1];
            const edge = updated.edges.find((e) => e.from === from && e.to === to);
            if (edge && edge.retries > 1) {
              edge.retries = 1;
            }
          }
          return updated;
        },
      }));
    },
  },

  // L5: Missing timeout on a sync call
  {
    id: 'L5',
    title: 'Missing Timeout on Sync Call',
    severity: 'critical',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.edges.forEach((edge, idx) => {
        if (edge.mode === 'sync' && (!edge.timeout_ms || edge.timeout_ms <= 0)) {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          findings.push({
            id: `L5-${edgeId}-${idx}`,
            ruleId: 'L5',
            severity: 'critical',
            title: 'Missing Sync Timeout',
            target: `${edge.from} → ${edge.to}`,
            targetType: 'edge',
            reason: `Synchronous dependency '${edge.from} → ${edge.to}' has no timeout set. A hanging downstream service will exhaust caller thread pool indefinitely.`,
            fix: 'Set an explicit timeout_ms (e.g. 1500ms)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetEdge = updated.edges.find(
                (e) => (e.id || `${e.from}->${e.to}`) === edgeId
              );
              if (targetEdge) {
                targetEdge.timeout_ms = 1500;
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L6: Timeout inversion
  {
    id: 'L6',
    title: 'Timeout Inversion',
    severity: 'critical',
    evaluate: (spec) => {
      const inversions = findTimeoutInversions(spec);
      return inversions.map((inv, idx) => ({
        id: `L6-inversion-${idx}`,
        ruleId: 'L6',
        severity: 'critical',
        title: 'Timeout Inversion (Orphaned Work)',
        target: `${inv.caller} → ${inv.callee}`,
        targetType: 'edge',
        reason: inv.reason,
        fix: `Increase caller '${inv.caller}' timeout to at least ${Math.round(inv.calleeRequiredTime + 300)}ms or reduce downstream timeouts`,
        autoFix: (orig) => {
          const updated = cloneSpec(orig);
          const targetEdge = updated.edges.find(
            (e) => e.from === inv.caller && e.to === inv.callee && e.mode === 'sync'
          );
          if (targetEdge) {
            targetEdge.timeout_ms = Math.round(inv.calleeRequiredTime + 500);
          }
          return updated;
        },
      }));
    },
  },

  // L7: No circuit breaker on a critical sync dependency
  {
    id: 'L7',
    title: 'Missing Circuit Breaker on Critical Path',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.edges.forEach((edge, idx) => {
        if (edge.mode === 'sync' && edge.critical && !edge.circuit_breaker?.enabled) {
          const edgeId = edge.id || `${edge.from}->${edge.to}`;
          findings.push({
            id: `L7-${edgeId}-${idx}`,
            ruleId: 'L7',
            severity: 'warning',
            title: 'Missing Circuit Breaker',
            target: `${edge.from} → ${edge.to}`,
            targetType: 'edge',
            reason: `Critical synchronous dependency '${edge.from} → ${edge.to}' has no circuit breaker. When callee brownouts, caller workers lock up instead of fast-failing.`,
            fix: 'Enable circuit breaker with fast-fail threshold (threshold: 0.5, open_duration_s: 15)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetEdge = updated.edges.find(
                (e) => (e.id || `${e.from}->${e.to}`) === edgeId
              );
              if (targetEdge) {
                targetEdge.circuit_breaker = {
                  enabled: true,
                  failure_rate_threshold: 0.5,
                  min_calls: 10,
                  open_duration_s: 15,
                  probe_fraction: 0.1,
                };
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L8: Single Point of Failure (SPOF)
  {
    id: 'L8',
    title: 'Single Point of Failure (SPOF)',
    severity: 'critical',
    evaluate: (spec) => {
      const articulationPoints = findArticulationPoints(spec);
      const findings: LintFinding[] = [];

      // Check if service is on a critical path
      const criticalCallees = new Set<string>();
      spec.edges.forEach((e) => {
        if (e.critical && e.mode === 'sync') {
          criticalCallees.add(e.to);
        }
      });

      spec.services.forEach((service) => {
        const isSingleInstance = service.instances.initial <= 1 || service.instances.min <= 1;
        const isCriticalDependency = criticalCallees.has(service.id) || service.entry || articulationPoints.includes(service.id);

        if (isSingleInstance && isCriticalDependency) {
          findings.push({
            id: `L8-spof-${service.id}`,
            ruleId: 'L8',
            severity: 'critical',
            title: 'Single Point of Failure (SPOF)',
            target: service.name || service.id,
            targetType: 'service',
            reason: `Service '${service.name || service.id}' has only ${service.instances.initial} instance and lies on a critical synchronous execution path. Its failure will completely halt customer transactions.`,
            fix: 'Increase minimum instances to >= 2 with multi-zone spread [a, b]',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.instances.initial = Math.max(2, targetSvc.instances.initial);
                targetSvc.instances.min = Math.max(2, targetSvc.instances.min);
                targetSvc.instances.max = Math.max(4, targetSvc.instances.max);
                targetSvc.zone_spread = ['a', 'b'];
              }
              return updated;
            },
          });
        }
      });

      return findings;
    },
  },

  // L9: Shared dependency with high fan-in and no bulkhead
  {
    id: 'L9',
    title: 'Shared Dependency Without Bulkhead',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      const callersMap = new Map<string, string[]>();

      spec.edges.forEach((edge) => {
        if (!callersMap.has(edge.to)) callersMap.set(edge.to, []);
        callersMap.get(edge.to)!.push(edge.from);
      });

      spec.services.forEach((service) => {
        const callers = callersMap.get(service.id) || [];
        if (callers.length >= 3) {
          const unbulkheadedEdges = spec.edges.filter(
            (e) => e.to === service.id && !e.bulkhead_max_concurrent
          );
          if (unbulkheadedEdges.length > 0) {
            findings.push({
              id: `L9-bulkhead-${service.id}`,
              ruleId: 'L9',
              severity: 'warning',
              title: 'Shared Dependency Without Bulkhead',
              target: service.name || service.id,
              targetType: 'service',
              reason: `Service '${service.name || service.id}' is shared across ${callers.length} upstream callers with no concurrency bulkhead. A burst from one caller can exhaust workers for all others.`,
              fix: 'Configure bulkhead_max_concurrent on callers to isolate concurrency pools',
              autoFix: (orig) => {
                const updated = cloneSpec(orig);
                updated.edges.forEach((e) => {
                  if (e.to === service.id) {
                    e.bulkhead_max_concurrent = 25;
                  }
                });
                return updated;
              },
            });
          }
        }
      });

      return findings;
    },
  },

  // L10: No load shedding on entry or high fan-in service
  {
    id: 'L10',
    title: 'Missing Gateway Load Shedding',
    severity: 'critical',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.services.forEach((service) => {
        if (service.entry && !service.load_shedding?.enabled) {
          findings.push({
            id: `L10-shed-${service.id}`,
            ruleId: 'L10',
            severity: 'critical',
            title: 'Missing Load Shedding on Entry Gateway',
            target: service.name || service.id,
            targetType: 'service',
            reason: `API Gateway '${service.name || service.id}' has load shedding disabled. Sudden surges will overflow queues, multiply latency, and exhaust memory.`,
            fix: 'Enable load shedding at 80% queue saturation (threshold: 0.8)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.load_shedding = { enabled: true, threshold: 0.8 };
              }
              return updated;
            },
          });
        }
      });
      return findings;
    },
  },

  // L11: Autoscaling too slow relative to workload ramp
  {
    id: 'L11',
    title: 'Slow Autoscaler Spin-Up Lag',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      const rampTime = spec.workload.ramp_time_s || 30;

      spec.services.forEach((service) => {
        if (service.autoscale?.enabled && service.autoscale.startup_delay_s > rampTime && spec.workload.pattern === 'spike') {
          findings.push({
            id: `L11-autoscale-${service.id}`,
            ruleId: 'L11',
            severity: 'warning',
            title: 'Autoscaler Spin-Up Lag Vulnerability',
            target: service.name || service.id,
            targetType: 'service',
            reason: `Service '${service.name || service.id}' has a ${service.autoscale.startup_delay_s}s pod startup delay, but workload ramps in ${rampTime}s. Flash surges will collapse the system before new instances become ready.`,
            fix: `Increase baseline minimum replicas from ${service.instances.min} to ${Math.max(service.instances.min + 2, 4)}`,
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.instances.min = Math.max(targetSvc.instances.min + 2, 4);
                targetSvc.instances.initial = Math.max(targetSvc.instances.initial, targetSvc.instances.min);
              }
              return updated;
            },
          });
        }
      });

      return findings;
    },
  },

  // L12: Cache stampede risk
  {
    id: 'L12',
    title: 'Cache Stampede Risk',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      const cacheEdges = spec.edges.filter(
        (e) => e.cache && e.cache.hit_ratio && e.cache.hit_ratio >= 0.85
      );

      cacheEdges.forEach((edge) => {
        const targetSvc = spec.services.find((s) => s.id === edge.to);
        if (targetSvc) {
          const maxCapacityRps = (targetSvc.instances.max * targetSvc.concurrency) / (targetSvc.service_time_ms / 1000);
          const rawPeakArrival = (spec.workload.base_rps || 600) * (spec.workload.multiplier || 1.5) * edge.calls_per_request;

          if (rawPeakArrival > maxCapacityRps * 0.9) {
            findings.push({
              id: `L12-cache-${edge.from}-${edge.to}`,
              ruleId: 'L12',
              severity: 'warning',
              title: 'Cache Stampede Vulnerability',
              target: `${edge.from} → ${edge.to}`,
              targetType: 'edge',
              reason: `Target '${targetSvc.name || targetSvc.id}' relies on ${Math.round(edge.cache.hit_ratio * 100)}% cache hit ratio. In the event of a cache wipe or cold start, un-cached traffic (${Math.round(rawPeakArrival)} RPS) will instantly overrun max capacity (${Math.round(maxCapacityRps)} RPS).`,
              fix: 'Increase backing store max replicas or add cache warm-up protection',
              autoFix: (orig) => {
                const updated = cloneSpec(orig);
                const db = updated.services.find((s) => s.id === edge.to);
                if (db) {
                  db.instances.initial = Math.max(db.instances.initial + 1, 3);
                  db.instances.max = Math.max(db.instances.max + 2, 6);
                  db.concurrency = Math.max(db.concurrency, 100);
                }
                return updated;
              },
            });
          }
        }
      });

      return findings;
    },
  },

  // L13: Low capacity headroom
  {
    id: 'L13',
    title: 'Low Capacity Headroom (Util > 70%)',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      const baseRps = spec.workload.base_rps || 600;

      spec.services.forEach((service) => {
        const capacity = (service.instances.initial * service.concurrency) / (service.service_time_ms / 1000);
        const estArrival = service.entry ? baseRps : baseRps * 0.3;
        const estUtil = capacity > 0 ? estArrival / capacity : 1.0;

        if (estUtil > 0.85) {
          findings.push({
            id: `L13-headroom-${service.id}`,
            ruleId: 'L13',
            severity: 'warning',
            title: 'Low Baseline Capacity Headroom',
            target: service.name || service.id,
            targetType: 'service',
            reason: `Service '${service.name || service.id}' has high baseline utilization of ~${Math.round(estUtil * 100)}%, leaving insufficient headroom for traffic spikes before queuing delay explodes.`,
            fix: `Add +1 replica (from ${service.instances.initial} to ${service.instances.initial + 1})`,
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.instances.initial += 1;
                targetSvc.instances.max += 1;
              }
              return updated;
            },
          });
        }
      });

      return findings;
    },
  },

  // L14: Cyclic sync dependency
  {
    id: 'L14',
    title: 'Cyclic Synchronous Dependency',
    severity: 'critical',
    evaluate: (spec) => {
      const cycles = detectSyncCycles(spec);
      return cycles.map((cycle, idx) => ({
        id: `L14-cycle-${idx}`,
        ruleId: 'L14',
        severity: 'critical',
        title: 'Cyclic Sync Dependency Deadlock',
        target: cycle.join(' → '),
        targetType: 'path',
        reason: `Circular sync call loop detected: ${cycle.join(' → ')}. This introduces distributed lock deadlocks and mutual worker starvation.`,
        fix: 'Break sync cycle by making one link asynchronous or event-driven',
        autoFix: (orig) => {
          const updated = cloneSpec(orig);
          const from = cycle[cycle.length - 2];
          const to = cycle[cycle.length - 1];
          const edge = updated.edges.find((e) => e.from === from && e.to === to);
          if (edge) {
            edge.mode = 'async';
            edge.critical = false;
          }
          return updated;
        },
      }));
    },
  },

  // L15: Async queue without limit
  {
    id: 'L15',
    title: 'Unbounded Async Queue Risk',
    severity: 'info',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      const asyncTargets = new Set(
        spec.edges.filter((e) => e.mode === 'async').map((e) => e.to)
      );

      spec.services.forEach((service) => {
        if (asyncTargets.has(service.id) && service.queue_limit > 800) {
          findings.push({
            id: `L15-queue-${service.id}`,
            ruleId: 'L15',
            severity: 'info',
            title: 'Unbounded Async Queue Limit',
            target: service.name || service.id,
            targetType: 'service',
            reason: `Async worker '${service.name || service.id}' has large queue limit (${service.queue_limit}), hiding consumer stall until OOM crash.`,
            fix: 'Set bounded queue limit with dead-letter queue (e.g. 250)',
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.queue_limit = 250;
              }
              return updated;
            },
          });
        }
      });

      return findings;
    },
  },

  // L16: No zone redundancy for critical services
  {
    id: 'L16',
    title: 'Missing Zone Redundancy',
    severity: 'warning',
    evaluate: (spec) => {
      const findings: LintFinding[] = [];
      spec.services.forEach((service) => {
        if (service.zone_spread.length < 2) {
          findings.push({
            id: `L16-zone-${service.id}`,
            ruleId: 'L16',
            severity: 'warning',
            title: 'Missing Multi-Zone Redundancy',
            target: service.name || service.id,
            targetType: 'service',
            reason: `Service '${service.name || service.id}' is hosted only in zone [${service.zone_spread.join(', ')}]. A single AZ outage will cause a complete service failure.`,
            fix: "Distribute instances across multiple availability zones: ['a', 'b']",
            autoFix: (orig) => {
              const updated = cloneSpec(orig);
              const targetSvc = updated.services.find((s) => s.id === service.id);
              if (targetSvc) {
                targetSvc.zone_spread = ['a', 'b'];
              }
              return updated;
            },
          });
        }
      });

      return findings;
    },
  },
];
