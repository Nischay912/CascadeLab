import { describe, it, expect } from 'vitest';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../../src/schema/templates';
import { evaluateResilienceGate } from '../../scripts/ciResilienceGate';
import { generateSvgBadge } from '../../src/utils/badgeGenerator';

describe('Phase 12: CI/CD Resilience Gate & Dynamic Badge Generator', () => {
  it('passes CI resilience gate for hardened reference architecture', () => {
    const result = evaluateResilienceGate(shopFastHardenedTemplate, 50, true);

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.errorCount).toBe(0);
    expect(result.criticalViolations.length).toBe(0);
    expect(result.scenarioResults.length).toBe(6);
  });

  it('fails CI resilience gate for naive architecture containing anti-patterns', () => {
    const result = evaluateResilienceGate(shopFastNaiveTemplate, 70, true);

    expect(result.passed).toBe(false);
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.criticalViolations.length).toBeGreaterThan(0);
  });

  it('generates compliant SVG badges for GitHub README', () => {
    const svg = generateSvgBadge({
      label: 'resilience',
      value: '84 / 100',
      color: '#10B981',
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('resilience');
    expect(svg).toContain('84 / 100');
    expect(svg).toContain('#10B981');
  });
});
