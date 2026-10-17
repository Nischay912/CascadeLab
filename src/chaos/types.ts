export interface ChaosScenario {
  id: string;
  name: string;
  category: 'service' | 'system';
  faultType: string;
  targetServiceId?: string;
  description: string;
  weight: number;
}

export interface ChaosScenarioResult {
  scenario: ChaosScenario;
  score: number; // 0..100
  avgSuccessDuringIncident: number; // 0..1
  recoveryScore: number; // 0..1
  timeToRecoverS: number | null;
  blastFraction: number; // 0..1
  isMetastable: boolean;
  peakAmplification: number;
  moneyLostInr: number;
}

export interface ChaosMatrixCell {
  serviceId: string;
  faultType: 'kill_50' | 'kill_100' | 'latency_5x' | 'latency_20x' | 'error_30';
  score: number; // 0..100
  isSPOF: boolean;
  isMetastable: boolean;
  timeToRecoverS: number | null;
}

export interface FragileServiceSummary {
  serviceId: string;
  serviceName: string;
  avgScore: number;
  isSPOF: boolean;
  worstFault: string;
}

export interface ChaosSuiteReport {
  scenariosRun: number;
  compositeResilienceScore: number;
  weightedMeanScore: number;
  worstCaseScore: number;
  results: ChaosScenarioResult[];
  matrixCells: ChaosMatrixCell[];
  fragileServices: FragileServiceSummary[];
  durationMs: number;
  evaluatedAt: string;
}

export interface CapacitySweepPoint {
  offeredRps: number;
  goodputRps: number;
  successRate: number;
  p95Ms: number;
  bottleneckServiceId: string | null;
  bottleneckUtil: number;
}

export interface CapacityCliffReport {
  baseRps: number;
  kneeRps: number;
  maxGoodputRps: number;
  headroomRatio: number; // kneeRps / baseRps
  primaryBottleneckId: string;
  points: CapacitySweepPoint[];
}
