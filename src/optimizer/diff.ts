import { ArchitectureSpec } from '../schema/architecture';
import { AppliedChange } from './types';

/**
 * Computes human-readable semantic diffs between two architecture specs.
 */
export function generateArchitectureDiff(
  before: ArchitectureSpec,
  after: ArchitectureSpec
): AppliedChange[] {
  const changes: AppliedChange[] = [];

  // 1. Service-level diffs
  for (const afterSvc of after.services) {
    const beforeSvc = before.services.find((s) => s.id === afterSvc.id);
    if (!beforeSvc) continue;

    // Instance count scaling
    if (afterSvc.instances.initial !== beforeSvc.instances.initial) {
      const deltaInstances = afterSvc.instances.initial - beforeSvc.instances.initial;
      const unitCost = afterSvc.cost_inr_per_instance_month ?? 2000;
      const costDelta = deltaInstances * unitCost;

      changes.push({
        id: `scale-${afterSvc.id}`,
        title: `${afterSvc.name || afterSvc.id}: Replicas ${beforeSvc.instances.initial} → ${afterSvc.instances.initial}`,
        costDelta,
        reason: `Eliminates single point of failure (SPOF) and absorbs traffic bursts (+${deltaInstances} replica across multi-AZ).`,
      });
    }

    // Adaptive load shedding
    if (afterSvc.load_shedding?.enabled && !beforeSvc.load_shedding?.enabled) {
      changes.push({
        id: `shedding-${afterSvc.id}`,
        title: `${afterSvc.name || afterSvc.id}: Enabled Adaptive Load Shedding`,
        costDelta: 0,
        reason: `Drops excess requests when queue utilization reaches ${Math.round(
          (afterSvc.load_shedding.threshold || 0.8) * 100
        )}% to prevent cascading worker death.`,
      });
    }

    // Zone redundancy
    if (
      afterSvc.zone_spread.length > beforeSvc.zone_spread.length &&
      !beforeSvc.zone_spread.includes('b') &&
      afterSvc.zone_spread.includes('b')
    ) {
      changes.push({
        id: `zone-${afterSvc.id}`,
        title: `${afterSvc.name || afterSvc.id}: Multi-AZ Deployment [${afterSvc.zone_spread.join(', ')}]`,
        costDelta: 0,
        reason: `Spreads instances across availability zones to survive catastrophic datacenter outages.`,
      });
    }
  }

  // 2. Edge-level diffs
  for (const afterEdge of after.edges) {
    const edgeKey = afterEdge.id || `${afterEdge.from}->${afterEdge.to}`;
    const beforeEdge = before.edges.find((e) => (e.id || `${e.from}->${e.to}`) === edgeKey);
    if (!beforeEdge) continue;

    // Circuit Breaker enabled
    if (afterEdge.circuit_breaker?.enabled && !beforeEdge.circuit_breaker?.enabled) {
      changes.push({
        id: `cb-${edgeKey}`,
        title: `${afterEdge.from} → ${afterEdge.to}: Enabled Circuit Breaker`,
        costDelta: 0,
        reason: `Fast-fails downstream requests at ${Math.round(
          afterEdge.circuit_breaker.failure_rate_threshold * 100
        )}% failure rate, immediately freeing caller threads.`,
      });
    }

    // Retries capped or reduced
    if (afterEdge.retries < beforeEdge.retries) {
      changes.push({
        id: `retries-cap-${edgeKey}`,
        title: `${afterEdge.from} → ${afterEdge.to}: Retries Capped ${beforeEdge.retries} → ${afterEdge.retries}`,
        costDelta: 0,
        reason: `Suppresses exponential retry storm amplification across critical downstream dependency paths.`,
      });
    }

    // Exponential Backoff with Jitter
    if (
      afterEdge.backoff?.mode === 'exponential' &&
      (beforeEdge.backoff?.mode !== 'exponential' || !beforeEdge.backoff.jitter)
    ) {
      changes.push({
        id: `backoff-${edgeKey}`,
        title: `${afterEdge.from} → ${afterEdge.to}: Exponential Backoff with Full Jitter`,
        costDelta: 0,
        reason: `Desynchronizes retry stamps using Full Jitter to avoid synchronized thundering herd spikes.`,
      });
    }

    // Timeout alignment (inversion fix)
    if (afterEdge.timeout_ms > beforeEdge.timeout_ms + 100) {
      changes.push({
        id: `timeout-${edgeKey}`,
        title: `${afterEdge.from} → ${afterEdge.to}: Timeout Increased ${beforeEdge.timeout_ms}ms → ${afterEdge.timeout_ms}ms`,
        costDelta: 0,
        reason: `Fixes timeout inversion so caller does not abort before downstream callee can successfully finish.`,
      });
    }

    // Cache hit ratio improvement
    if (
      (afterEdge.cache?.hit_ratio || 0) > (beforeEdge.cache?.hit_ratio || 0) + 0.1
    ) {
      changes.push({
        id: `cache-${edgeKey}`,
        title: `${afterEdge.from} → ${afterEdge.to}: Cache Hit Ratio Increased to ${Math.round(
          (afterEdge.cache?.hit_ratio || 0) * 100
        )}%`,
        costDelta: 1500,
        reason: `Absorbs read volume to protect backing store against cache stampede and CPU saturation.`,
      });
    }
  }

  return changes;
}
