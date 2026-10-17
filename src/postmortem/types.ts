export interface TimelineEvent {
  timestamp: string;
  relativeTimeS: number;
  event: string;
  category: 'fault' | 'breaker' | 'traffic' | 'crash' | 'recovery';
  severity: 'info' | 'warning' | 'critical';
}

export interface PostmortemActionItem {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  action: string;
  owner: string;
  costDeltaInr: number;
  rationale: string;
}

export interface PostmortemData {
  id: string;
  title: string;
  severity: 'P1 - Critical Outage' | 'P2 - Major Degradation' | 'P3 - Moderate Incident';
  status: 'Resolved' | 'Metastable Lockup' | 'Mitigated';
  date: string;
  leadInvestigator: string;
  architectureName: string;
  executiveSummary: string;
  impact: {
    durationSeconds: number;
    timeToDetectS: number;
    timeToMitigateS: number;
    timeToRecoverS: number | null;
    successRateDuringIncident: number;
    totalRequestsLost: number;
    financialLossInr: number;
    blastRadiusPercentage: number;
    degradedServices: string[];
  };
  timeline: TimelineEvent[];
  rootCause: {
    originServiceId: string;
    originServiceName: string;
    failurePattern: string;
    explanation: string;
    evidence: string[];
  };
  contributingFactors: string[];
  whatWentWell: string[];
  whatWentPoorly: string[];
  actionItems: PostmortemActionItem[];
}
