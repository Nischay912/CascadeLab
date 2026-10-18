import { ArchitectureSpec } from '../schema/architecture';

export interface RealityDataPoint {
  timeS: number;
  successRate: number; // 0 - 100 %
  p95Ms: number;
  throughputRps: number;
}

export interface RealityScenario {
  id: string;
  name: string;
  description: string;
  systemDescription: string;
  spec: ArchitectureSpec;
  durationS: number;
  measured: RealityDataPoint[];
}

export interface ComparisonPoint {
  timeS: number;
  measuredSuccess: number;
  predictedSuccess: number;
  measuredP95: number;
  predictedP95: number;
  measuredThroughput: number;
  predictedThroughput: number;
}

export interface RealityComparisonResult {
  scenarioId: string;
  scenarioName: string;
  timeSeries: ComparisonPoint[];
  successMape: number; // Mean Absolute Percentage Error (%)
  p95Mape: number; // Mean Absolute Percentage Error (%)
  throughputMape: number; // Mean Absolute Percentage Error (%)
  overallFidelityPct: number; // 100 - average error
  fidelityGrade: 'A+' | 'A' | 'B' | 'C';
  summaryObservation: string;
  divergenceFactors: string[];
}
