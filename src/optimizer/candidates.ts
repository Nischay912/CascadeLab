import { ArchitectureSpec } from '../schema/architecture';
import { runLinter } from '../lint/linter';
import { findArticulationPoints } from '../lint/graph';
import { calculateCostDelta } from './cost';
import { CandidateAction } from './types';

/**
 * Deep clones an architecture spec to prevent state mutation.
 */
function cloneSpec(spec: ArchitectureSpec): ArchitectureSpec {
  return JSON.parse(JSON.stringify(spec));
}

/**
 * Generates an array of orthogonal candidate hardening actions for the given spec.
 * Sourced from architectural linter findings and systematic resilience best practices.
 */
export function generateCandidateActions(spec: ArchitectureSpec): CandidateAction[] {
  const candidates: CandidateAction[] = [];
  const seenIds = new Set<string>();

  // 1. Ingest actionable fixes from the Architecture Linter
  const { findings } = runLinter(spec);
  for (const finding of findings) {
    if (finding.autoFix && !seenIds.has(finding.id)) {
      seenIds.add(finding.id);

      const transformed = finding.autoFix(spec);
      const costDeltaInr = calculateCostDelta(spec, transformed);

      candidates.push({
        id: finding.id,
        title: finding.title,
        category: finding.id.startsWith('L1') || finding.id.startsWith('L3')
          ? 'retry_backoff'
          : finding.id.startsWith('L7')
          ? 'circuit_breaker'
          : finding.id.startsWith('L8')
          ? 'replica_scale'
          : finding.id.startsWith('L10')
          ? 'load_shedding'
          : finding.id.startsWith('L12')
          ? 'cache'
          : 'timeout',
        targetType: finding.targetType as any,
        targetId: finding.target,
        description: finding.fix,
        costDeltaInr,
        apply: finding.autoFix,
      });
    }
  }

  // 2. Systematic Edge Hardening: Circuit Breakers for any unprotected critical sync dependencies
  for (const edge of spec.edges) {
    const edgeKey = edge.id || `${edge.from}->${edge.to}`;
    if (edge.critical && edge.mode === 'sync' && (!edge.circuit_breaker || !edge.circuit_breaker.enabled)) {
      const candidateId = `cb-protect-${edgeKey}`;
      if (!seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        const applyFn = (orig: ArchitectureSpec) => {
          const cloned = cloneSpec(orig);
          const target = cloned.edges.find((e) => (e.id || `${e.from}->${e.to}`) === edgeKey);
          if (target) {
            target.circuit_breaker = {
              enabled: true,
              failure_rate_threshold: 0.5,
              min_calls: 10,
              open_duration_s: 15,
              probe_fraction: 0.1,
            };
          }
          return cloned;
        };

        candidates.push({
          id: candidateId,
          title: `Enable Circuit Breaker on ${edge.from} → ${edge.to}`,
          category: 'circuit_breaker',
          targetType: 'edge',
          targetId: edgeKey,
          description: `Fast-fail caller when ${edge.to} brownouts to preserve thread pools.`,
          costDeltaInr: 0,
          apply: applyFn,
        });
      }
    }
  }

  // 3. Systematic Edge Hardening: Exponential Backoff & Jitter on retryable edges
  for (const edge of spec.edges) {
    const edgeKey = edge.id || `${edge.from}->${edge.to}`;
    if (edge.retries > 0 && (edge.backoff.mode === 'none' || !edge.backoff.jitter)) {
      const candidateId = `backoff-jitter-${edgeKey}`;
      if (!seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        const applyFn = (orig: ArchitectureSpec) => {
          const cloned = cloneSpec(orig);
          const target = cloned.edges.find((e) => (e.id || `${e.from}->${e.to}`) === edgeKey);
          if (target) {
            target.backoff = {
              mode: 'exponential',
              jitter: true,
              base_delay_ms: 50,
              max_delay_ms: 1000,
            };
          }
          return cloned;
        };

        candidates.push({
          id: candidateId,
          title: `Exponential Backoff + Jitter on ${edge.from} → ${edge.to}`,
          category: 'retry_backoff',
          targetType: 'edge',
          targetId: edgeKey,
          description: `Desynchronizes retry bursts to break resonant retry storms.`,
          costDeltaInr: 0,
          apply: applyFn,
        });
      }
    }
  }

  // 4. Systematic Service Hardening: Single Points of Failure (SPOF)
  const articulationPoints = new Set(findArticulationPoints(spec));
  for (const svc of spec.services) {
    const isSingleInstance = svc.instances.initial <= 1 || svc.instances.min <= 1;
    const isHighImpact = articulationPoints.has(svc.id) || svc.entry || svc.id.includes('db');

    if (isSingleInstance && isHighImpact) {
      const candidateId = `scale-spof-${svc.id}`;
      if (!seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        const applyFn = (orig: ArchitectureSpec) => {
          const cloned = cloneSpec(orig);
          const target = cloned.services.find((s) => s.id === svc.id);
          if (target) {
            target.instances.initial = Math.max(2, target.instances.initial + 1);
            target.instances.min = Math.max(2, target.instances.min + 1);
            target.instances.max = Math.max(4, target.instances.max);
            target.zone_spread = ['a', 'b'];
          }
          return cloned;
        };

        const costDelta = svc.cost_inr_per_instance_month ?? 2500;
        candidates.push({
          id: candidateId,
          title: `Eliminate SPOF: Scale ${svc.name || svc.id} to 2 Replicas (Multi-AZ)`,
          category: 'replica_scale',
          targetType: 'service',
          targetId: svc.id,
          description: `Add standby instance across AZs to survive node outages.`,
          costDeltaInr: costDelta,
          apply: applyFn,
        });
      }
    }
  }

  // 5. Systematic Service Hardening: Adaptive Load Shedding on Entry & High Fan-in Services
  for (const svc of spec.services) {
    if ((svc.entry || svc.id.includes('api') || svc.id.includes('gateway')) && !svc.load_shedding?.enabled) {
      const candidateId = `shedding-${svc.id}`;
      if (!seenIds.has(candidateId)) {
        seenIds.add(candidateId);
        const applyFn = (orig: ArchitectureSpec) => {
          const cloned = cloneSpec(orig);
          const target = cloned.services.find((s) => s.id === svc.id);
          if (target) {
            target.load_shedding = {
              enabled: true,
              threshold: 0.85,
            };
          }
          return cloned;
        };

        candidates.push({
          id: candidateId,
          title: `Enable Adaptive Load Shedding on ${svc.name || svc.id}`,
          category: 'load_shedding',
          targetType: 'service',
          targetId: svc.id,
          description: `Drop excess traffic at 85% worker queue saturation to prevent crash loops.`,
          costDeltaInr: 0,
          apply: applyFn,
        });
      }
    }
  }

  return candidates;
}
