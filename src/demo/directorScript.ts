import { DemoDirectorStep } from './types';

export const DEMO_DIRECTOR_STEPS: DemoDirectorStep[] = [
  {
    id: 1,
    title: '1. Architecture Tour & Vulnerability Scan',
    badge: 'Step 1 of 6 • Overview',
    narration:
      'Meet ShopFast: 13 microservices handling customer checkouts. The Architecture Linter evaluates 16 distributed systems rules, flagging an unprotected single-node DB (SPOF) and 3× retries without backoff (Resilience: 38/100). Offending edges and nodes are highlighted.',
    tab: 'graph',
    actionName: 'Run Architecture Linter Scan',
  },
  {
    id: 2,
    title: '2. Disaster Onset & Failure Wave Ripple',
    badge: 'Step 2 of 6 • The Cascade',
    narration:
      'We inject a 5× latency hang on the Payment Gateway during a 3× traffic surge. Watch the concentric Failure Wave ripple outward from the provider! Orange retry particles flood the canvas as callers retry hanging calls, amplifying internal traffic to 4.2× baseline.',
    tab: 'graph',
    actionName: 'Trigger Flash Crowd + Provider Hang',
  },
  {
    id: 3,
    title: '3. Metastable Failure Lockup',
    badge: 'Step 3 of 6 • Metastability',
    narration:
      'The fault ends at t=75s, but the system refuses to self-heal! Queues remain choked and thread pools are exhausted by lingering retries. CascadeLab flags: "METASTABLE FAILURE: Sustained outage after trigger ended. Root cause: retry amplification."',
    tab: 'graph',
    actionName: 'Inspect Root-Cause & Blast Radius',
  },
  {
    id: 4,
    title: '4. Auto-Harden & Pareto Frontier',
    badge: 'Step 4 of 6 • AI Optimizer',
    narration:
      'We trigger Auto-Harden. The NSGA-II Lite multi-objective genetic algorithm explores trade-offs in real time, building a Pareto Frontier. It isolates a zero-cost hardening policy (Circuit Breaker + Jittered Backoff + Load Shedding) jumping resilience from 38 to 87!',
    tab: 'optimizer',
    actionName: 'View Pareto Front Trade-off Curve',
  },
  {
    id: 5,
    title: '5. Split-Screen Deterministic Replay',
    badge: 'Step 5 of 6 • Synchronized Replay',
    narration:
      'We replay the exact same disaster side-by-side using deterministic seed 42. On the left, unhardened naive defaults collapse to 22% success. On the right, circuit breakers fast-fail and standby replicas absorb the surge, maintaining 99% uptime and saving ₹48,000+!',
    tab: 'split',
    actionName: 'Run Split-Screen Comparison Replay',
  },
  {
    id: 6,
    title: '6. Chaos Heatmap & SRE Postmortem',
    badge: 'Step 6 of 6 • Enterprise Ready',
    narration:
      'The automated Chaos Suite runs 70 permutations across all 13 services in under 350ms, rendering the full 2D Resilience Matrix Heatmap. With one click, an SRE postmortem is auto-generated with timeline, impact, and action items ready for PDF and Markdown export.',
    tab: 'chaos',
    actionName: 'Inspect Chaos Heatmap & SRE Report',
  },
];
