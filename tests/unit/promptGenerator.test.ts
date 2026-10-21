import { describe, it, expect } from 'vitest';
import {
  synthesizeArchitectureFromPrompt,
  detectDomainFromPrompt,
  validatePromptIntent,
  PROMPT_PRESETS,
} from '../../src/generator/promptArchitectureEngine';
import { ArchitectureSpecSchema } from '../../src/schema/architecture';
import { SimulationEngine } from '../../src/sim/engine';

describe('Prompt-to-Architecture Natural Language Topology Engine', () => {
  it('correctly classifies domain for the exact user prompt', () => {
    const prompt =
      'Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway.';
    const domain = detectDomainFromPrompt(prompt);
    expect(domain).toBe('ridehailing');
  });

  it('rejects conversational greetings and small talk with clear warnings', () => {
    const greetingPrompts = [
      'hi how are you',
      'hello',
      'hey there',
      'good morning',
      'who are you',
      'what is up',
    ];

    for (const prompt of greetingPrompts) {
      const validation = validatePromptIntent(prompt);
      expect(validation.isValid, `Should have rejected: ${prompt}`).toBe(false);
      expect(validation.reason).toContain('conversational greeting');
      expect(validation.suggestion).toBeDefined();

      expect(() => synthesizeArchitectureFromPrompt(prompt)).toThrowError(
        /conversational greeting/i
      );
    }
  });

  it('rejects generic code generation and algorithm requests', () => {
    const codePrompts = [
      'write python code for a snake game',
      'generate a javascript function for quicksort',
      'give me react code for a button',
    ];

    for (const prompt of codePrompts) {
      const validation = validatePromptIntent(prompt);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('source code');

      expect(() => synthesizeArchitectureFromPrompt(prompt)).toThrowError(/source code/i);
    }
  });

  it('rejects off-topic non-architectural queries', () => {
    const offTopicPrompts = [
      'what is the weather today',
      'recipe for chocolate cake',
      'who won the world cup',
    ];

    for (const prompt of offTopicPrompts) {
      const validation = validatePromptIntent(prompt);
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toContain('unrelated');

      expect(() => synthesizeArchitectureFromPrompt(prompt)).toThrowError(/unrelated/i);
    }
  });

  it('rejects single-word and underspecified prompts', () => {
    const shortPrompts = ['test', 'database', 'fast'];
    for (const prompt of shortPrompts) {
      const validation = validatePromptIntent(prompt);
      expect(validation.isValid).toBe(false);
      expect(() => synthesizeArchitectureFromPrompt(prompt)).toThrowError(/too brief/i);
    }
  });

  it('synthesizes a 100% valid ArchitectureSpec for the Uber ride-hailing prompt', () => {
    const prompt =
      'Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway.';
    const result = synthesizeArchitectureFromPrompt(prompt, {
      trafficScale: 'medium',
      mode: 'fragile_naive',
      includeSpof: true,
      includeFault: true,
    });

    // Verify against Zod schema
    const parsed = ArchitectureSpecSchema.safeParse(result.spec);
    expect(parsed.success).toBe(true);

    // Verify services
    expect(result.spec.services.length).toBeGreaterThanOrEqual(5);
    const serviceIds = result.spec.services.map((s) => s.id);
    expect(serviceIds).toContain('api-gateway');
    expect(serviceIds.some((id) => id.includes('payment'))).toBe(true);

    // Verify edges and DAG connectivity
    expect(result.spec.edges.length).toBeGreaterThanOrEqual(4);
    const ingressEdges = result.spec.edges.filter((e) => e.from === 'api-gateway');
    expect(ingressEdges.length).toBeGreaterThan(0);

    // Verify Little's Law queue calibration
    for (const service of result.spec.services) {
      expect(service.queue_limit).toBeGreaterThan(0);
      expect(service.instances.initial).toBeGreaterThan(0);
      expect(service.concurrency).toBeGreaterThan(0);
    }

    // Verify summary metadata
    expect(result.summary.domain).toBe('Mobility & Ride-Hailing');
    expect(result.summary.servicesCount).toBe(result.spec.services.length);
    expect(result.summary.edgesCount).toBe(result.spec.edges.length);
    expect(result.summary.tiers.length).toBeGreaterThan(0);
  });

  it('dynamically synthesizes custom non-preset architecture from freeform prompt', () => {
    const customPrompt =
      'Hospital patient portal with doctor appointment service, medical records database, pharmacy prescription queue, and insurance claims gateway';
    
    const result = synthesizeArchitectureFromPrompt(customPrompt, {
      trafficScale: 'medium',
      mode: 'fragile_naive',
      includeSpof: true,
    });

    const parsed = ArchitectureSpecSchema.safeParse(result.spec);
    expect(parsed.success).toBe(true);

    const serviceIds = result.spec.services.map((s) => s.id);
    // Dynamically extracted entities should exist
    expect(serviceIds.some((id) => id.includes('appointment'))).toBe(true);
    expect(serviceIds.some((id) => id.includes('records') || id.includes('db'))).toBe(true);
    expect(serviceIds.some((id) => id.includes('prescription') || id.includes('queue'))).toBe(true);
    expect(serviceIds.some((id) => id.includes('claims') || id.includes('gateway'))).toBe(true);

    // Verify runnable in SimulationEngine
    const engine = new SimulationEngine(result.spec, 42);
    const history = engine.runBatch(30);
    expect(history.length).toBe(31);
    expect(Number.isFinite(history[15].userSuccessRate)).toBe(true);
  });

  it('correctly executes structural commands like "where tier 2 has 3 services like single duo and squads"', () => {
    const pubgPrompt =
      'pubg mobile architecture where tier 2 has 3 services like single duo and squads';

    const result = synthesizeArchitectureFromPrompt(pubgPrompt, {
      trafficScale: 'medium',
      mode: 'fragile_naive',
      includeSpof: true,
    });

    // Verify against Zod schema
    const parsed = ArchitectureSpecSchema.safeParse(result.spec);
    expect(parsed.success).toBe(true);

    // Verify domain and title
    expect(result.summary.domain).toBe('Gaming & Multiplayer Grid');
    expect(result.summary.architectureName).toContain('PUBG Mobile');

    // Verify Tier 2 contains exactly the 3 requested services
    const tier2Services = result.summary.tiers.find((t) => t.tierName.includes('Tier 2'))?.services || [];
    expect(tier2Services.length).toBe(3);
    expect(tier2Services.some((s) => s.toLowerCase().includes('single'))).toBe(true);
    expect(tier2Services.some((s) => s.toLowerCase().includes('duo'))).toBe(true);
    expect(tier2Services.some((s) => s.toLowerCase().includes('squad'))).toBe(true);

    // Verify runnable in SimulationEngine
    const engine = new SimulationEngine(result.spec, 42);
    const history = engine.runBatch(30);
    expect(history.length).toBe(31);
    expect(Number.isFinite(history[10].userSuccessRate)).toBe(true);
  });

  it('runs successfully through SimulationEngine with zero NaN metrics', () => {
    const prompt =
      'Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway.';
    const { spec } = synthesizeArchitectureFromPrompt(prompt, {
      trafficScale: 'medium',
      mode: 'fragile_naive',
      includeSpof: true,
      includeFault: true,
    });

    const engine = new SimulationEngine(spec, 42);
    const history = engine.runBatch(60);

    expect(history.length).toBe(61); // 0 to 60s inclusive
    for (const tick of history) {
      expect(Number.isFinite(tick.userSuccessRate)).toBe(true);
      expect(Number.isFinite(tick.userP95Ms)).toBe(true);
      expect(Number.isFinite(tick.cumulativeMoneyLostInr)).toBe(true);
    }
  });

  it('synthesizes valid specs across all 8 preset domains', () => {
    for (const preset of PROMPT_PRESETS) {
      const result = synthesizeArchitectureFromPrompt(preset.prompt, {
        trafficScale: 'high',
        mode: 'fragile_naive',
        includeSpof: true,
      });

      const parsed = ArchitectureSpecSchema.safeParse(result.spec);
      expect(parsed.success, `Preset ${preset.id} failed schema validation`).toBe(true);
      expect(result.spec.services.length).toBeGreaterThanOrEqual(4);
      expect(result.spec.edges.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('supports pre-hardened synthesis mode with circuit breakers and jitter', () => {
    const prompt = 'Fintech UPI real-time payment switch with fraud engine and ledger';
    const naiveResult = synthesizeArchitectureFromPrompt(prompt, {
      mode: 'fragile_naive',
    });
    const hardenedResult = synthesizeArchitectureFromPrompt(prompt, {
      mode: 'hardened',
    });

    // In naive mode, critical core edges have no circuit breaker
    const naiveBreakers = naiveResult.spec.edges.filter((e) => e.circuit_breaker?.enabled);
    const hardenedBreakers = hardenedResult.spec.edges.filter((e) => e.circuit_breaker?.enabled);

    expect(hardenedBreakers.length).toBeGreaterThan(naiveBreakers.length);

    // Hardened edges must feature jittered exponential backoff
    for (const edge of hardenedResult.spec.edges) {
      expect(edge.backoff.jitter).toBe(true);
      expect(edge.backoff.mode).toBe('exponential');
    }
  });

  it('scales calibrated baseline traffic from low to peak', () => {
    const prompt = 'Video streaming edge service with transcoding and cdn';
    const low = synthesizeArchitectureFromPrompt(prompt, { trafficScale: 'low' });
    const peak = synthesizeArchitectureFromPrompt(prompt, { trafficScale: 'peak' });

    expect(low.spec.workload.base_rps).toBeLessThan(peak.spec.workload.base_rps);
    expect(low.spec.workload.base_rps).toBe(400);
    expect(peak.spec.workload.base_rps).toBe(2500);
  });
});
