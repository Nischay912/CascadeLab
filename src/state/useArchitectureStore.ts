import { create } from 'zustand';
import {
  ArchitectureSpec,
  ServiceSpec,
  EdgeSpec,
  FaultSpec,
} from '../schema/architecture';
import { TEMPLATES_CATALOG, shopFastNaiveTemplate } from '../schema/templates';
import { computeGraphLayout, LayoutResult } from '../viz/layout';
import { decodeArchitectureFromHash, syncHashToUrl } from './urlState';
import { importFromDockerCompose, parseArchitectureYamlOrJson } from '../schema/importers';

interface ArchitectureState {
  currentSpec: ArchitectureSpec;
  activeTemplateKey: string;
  layout: LayoutResult;
  selectedElementId: string | null;
  selectedElementType: 'service' | 'edge' | null;

  // Actions
  loadTemplate: (templateKey: string) => void;
  setSpec: (spec: ArchitectureSpec) => void;
  importDockerCompose: (yamlStr: string) => void;
  importYamlOrJson: (text: string) => void;
  selectElement: (type: 'service' | 'edge' | null, id: string | null) => void;
  updateService: (serviceId: string, updates: Partial<ServiceSpec>) => void;
  updateEdge: (edgeId: string, updates: Partial<EdgeSpec>) => void;
  addFault: (fault: FaultSpec) => void;
  removeFault: (faultId: string) => void;
  setWorkloadPattern: (pattern: any) => void;
}

// Check if a scenario is encoded in URL hash
const initialSpecFromUrl = typeof window !== 'undefined'
  ? decodeArchitectureFromHash(window.location.hash)
  : null;

const initialSpec = initialSpecFromUrl || shopFastNaiveTemplate;
const initialLayout = computeGraphLayout(initialSpec);

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  currentSpec: initialSpec,
  activeTemplateKey: initialSpecFromUrl ? 'custom' : 'shopfast',
  layout: initialLayout,
  selectedElementId: null,
  selectedElementType: null,

  loadTemplate: (templateKey: string) => {
    const template = TEMPLATES_CATALOG[templateKey];
    if (template) {
      const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(template));
      const layout = computeGraphLayout(cloned);
      syncHashToUrl(cloned);
      set({
        currentSpec: cloned,
        activeTemplateKey: templateKey,
        layout,
        selectedElementId: null,
        selectedElementType: null,
      });
    }
  },

  setSpec: (spec: ArchitectureSpec) => {
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);
    set({
      currentSpec: spec,
      activeTemplateKey: 'custom',
      layout,
    });
  },

  importDockerCompose: (yamlStr: string) => {
    const spec = importFromDockerCompose(yamlStr);
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);
    set({
      currentSpec: spec,
      activeTemplateKey: 'docker-compose',
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },

  importYamlOrJson: (text: string) => {
    const spec = parseArchitectureYamlOrJson(text);
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);
    set({
      currentSpec: spec,
      activeTemplateKey: 'imported',
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },

  selectElement: (type, id) => {
    set({
      selectedElementType: type,
      selectedElementId: id,
    });
  },

  updateService: (serviceId, updates) => {
    const { currentSpec } = get();
    const updatedServices = currentSpec.services.map((svc) =>
      svc.id === serviceId ? { ...svc, ...updates } : svc
    );
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      services: updatedServices,
    };
    const layout = computeGraphLayout(updatedSpec);
    syncHashToUrl(updatedSpec);
    set({ currentSpec: updatedSpec, layout });
  },

  updateEdge: (edgeId, updates) => {
    const { currentSpec } = get();
    const updatedEdges = currentSpec.edges.map((edge) =>
      edge.id === edgeId || `${edge.from}->${edge.to}` === edgeId
        ? { ...edge, ...updates }
        : edge
    );
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      edges: updatedEdges,
    };
    const layout = computeGraphLayout(updatedSpec);
    syncHashToUrl(updatedSpec);
    set({ currentSpec: updatedSpec, layout });
  },

  addFault: (fault) => {
    const { currentSpec } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      faults: [...currentSpec.faults, fault],
    };
    syncHashToUrl(updatedSpec);
    set({ currentSpec: updatedSpec });
  },

  removeFault: (faultId) => {
    const { currentSpec } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      faults: currentSpec.faults.filter((f) => f.id !== faultId),
    };
    syncHashToUrl(updatedSpec);
    set({ currentSpec: updatedSpec });
  },

  setWorkloadPattern: (pattern) => {
    const { currentSpec } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      workload: {
        ...currentSpec.workload,
        pattern,
        multiplier: pattern === 'constant' ? 1.0 : pattern === 'flash_sale' ? 3.0 : currentSpec.workload.multiplier,
      },
    };
    syncHashToUrl(updatedSpec);
    set({ currentSpec: updatedSpec });
  },
}));
