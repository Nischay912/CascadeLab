import { ArchitectureSpec } from '../schema/architecture';

export type DefconLevel = 'DEFCON_5' | 'DEFCON_4' | 'DEFCON_3' | 'DEFCON_2' | 'DEFCON_1';

export type CommanderMode = 'advisory' | 'autonomous';

export interface TacticalLogEntry {
  id: string;
  time: number;
  timestamp: string; // e.g. "T+00:42"
  level: 'info' | 'warning' | 'critical' | 'action' | 'recovery';
  title: string;
  message: string;
  serviceId?: string;
}

export interface CommanderMitigation {
  id: string;
  title: string;
  description: string;
  targetType: 'service' | 'edge' | 'global';
  targetId: string;
  mechanism: 'circuit_breaker' | 'retry_backoff' | 'autoscale_burst' | 'load_shedding' | 'bulkhead';
  estimatedRecoveryPct: number;
  explanation: string;
  apply: (spec: ArchitectureSpec) => ArchitectureSpec;
}

export interface CommanderEvaluationResult {
  threatLevel: DefconLevel;
  threatTitle: string;
  threatDescription: string;
  rootCauseService: string | null;
  failurePattern: string;
  blastRadiusPct: number;
  prescribedMitigation: CommanderMitigation | null;
  newLogs: TacticalLogEntry[];
}
