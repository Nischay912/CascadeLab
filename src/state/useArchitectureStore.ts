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

export interface CustomArchitectureEntry {
  id: string;
  name: string;
  spec: ArchitectureSpec;
  source?: 'yaml' | 'docker-compose' | 'url';
  importedAt: number;
}

const CUSTOM_ARCH_STORAGE_KEY = 'cascadelab_custom_architectures';

function loadStoredCustomArchitectures(): CustomArchitectureEntry[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_ARCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.id && item.name && item.spec);
    }
  } catch {
    // Graceful fallback for non-storage environments
  }
  return [];
}

function persistCustomArchitectures(architectures: CustomArchitectureEntry[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_ARCH_STORAGE_KEY, JSON.stringify(architectures));
  } catch {
    // Graceful fallback
  }
}

function syncUpdatedSpecToCustomList(
  customArchitectures: CustomArchitectureEntry[],
  activeKey: string,
  updatedSpec: ArchitectureSpec
): CustomArchitectureEntry[] {
  const idx = customArchitectures.findIndex((c) => c.id === activeKey);
  if (idx < 0) return customArchitectures;
  const updatedList = [...customArchitectures];
  updatedList[idx] = {
    ...updatedList[idx],
    name: updatedSpec.name || updatedList[idx].name,
    spec: updatedSpec,
  };
  persistCustomArchitectures(updatedList);
  return updatedList;
}

interface ArchitectureState {
  currentSpec: ArchitectureSpec;
  activeTemplateKey: string;
  customArchitectures: CustomArchitectureEntry[];
  layout: LayoutResult;
  selectedElementId: string | null;
  selectedElementType: 'service' | 'edge' | null;

  // Actions
  loadTemplate: (templateKey: string) => void;
  deleteCustomArchitecture: (architectureId: string) => void;
  setSpec: (spec: ArchitectureSpec) => void;
  importDockerCompose: (yamlStr: string) => void;
  importYamlOrJson: (text: string) => void;
  deploySynthesizedArchitecture: (spec: ArchitectureSpec) => void;
  selectElement: (type: 'service' | 'edge' | null, id: string | null) => void;
  updateService: (serviceId: string, updates: Partial<ServiceSpec>) => void;
  removeService: (serviceId: string) => void;
  updateEdge: (edgeId: string, updates: Partial<EdgeSpec>) => void;
  removeEdge: (edgeId: string) => void;
  addFault: (fault: FaultSpec) => void;
  removeFault: (faultId: string) => void;
  setWorkloadPattern: (pattern: any) => void;
}

// Check if a scenario is encoded in URL hash or stored in localStorage
const storedCustomArchitectures = loadStoredCustomArchitectures();
const initialSpecFromUrl = typeof window !== 'undefined'
  ? decodeArchitectureFromHash(window.location.hash)
  : null;

let initialSpec: ArchitectureSpec = shopFastNaiveTemplate;
let initialActiveKey = 'shopfast';
let initialCustomList = [...storedCustomArchitectures];

if (initialSpecFromUrl) {
  initialSpec = initialSpecFromUrl;
  const existingIdx = initialCustomList.findIndex(
    (c) => c.name === initialSpecFromUrl.name && c.spec.services.length === initialSpecFromUrl.services.length
  );
  if (existingIdx >= 0) {
    initialCustomList[existingIdx].spec = initialSpecFromUrl;
    initialActiveKey = initialCustomList[existingIdx].id;
  } else {
    const newEntry: CustomArchitectureEntry = {
      id: `custom_${Date.now()}`,
      name: initialSpecFromUrl.name || 'Custom Architecture',
      spec: initialSpecFromUrl,
      source: 'url',
      importedAt: Date.now(),
    };
    initialCustomList = [newEntry, ...initialCustomList];
    initialActiveKey = newEntry.id;
  }
  persistCustomArchitectures(initialCustomList);
}

const initialLayout = computeGraphLayout(initialSpec);

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  currentSpec: initialSpec,
  activeTemplateKey: initialActiveKey,
  customArchitectures: initialCustomList,
  layout: initialLayout,
  selectedElementId: null,
  selectedElementType: null,

  loadTemplate: (templateKey: string) => {
    // 1. Check built-in template catalog
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
      return;
    }

    // 2. Check stored custom architectures
    const { customArchitectures } = get();
    const custom = customArchitectures.find((c) => c.id === templateKey);
    if (custom) {
      const cloned: ArchitectureSpec = JSON.parse(JSON.stringify(custom.spec));
      const layout = computeGraphLayout(cloned);
      syncHashToUrl(cloned);
      set({
        currentSpec: cloned,
        activeTemplateKey: custom.id,
        layout,
        selectedElementId: null,
        selectedElementType: null,
      });
      return;
    }
  },

  deleteCustomArchitecture: (architectureId: string) => {
    const { customArchitectures, activeTemplateKey } = get();
    const updatedList = customArchitectures.filter((c) => c.id !== architectureId);
    persistCustomArchitectures(updatedList);

    const isCurrentActive =
      activeTemplateKey === architectureId ||
      ['custom', 'imported', 'docker-compose'].includes(activeTemplateKey);

    if (isCurrentActive) {
      const fallback = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      const layout = computeGraphLayout(fallback);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      set({
        customArchitectures: updatedList,
        currentSpec: fallback,
        activeTemplateKey: 'shopfast',
        layout,
        selectedElementId: null,
        selectedElementType: null,
      });
    } else {
      set({ customArchitectures: updatedList });
    }
  },

  setSpec: (spec: ArchitectureSpec) => {
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);
    const { customArchitectures, activeTemplateKey } = get();
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, spec);
    set({
      currentSpec: spec,
      customArchitectures: updatedCustom,
      layout,
    });
  },

  importDockerCompose: (yamlStr: string) => {
    const spec = importFromDockerCompose(yamlStr);
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);

    const { customArchitectures } = get();
    const id = `custom_${Date.now()}`;
    const name = spec.name || 'Docker Compose Architecture';
    const entry: CustomArchitectureEntry = {
      id,
      name,
      spec,
      source: 'docker-compose',
      importedAt: Date.now(),
    };

    const existingIndex = customArchitectures.findIndex((c) => c.name === name);
    let updatedList: CustomArchitectureEntry[];
    if (existingIndex >= 0) {
      updatedList = [...customArchitectures];
      entry.id = customArchitectures[existingIndex].id;
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...customArchitectures];
    }
    persistCustomArchitectures(updatedList);

    set({
      customArchitectures: updatedList,
      currentSpec: spec,
      activeTemplateKey: entry.id,
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },



  importYamlOrJson: (text: string) => {
    const spec = parseArchitectureYamlOrJson(text);
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);

    const { customArchitectures } = get();
    const id = `custom_${Date.now()}`;
    const name = spec.name || 'Imported Architecture';
    const entry: CustomArchitectureEntry = {
      id,
      name,
      spec,
      source: 'yaml',
      importedAt: Date.now(),
    };

    const existingIndex = customArchitectures.findIndex((c) => c.name === name);
    let updatedList: CustomArchitectureEntry[];
    if (existingIndex >= 0) {
      updatedList = [...customArchitectures];
      entry.id = customArchitectures[existingIndex].id;
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...customArchitectures];
    }
    persistCustomArchitectures(updatedList);

    set({
      customArchitectures: updatedList,
      currentSpec: spec,
      activeTemplateKey: entry.id,
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },

  deploySynthesizedArchitecture: (spec: ArchitectureSpec) => {
    const layout = computeGraphLayout(spec);
    syncHashToUrl(spec);

    const { customArchitectures } = get();
    const id = `custom_ai_${Date.now()}`;
    const name = spec.name || 'AI Synthesized Architecture';
    const entry: CustomArchitectureEntry = {
      id,
      name,
      spec,
      source: 'yaml',
      importedAt: Date.now(),
    };

    const existingIndex = customArchitectures.findIndex((c) => c.name === name);
    let updatedList: CustomArchitectureEntry[];
    if (existingIndex >= 0) {
      updatedList = [...customArchitectures];
      entry.id = customArchitectures[existingIndex].id;
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...customArchitectures];
    }
    persistCustomArchitectures(updatedList);

    set({
      customArchitectures: updatedList,
      currentSpec: spec,
      activeTemplateKey: entry.id,
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
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    const updatedServices = currentSpec.services.map((svc) =>
      svc.id === serviceId ? { ...svc, ...updates } : svc
    );
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      services: updatedServices,
    };
    const layout = computeGraphLayout(updatedSpec);
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({ currentSpec: updatedSpec, customArchitectures: updatedCustom, layout });
  },

  removeService: (serviceId) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    if (currentSpec.services.length <= 1) return; // Prevent deleting the only remaining service
    const updatedServices = currentSpec.services.filter((svc) => svc.id !== serviceId);
    const updatedEdges = currentSpec.edges.filter(
      (edge) => edge.from !== serviceId && edge.to !== serviceId
    );
    const updatedFaults = currentSpec.faults.filter((fault) => fault.target !== serviceId);
    const updatedWorkload = { ...currentSpec.workload };
    if (updatedWorkload.entry === serviceId && updatedServices.length > 0) {
      updatedWorkload.entry = updatedServices[0].id;
    }
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      services: updatedServices,
      edges: updatedEdges,
      faults: updatedFaults,
      workload: updatedWorkload,
    };
    const layout = computeGraphLayout(updatedSpec);
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({
      currentSpec: updatedSpec,
      customArchitectures: updatedCustom,
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },

  updateEdge: (edgeId, updates) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
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
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({ currentSpec: updatedSpec, customArchitectures: updatedCustom, layout });
  },

  removeEdge: (edgeId) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    const updatedEdges = currentSpec.edges.filter(
      (edge) => edge.id !== edgeId && `${edge.from}->${edge.to}` !== edgeId
    );
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      edges: updatedEdges,
    };
    const layout = computeGraphLayout(updatedSpec);
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({
      currentSpec: updatedSpec,
      customArchitectures: updatedCustom,
      layout,
      selectedElementId: null,
      selectedElementType: null,
    });
  },

  addFault: (fault) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      faults: [...currentSpec.faults, fault],
    };
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({ currentSpec: updatedSpec, customArchitectures: updatedCustom });
  },

  removeFault: (faultId) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      faults: currentSpec.faults.filter((f) => f.id !== faultId),
    };
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({ currentSpec: updatedSpec, customArchitectures: updatedCustom });
  },

  setWorkloadPattern: (pattern) => {
    const { currentSpec, customArchitectures, activeTemplateKey } = get();
    const updatedSpec: ArchitectureSpec = {
      ...currentSpec,
      workload: {
        ...currentSpec.workload,
        pattern,
        multiplier: pattern === 'constant' ? 1.0 : pattern === 'flash_sale' ? 3.0 : currentSpec.workload.multiplier,
      },
    };
    syncHashToUrl(updatedSpec);
    const updatedCustom = syncUpdatedSpecToCustomList(customArchitectures, activeTemplateKey, updatedSpec);
    set({ currentSpec: updatedSpec, customArchitectures: updatedCustom });
  },
}));
