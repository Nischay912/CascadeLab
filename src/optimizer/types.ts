import { ArchitectureSpec } from '../schema/architecture';

export interface CandidateAction {
  id: string;
  title: string;
  category:
    | 'circuit_breaker'
    | 'retry_backoff'
    | 'timeout'
    | 'replica_scale'
    | 'load_shedding'
    | 'cache'
    | 'bulkhead';
  targetType: 'service' | 'edge';
  targetId: string;
  description: string;
  costDeltaInr: number;
  apply: (spec: ArchitectureSpec) => ArchitectureSpec;
}

export interface AppliedChange {
  id: string;
  title: string;
  costDelta: number;
  reason: string;
}

export interface ParetoSolution {
  id: string;
  spec: ArchitectureSpec;
  resilienceScore: number; // 0..100
  monthlyCostInr: number; // ₹/month
  appliedCandidateIds: string[];
  changes: AppliedChange[];
  isParetoOptimal: boolean;
  rank?: number;
  crowdingDistance?: number;
}

export interface OptimizerReport {
  baselineSpec: ArchitectureSpec;
  baselineScore: number;
  baselineCostInr: number;
  greedySolution: ParetoSolution;
  paretoFront: ParetoSolution[];
  allSolutions: ParetoSolution[];
  evaluationsCount: number;
  durationMs: number;
}
