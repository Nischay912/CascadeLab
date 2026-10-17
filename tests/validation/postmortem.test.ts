import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate } from '../../src/schema/templates';
import { SimulationEngine } from '../../src/sim/engine';
import { generatePostmortem } from '../../src/postmortem/generator';
import { exportPostmortemToMarkdown } from '../../src/postmortem/markdown';

describe('Phase 9: Postmortem Generator (Markdown & SRE Report)', () => {
  it('generates an SRE postmortem from simulation telemetry', () => {
    // Run an incident simulation with payment provider latency
    const spec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    spec.faults = [
      {
        type: 'latency',
        target: 'payment-provider',
        factor: 5,
        start_s: 20,
        end_s: 60,
      },
    ];

    const engine = new SimulationEngine(spec, 42);
    const ticks = engine.runBatch(90);

    const postmortem = generatePostmortem(spec, ticks, 'Test Incident: Provider Latency Hang');

    expect(postmortem).toBeDefined();
    expect(postmortem.id).toMatch(/^INC-\d+/);
    expect(postmortem.title).toBe('Test Incident: Provider Latency Hang');
    expect(['P1 - Critical Outage', 'P2 - Major Degradation', 'P3 - Moderate Incident']).toContain(
      postmortem.severity
    );

    // Verify Impact metrics
    expect(postmortem.impact.durationSeconds).toBeGreaterThan(0);
    expect(postmortem.impact.financialLossInr).toBeGreaterThanOrEqual(0);
    expect(postmortem.impact.blastRadiusPercentage).toBeGreaterThan(0);

    // Verify Timeline events
    expect(postmortem.timeline.length).toBeGreaterThanOrEqual(2);
    const hasFaultEvent = postmortem.timeline.some((e) => e.category === 'fault');
    expect(hasFaultEvent).toBe(true);

    // Verify Root Cause
    expect(postmortem.rootCause.originServiceId).toBeDefined();
    expect(postmortem.rootCause.explanation).toBeDefined();
    expect(postmortem.rootCause.evidence.length).toBeGreaterThan(0);

    // Verify Action Items
    expect(postmortem.actionItems.length).toBeGreaterThan(0);
    const p0Items = postmortem.actionItems.filter((a) => a.priority === 'P0');
    expect(p0Items.length).toBeGreaterThan(0);
    expect(p0Items[0].owner).toBeDefined();
  });

  it('exports structured postmortem to standard GitHub Flavored Markdown', () => {
    const spec = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
    spec.faults = [
      {
        type: 'kill_instances',
        target: 'orders-db',
        percentage: 100,
        start_s: 15,
        end_s: 45,
      },
    ];

    const engine = new SimulationEngine(spec, 42);
    const ticks = engine.runBatch(60);

    const postmortem = generatePostmortem(spec, ticks);
    const markdown = exportPostmortemToMarkdown(postmortem);

    expect(markdown).toContain('# Incident Postmortem:');
    expect(markdown).toContain('## 1. Executive Summary');
    expect(markdown).toContain('## 2. Customer & Financial Impact');
    expect(markdown).toContain('## 3. Incident Timeline');
    expect(markdown).toContain('## 4. Root Cause Analysis');
    expect(markdown).toContain('## 7. Action Items & Auto-Hardening Recommendations');
    expect(markdown).toContain('| ID | Priority | Remediation Action |');
  });

  it('handles empty simulation history gracefully', () => {
    const postmortem = generatePostmortem(shopFastNaiveTemplate, []);

    expect(postmortem).toBeDefined();
    expect(postmortem.severity).toBeDefined();
    expect(postmortem.timeline.length).toBeGreaterThan(0);
    expect(postmortem.actionItems.length).toBeGreaterThan(0);
  });
});
