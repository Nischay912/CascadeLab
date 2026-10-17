import { ArchitectureSpec } from '../schema/architecture';
import { LintFinding, lintRules } from './rules';

export interface LintReport {
  findings: LintFinding[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalCount: number;
  staticResilienceScore: number;
  evaluatedAt: string;
}

/**
 * Runs the static Architecture Linter against an ArchitectureSpec.
 * Evaluates rules L1 through L16 across the dependency graph.
 */
export function runLinter(spec: ArchitectureSpec): LintReport {
  const allFindings: LintFinding[] = [];

  lintRules.forEach((rule) => {
    try {
      const results = rule.evaluate(spec);
      allFindings.push(...results);
    } catch (err) {
      console.error(`Error evaluating rule ${rule.id}:`, err);
    }
  });

  const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
  const warningCount = allFindings.filter((f) => f.severity === 'warning').length;
  const infoCount = allFindings.filter((f) => f.severity === 'info').length;

  // Calculate static resilience penalty:
  // Starts at 100, deducts 8 per critical, 3 per warning, 1 per info
  const penalty = criticalCount * 8 + warningCount * 3 + infoCount * 1;
  const staticResilienceScore = Math.max(20, Math.min(100, 100 - penalty));

  return {
    findings: allFindings,
    criticalCount,
    warningCount,
    infoCount,
    totalCount: allFindings.length,
    staticResilienceScore,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Applies the automatic fix for a specified finding to an ArchitectureSpec.
 * Returns the modified ArchitectureSpec.
 */
export function applyLintFix(spec: ArchitectureSpec, findingId: string): ArchitectureSpec {
  const report = runLinter(spec);
  const targetFinding = report.findings.find((f) => f.id === findingId);

  if (targetFinding && targetFinding.autoFix) {
    return targetFinding.autoFix(spec);
  }

  return spec;
}
