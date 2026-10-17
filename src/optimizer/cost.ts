import { ArchitectureSpec } from '../schema/architecture';

/**
 * Calculates total infrastructure cost in INR (₹/month) for an architecture specification:
 * Cost = Σ (instances.initial × cost_per_instance) + cache infrastructure + queue broker costs.
 */
export function calculateArchitectureCost(spec: ArchitectureSpec): number {
  let totalInr = 0;

  // 1. Compute compute instance costs
  for (const svc of spec.services) {
    const costPerInstance = svc.cost_inr_per_instance_month ?? 2000;
    const instanceCount = Math.max(1, svc.instances.initial);
    totalInr += instanceCount * costPerInstance;

    // High queue limit buffer broker cost (>500 queue slots)
    if (svc.queue_limit > 500) {
      totalInr += 500;
    }
  }

  // 2. Compute caching layer allocation costs
  for (const edge of spec.edges) {
    if (edge.cache && edge.cache.hit_ratio > 0.05) {
      totalInr += 1500;
    }
  }

  return Math.round(totalInr);
}

/**
 * Calculates the monthly cost delta between two architectures (after - before).
 */
export function calculateCostDelta(
  beforeSpec: ArchitectureSpec,
  afterSpec: ArchitectureSpec
): number {
  return calculateArchitectureCost(afterSpec) - calculateArchitectureCost(beforeSpec);
}
