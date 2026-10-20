import { describe, it, expect } from 'vitest';
import {
  validateArchitecture,
  ArchitectureSpec,
} from '../../src/schema/architecture';
import {
  TEMPLATES_CATALOG,
  shopFastNaiveTemplate,
  shopFastHardenedTemplate,
} from '../../src/schema/templates';
import {
  encodeArchitectureToHash,
  decodeArchitectureFromHash,
} from '../../src/state/urlState';
import {
  importFromDockerCompose,
  parseArchitectureYamlOrJson,
  exportArchitectureToYaml,
} from '../../src/schema/importers';
import { computeGraphLayout } from '../../src/viz/layout';

describe('Phase 1: Architecture Schema, Templates & URL-Hash State', () => {
  describe('Zod Architecture Schema Validation', () => {
    it('validates that all 5 catalog templates conform strictly to ArchitectureSpecSchema', () => {
      Object.entries(TEMPLATES_CATALOG).forEach(([key, template]) => {
        const result = validateArchitecture(template);
        expect(result.success, `Template "${key}" should be valid`).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.services.length).toBeGreaterThan(0);
      });
    });

    it('rejects an invalid architecture with missing services', () => {
      const invalidSpec = {
        name: 'Invalid System',
        services: [], // empty services array should fail
        workload: { entry: 'gateway', pattern: 'constant', base_rps: 100 },
      };
      const result = validateArchitecture(invalidSpec);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('rejects an edge with negative timeout or invalid retry count', () => {
      const invalidSpec = {
        ...shopFastNaiveTemplate,
        edges: [
          {
            from: 'gateway',
            to: 'auth',
            timeout_ms: -50, // invalid negative timeout
            retries: 25, // exceeds max retries
          },
        ],
      };
      const result = validateArchitecture(invalidSpec);
      expect(result.success).toBe(false);
    });
  });

  describe('T17: URL-Hash State Roundtrip', () => {
    it('compresses an ArchitectureSpec into a compact URL-safe hash and restores it losslessly', () => {
      const original = shopFastNaiveTemplate;
      const hash = encodeArchitectureToHash(original);

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(10);

      const restored = decodeArchitectureFromHash(hash);
      expect(restored).not.toBeNull();
      expect(restored?.name).toBe(original.name);
      expect(restored?.services.length).toBe(original.services.length);
      expect(restored?.edges.length).toBe(original.edges.length);
      expect(restored?.workload.base_rps).toBe(original.workload.base_rps);
      expect(restored?.faults.length).toBe(original.faults.length);
      expect(restored?.seed).toBe(original.seed);
    });

    it('handles decoding corrupted or invalid URL hash gracefully by returning null', () => {
      const corruptHash = 'not-a-valid-lz-string-12345!@#$';
      const restored = decodeArchitectureFromHash(corruptHash);
      expect(restored).toBeNull();
    });
  });

  describe('T18: Docker Compose Importer', () => {
    const sampleCompose = `
version: '3.8'
services:
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - auth
      - api
  auth:
    image: auth-service:latest
    deploy:
      replicas: 3
    depends_on:
      - user-db
  api:
    image: node:18-alpine
    deploy:
      replicas: 4
    depends_on:
      - user-db
      - cache
  cache:
    image: redis:alpine
  user-db:
    image: postgres:15
    deploy:
      replicas: 1
`;

    it('converts docker-compose.yml into a validated ArchitectureSpec with correct nodes and edges', () => {
      const spec = importFromDockerCompose(sampleCompose);
      expect(spec.name).toBe('Imported from Docker Compose');
      expect(spec.services.length).toBe(5);

      // Check entry service identification
      const gateway = spec.services.find((s) => s.id === 'gateway');
      expect(gateway?.entry).toBe(true);

      // Check database SPOF replicas detection
      const db = spec.services.find((s) => s.id === 'user-db');
      expect(db?.instances.initial).toBe(1);

      // Check dependencies (gateway->auth, gateway->api, auth->user-db, api->user-db, api->cache)
      expect(spec.edges.length).toBe(5);
      const gatewayAuthEdge = spec.edges.find((e) => e.from === 'gateway' && e.to === 'auth');
      expect(gatewayAuthEdge).toBeDefined();
      expect(gatewayAuthEdge?.mode).toBe('sync');

      // Validates against Architecture schema
      const validation = validateArchitecture(spec);
      expect(validation.success).toBe(true);
    });

    it('throws meaningful error if docker-compose file is missing a services block', () => {
      const badCompose = `
version: '3.8'
networks:
  frontend:
`;
      expect(() => importFromDockerCompose(badCompose)).toThrowError(
        /must contain a "services" block/
      );
    });
  });

  describe('YAML / JSON Import & Export', () => {
    it('serializes ArchitectureSpec to YAML and parses it back without loss', () => {
      const yamlStr = exportArchitectureToYaml(shopFastHardenedTemplate);
      expect(yamlStr).toContain('name: ShopFast (Hardened Reference)');
      expect(yamlStr).toContain('gateway');

      const parsedSpec = parseArchitectureYamlOrJson(yamlStr);
      expect(parsedSpec.name).toBe(shopFastHardenedTemplate.name);
      expect(parsedSpec.services.length).toBe(shopFastHardenedTemplate.services.length);
      expect(parsedSpec.edges.length).toBe(shopFastHardenedTemplate.edges.length);
    });

    it('successfully parses and validates the enterprise YAML boilerplate and PayNex fintech architecture', () => {
      const fs = require('fs');
      const path = require('path');

      const boilerplateStr = fs.readFileSync(path.resolve(__dirname, '../../examples/cascadelab_boilerplate.yaml'), 'utf-8');
      const boilerplateSpec = parseArchitectureYamlOrJson(boilerplateStr);
      expect(boilerplateSpec.name).toBe('Enterprise Microservices Platform');
      expect(boilerplateSpec.services.length).toBe(5);
      expect(boilerplateSpec.edges.length).toBe(4);

      const fintechStr = fs.readFileSync(path.resolve(__dirname, '../../examples/paynex_fintech_switch.yaml'), 'utf-8');
      const fintechSpec = parseArchitectureYamlOrJson(fintechStr);
      expect(fintechSpec.name).toBe('PayNex Payment Switch');
      expect(fintechSpec.services.length).toBe(8);
      expect(fintechSpec.edges.length).toBe(7);

      // Verify custom positions are respected
      const layout = computeGraphLayout(fintechSpec);
      const gatewayNode = layout.nodes.find((n) => n.id === 'pay-gateway');
      expect(gatewayNode?.position.x).toBe(80);
      expect(gatewayNode?.position.y).toBe(190);
    });
  });

  describe('Graph Auto-Layout with Dagre', () => {
    it('computes valid (x, y) coordinates for all nodes in ShopFast with zero overlap', () => {
      const layout = computeGraphLayout(shopFastNaiveTemplate, {
        nodeWidth: 240,
        nodeHeight: 110,
        nodesep: 50,
        ranksep: 100,
      });

      expect(layout.nodes.length).toBe(13);
      expect(layout.edges.length).toBe(12);

      // Verify all nodes have finite numeric coordinates
      layout.nodes.forEach((node) => {
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
      });

      // Verify entry gateway is placed to the left of downstream DBs
      const gateway = layout.nodes.find((n) => n.id === 'gateway');
      const ordersDb = layout.nodes.find((n) => n.id === 'orders-db');
      expect(gateway).toBeDefined();
      expect(ordersDb).toBeDefined();
      expect(gateway!.position.x).toBeLessThan(ordersDb!.position.x);
    });
  });
});
