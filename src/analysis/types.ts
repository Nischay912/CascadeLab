export type IncidentPattern =
  | 'retry_storm'
  | 'concurrency_exhaustion'
  | 'queue_buildup'
  | 'crash_loop'
  | 'cache_stampede'
  | 'spof_failure'
  | 'metastable_failure'
  | 'healthy';

export interface ServiceOnset {
  serviceId: string;
  time: number;
  metric: 'latency' | 'error' | 'utilization' | 'queue' | 'crash';
  value: number;
  baselineValue: number;
}

export interface PatternDetectionResult {
  pattern: IncidentPattern;
  detected: boolean;
  confidence: number; // 0..1
  evidence: string[];
  culpritServiceId?: string;
}

export interface BlastRadiusReport {
  totalServices: number;
  degradedServices: string[];
  degradedPercentage: number;
  peakAmplification: number;
  totalMoneyLostInr: number;
  timeToDetectS: number;
  timeToRecoverS: number | null; // null if unrecovered / metastable
  isMetastable: boolean;
}

export interface IncidentChronologyEvent {
  time: number;
  serviceId: string;
  eventType: 'onset' | 'queue_overflow' | 'breaker_trip' | 'crash' | 'recovery';
  description: string;
}

export interface RootCauseReport {
  origin: string;
  originTime: number | null;
  pattern: IncidentPattern;
  confidence: number;
  isMetastable: boolean;
  blastRadiusPct: number;
  evidence: string[];
  patterns: PatternDetectionResult[];
  blastRadius: BlastRadiusReport;
  chronology: IncidentChronologyEvent[];
}
