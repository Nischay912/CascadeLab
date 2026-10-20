import { describe, it, expect, beforeEach } from 'vitest';
import { useArchitectureStore } from '../../src/state/useArchitectureStore';
import { shopFastNaiveTemplate } from '../../src/schema/templates';

describe('Custom Architecture Persistence & Dropdown Lifecycle', () => {
  beforeEach(() => {
    // Reset store to baseline
    const store = useArchitectureStore.getState();
    store.loadTemplate('shopfast');
    // Clear any custom architectures
    const customList = store.customArchitectures;
    for (const arch of customList) {
      store.deleteCustomArchitecture(arch.id);
    }
  });

  it('imports a custom YAML architecture and assigns it an active custom ID', () => {
    const store = useArchitectureStore.getState();
    const yaml = `
name: "MedPulse Telehealth Test"
description: "Telehealth system test"
slo:
  success_pct: 99.9
  p95_ms: 300
value_per_request_inr: 50
workload:
  entry: "ingress-api"
  pattern: "constant"
  base_rps: 400
services:
  - id: "ingress-api"
    name: "Ingress API"
    entry: true
    instances: { initial: 2, min: 1, max: 4 }
    concurrency: 50
    service_time_ms: 10
    queue_limit: 100
  - id: "auth-svc"
    name: "Auth Svc"
    instances: { initial: 2, min: 1, max: 4 }
    concurrency: 50
    service_time_ms: 15
    queue_limit: 100
dependencies:
  - from: "ingress-api"
    to: "auth-svc"
    rate: 1.0
    timeout_ms: 200
`;

    store.importYamlOrJson(yaml);
    const updated = useArchitectureStore.getState();

    expect(updated.currentSpec.name).toBe('MedPulse Telehealth Test');
    expect(updated.currentSpec.services.length).toBe(2);
    expect(updated.activeTemplateKey.startsWith('custom_')).toBe(true);
    expect(updated.customArchitectures.length).toBeGreaterThan(0);
    expect(updated.customArchitectures.some((c) => c.name === 'MedPulse Telehealth Test')).toBe(true);
  });

  it('preserves the custom architecture in customArchitectures when switching to another template', () => {
    const store = useArchitectureStore.getState();
    const yaml = `
name: "Preserved Architecture"
services:
  - id: "web"
    name: "Web"
    entry: true
    instances: { initial: 2, min: 1, max: 4 }
    concurrency: 50
    service_time_ms: 10
    queue_limit: 100
workload:
  entry: "web"
  pattern: "constant"
  base_rps: 100
`;

    store.importYamlOrJson(yaml);
    const customKey = useArchitectureStore.getState().activeTemplateKey;

    // Switch to built-in 'payments' template
    useArchitectureStore.getState().loadTemplate('payments');
    const afterSwitch = useArchitectureStore.getState();

    expect(afterSwitch.activeTemplateKey).toBe('payments');
    expect(afterSwitch.currentSpec.name).toContain('Payment');
    // Ensure the custom architecture is STILL in customArchitectures!
    expect(afterSwitch.customArchitectures.some((c) => c.id === customKey)).toBe(true);

    // Switch back to custom architecture
    useArchitectureStore.getState().loadTemplate(customKey);
    const backToCustom = useArchitectureStore.getState();

    expect(backToCustom.activeTemplateKey).toBe(customKey);
    expect(backToCustom.currentSpec.name).toBe('Preserved Architecture');
  });

  it('deletes custom architecture cleanly and falls back to shopfast', () => {
    const store = useArchitectureStore.getState();
    const yaml = `
name: "Deletable Architecture"
services:
  - id: "web"
    name: "Web"
    entry: true
    instances: { initial: 1, min: 1, max: 2 }
    concurrency: 20
    service_time_ms: 10
    queue_limit: 50
workload:
  entry: "web"
  pattern: "constant"
  base_rps: 50
`;

    store.importYamlOrJson(yaml);
    const customKey = useArchitectureStore.getState().activeTemplateKey;

    // Delete custom architecture
    useArchitectureStore.getState().deleteCustomArchitecture(customKey);
    const afterDelete = useArchitectureStore.getState();

    expect(afterDelete.activeTemplateKey).toBe('shopfast');
    expect(afterDelete.currentSpec.name).toBe(shopFastNaiveTemplate.name);
    expect(afterDelete.customArchitectures.some((c) => c.id === customKey)).toBe(false);
  });
});
