import { ArchitectureSpec } from '../schema/architecture';
import { SimulationTickMetrics } from '../sim/engine';
import { RootCauseReport, IncidentPattern } from './types';
import { detectServiceOnsets, identifyOriginService } from './rootCause';
import { detectIncidentPatterns } from './patterns';
import { calculateBlastRadius, buildIncidentChronology } from './blastRadius';

/**
 * Complete, automated, rule-based root cause and incident pattern diagnosis engine.
 * Takes the architecture specification and the simulation time-series history,
 * and outputs an explainable root cause report with evidence cards.
 */
export function analyzeSimulationIncident(
  spec: ArchitectureSpec,
  history: SimulationTickMetrics[]
): RootCauseReport {
  // 1. Detect service degradation onsets
  const onsets = detectServiceOnsets(spec, history);

  // 2. Identify the root cause origin service
  const originResult = identifyOriginService(spec, onsets);

  // 3. Detect all 7 distributed failure patterns
  const patterns = detectIncidentPatterns(spec, history, originResult.origin);

  // 4. Calculate blast radius and chronology
  const blastRadius = calculateBlastRadius(spec, history, onsets);
  const chronology = buildIncidentChronology(spec, history, onsets);

  // 5. Select primary pattern (highest confidence detected pattern)
  const detectedPatterns = patterns.filter((p) => p.detected);
  detectedPatterns.sort((a, b) => b.confidence - a.confidence);

  const primaryPatternResult = detectedPatterns[0];
  const primaryPattern: IncidentPattern = primaryPatternResult
    ? primaryPatternResult.pattern
    : onsets.size > 0
    ? 'concurrency_exhaustion'
    : 'healthy';

  const confidence = primaryPatternResult ? primaryPatternResult.confidence : 0.95;

  // 6. Aggregate rich, human-readable evidence
  const aggregatedEvidence: string[] = [];

  if (originResult.origin !== 'none') {
    aggregatedEvidence.push(originResult.explanation);
  }

  if (primaryPatternResult && primaryPatternResult.evidence.length > 0) {
    aggregatedEvidence.push(...primaryPatternResult.evidence);
  }

  if (blastRadius.degradedPercentage > 0) {
    aggregatedEvidence.push(
      `Cascade spread across ${blastRadius.degradedServices.length} of ${blastRadius.totalServices} services (${blastRadius.degradedPercentage}% blast radius).`
    );
  }

  if (blastRadius.totalMoneyLostInr > 0) {
    aggregatedEvidence.push(
      `Estimated financial loss: ₹${Math.round(blastRadius.totalMoneyLostInr).toLocaleString('en-IN')} from unserved requests.`
    );
  }

  if (blastRadius.isMetastable) {
    aggregatedEvidence.push(
      `Incident is Metastable: system remained in failure state even after original trigger was cleared.`
    );
  }

  return {
    origin: originResult.origin,
    originTime: originResult.originTime,
    pattern: primaryPattern,
    confidence,
    isMetastable: blastRadius.isMetastable,
    blastRadiusPct: blastRadius.degradedPercentage,
    evidence: aggregatedEvidence,
    patterns,
    blastRadius,
    chronology,
  };
}
