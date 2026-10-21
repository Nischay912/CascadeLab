import { ArchitectureSpec, validateArchitecture, ServiceSpec, EdgeSpec } from '../schema/architecture';
import { PromptGeneratorOptions, SynthesizedArchitectureResult, SynthesizedServiceTier } from './promptArchitectureEngine';

const SYSTEM_PROMPT = `You are CascadeLab's Chief Distributed Systems Architect AI.
CascadeLab is an enterprise-grade resilience engineering simulator that models microservices, network latencies, queues, cascading failure waves, and retry storms.

Your mission: Translate user natural language descriptions into complete, production-grade microservice architecture topologies, or reject non-architectural requests.

EVALUATION RULES:
1. REJECTION (Non-Architectural / Off-Topic / General Chit-Chat):
   If the prompt is a greeting (e.g. "hi", "hello", "good morning"), a general question (e.g. "what is the capital of France"), programming code requests (e.g. "write python for binary search"), homework, or completely unrelated to software systems architecture:
   Return JSON:
   {
     "isValid": false,
     "refusalReason": "A polite, constructive explanation in 1-2 sentences of why this request cannot be translated into a microservice topology, and give 2 concrete architecture prompts they can try."
   }

2. TOPOLOGY SYNTHESIS (Valid Architectural Prompt):
   - Structural Precision: If the user requests a specific number of tiers or services (e.g., "5 tiers each with 7 services for medical team app", "3 tiers with 4 services"), you MUST create EXACTLY that number of tiers and EXACTLY that number of distinct services per tier (e.g., 5 tiers x 7 services = exactly 35 services).
   - Domain-Realistic Naming: For medical, fintech, e-commerce, streaming, gaming, IoT, or logistics, choose realistic microservice roles and names (e.g., "telemetry-ingest", "ehr-fhir-gateway", "triage-dispatcher", "pacs-image-store", etc.).
   - Directed Acyclic Graph (DAG): Tiers must strictly progress from ingress (tier 0) downstream towards core logic and finally data storage / external systems. No circular loops.
   - Node Specifications:
     - id: lowercase kebab-case (e.g. "triage-gateway")
     - name: Title Case (e.g. "Triage Gateway")
     - tier: integer (0 to N)
     - role: string ("gateway", "auth", "domain", "compute", "cache", "database", "queue", "external")
     - instances: { initial: number (1-4), min: 1, max: 10 }
     - concurrency: integer (30 to 80 slots per instance)
     - service_time_ms: integer (5 to 80 ms processing time)
     - queue_limit: integer (100 to 400 queue depth)
     - cost_inr_per_instance_month: integer (1500 to 6000)
   - Edge Specifications:
     - from: upstream node id
     - to: downstream node id
     - calls_per_request: number (0.5 to 2.0)
     - mode: "sync" or "async"
     - critical: boolean
     - timeout_ms: integer (300 to 1200 ms)
     - retries: integer (0 to 3)
   - Traffic Entrypoint:
     - entry: id of the primary gateway service in tier 0.
   - Fault Target:
     - faultTarget: id of a downstream database, external dependency, or critical service suitable for chaos testing.

JSON OUTPUT FORMAT:
{
  "isValid": true,
  "domain": "Domain Name (e.g. Clinical Healthcare Operations)",
  "name": "Architecture Title (e.g. ClinicalOps Medical Platform)",
  "description": "Short 1-2 sentence description",
  "services": [
    {
      "id": "node-id",
      "name": "Node Display Name",
      "tier": 0,
      "role": "gateway",
      "instances": { "initial": 3, "min": 1, "max": 10 },
      "concurrency": 50,
      "service_time_ms": 15,
      "queue_limit": 200,
      "cost_inr_per_instance_month": 2500
    }
  ],
  "edges": [
    {
      "from": "upstream-id",
      "to": "downstream-id",
      "calls_per_request": 1.0,
      "mode": "sync",
      "critical": true,
      "timeout_ms": 500,
      "retries": 3
    }
  ],
  "workload": {
    "entry": "entrypoint-node-id",
    "pattern": "constant",
    "base_rps": 600,
    "duration_s": 180,
    "ramp_time_s": 30
  },
  "faultTarget": "downstream-node-id"
}

OUTPUT RAW VALID JSON ONLY. No markdown backticks, no explanatory text outside the JSON.`;

export function getGeminiApiKey(): string | null {
  // 1. Check environment variable (from .env.local)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }

  // 2. Check localStorage in browser
  try {
    const localKey = localStorage.getItem('cascadelab_gemini_api_key');
    if (localKey && localKey.trim().length > 0) {
      return localKey.trim();
    }
  } catch {
    // ignore localStorage errors in headless environments
  }

  return null;
}

export function setGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem('cascadelab_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('cascadelab_gemini_api_key');
    }
  } catch {
    // ignore
  }
}

interface GeminiRawResponse {
  isValid: boolean;
  refusalReason?: string;
  domain?: string;
  name?: string;
  description?: string;
  services?: Array<{
    id: string;
    name: string;
    tier: number;
    role?: string;
    instances?: { initial: number; min: number; max: number };
    concurrency?: number;
    service_time_ms?: number;
    queue_limit?: number;
    cost_inr_per_instance_month?: number;
  }>;
  edges?: Array<{
    from: string;
    to: string;
    calls_per_request?: number;
    mode?: 'sync' | 'async';
    critical?: boolean;
    timeout_ms?: number;
    retries?: number;
  }>;
  workload?: {
    entry: string;
    pattern?: 'constant' | 'ramp' | 'spike' | 'flash_sale';
    base_rps?: number;
    duration_s?: number;
    ramp_time_s?: number;
  };
  faultTarget?: string;
}

/**
 * Executes a call to Google's Gemini Flash API using client-side REST endpoint.
 * Features an intelligent multi-model cascade to gracefully bypass transient 503 spikes.
 */
async function callGeminiApi(prompt: string, apiKey: string): Promise<GeminiRawResponse> {
  const models = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.warn(`[Gemini Engine] Model ${model} returned error (${response.status}):`, lastError);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = 'No text candidate returned from Gemini.';
        continue;
      }

      const parsed: GeminiRawResponse = JSON.parse(rawText);
      return parsed;
    } catch (err: any) {
      lastError = err?.message || 'Network error communicating with Google Gemini.';
      console.warn(`[Gemini Engine] Failed with model ${model}:`, err);
    }
  }

  throw new Error(`Google Gemini API call failed: ${lastError}`);
}

/**
 * Main AI Topology Generator powered by Google Gemini.
 */
export async function synthesizeArchitectureWithGemini(
  prompt: string,
  options: PromptGeneratorOptions = {}
): Promise<SynthesizedArchitectureResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API Key missing. Please add VITE_GEMINI_API_KEY in .env.local or enter your free key in AI Settings.'
    );
  }

  const {
    mode = 'fragile_naive',
    trafficScale = 'medium',
    includeSpof = true,
    includeFault = true,
  } = options;

  // 1. Call Gemini LLM
  const raw = await callGeminiApi(prompt, apiKey);

  // 2. Handle Rejection (Off-topic, greetings, non-system queries)
  if (!raw.isValid) {
    const reason =
      raw.refusalReason ||
      'This prompt does not describe a valid distributed systems or microservice architecture. Please try describing an architecture (e.g., "5 tiers each with 7 services for medical team app").';
    throw new Error(reason);
  }

  if (!raw.services || raw.services.length === 0) {
    throw new Error('Gemini returned an empty service list for this topology.');
  }

  // 3. Scale and baseline RPS
  const rpsMultipliers = {
    low: 300,
    medium: 600,
    high: 1200,
    peak: 2400,
  };
  const baseRps = rpsMultipliers[trafficScale] || 600;

  // 4. Calculate Auto-Layout Coordinates for Canvas (Tier X, Stacked Y)
  const tierBuckets: Record<number, typeof raw.services> = {};
  raw.services.forEach((s) => {
    const t = s.tier ?? 0;
    if (!tierBuckets[t]) tierBuckets[t] = [];
    tierBuckets[t].push(s);
  });

  const sortedTiers = Object.keys(tierBuckets)
    .map(Number)
    .sort((a, b) => a - b);

  const X_SPACING = 320;
  const Y_SPACING = 140;
  const X_OFFSET = 80;
  const Y_OFFSET = 60;

  const services: ServiceSpec[] = [];

  sortedTiers.forEach((tierNum, tierIdx) => {
    const nodesInTier = tierBuckets[tierNum];
    const totalHeight = (nodesInTier.length - 1) * Y_SPACING;
    const startY = Math.max(Y_OFFSET, 380 - totalHeight / 2);

    nodesInTier.forEach((rawService, nodeIdx) => {
      const isEntry = rawService.id === raw.workload?.entry || (tierIdx === 0 && nodeIdx === 0);
      const isDbOrCache =
        rawService.role === 'database' ||
        rawService.role === 'cache' ||
        rawService.id.includes('db') ||
        rawService.id.includes('store') ||
        rawService.id.includes('redis');

      // Calibrate instances and queue based on options and mode
      let instancesInitial = rawService.instances?.initial ?? 2;
      let queueLimit = rawService.queue_limit ?? 200;

      if (mode === 'fragile_naive') {
        if (includeSpof && isDbOrCache && nodeIdx === 0) {
          instancesInitial = 1; // Intentional SPOF
        }
      } else {
        // Hardened mode
        instancesInitial = Math.max(instancesInitial, 3);
        queueLimit = Math.max(queueLimit, 350);
      }

      services.push({
        id: rawService.id,
        name: rawService.name || rawService.id,
        displayName: rawService.name || rawService.id,
        role: rawService.role || (isEntry ? 'gateway' : 'domain'),
        entry: isEntry,
        instances: {
          initial: instancesInitial,
          min: 1,
          max: rawService.instances?.max ?? 12,
        },
        concurrency: rawService.concurrency ?? 50,
        service_time_ms: rawService.service_time_ms ?? 15,
        queue_limit: queueLimit,
        load_shedding: {
          enabled: mode === 'hardened',
          threshold: 0.8,
        },
        autoscale: {
          enabled: true,
          target_util: mode === 'hardened' ? 0.65 : 0.8,
          eval_period_s: 15,
          startup_delay_s: 30,
          cooldown_s: 90,
        },
        crash: {
          enabled: true,
          after_overload_s: 20,
          restart_delay_s: 30,
        },
        cost_inr_per_instance_month: rawService.cost_inr_per_instance_month ?? 2500,
        zone_spread: ['a', 'b'],
        position: {
          x: Math.round(X_OFFSET + tierIdx * X_SPACING),
          y: Math.round(startY + nodeIdx * Y_SPACING),
        },
      });
    });
  });

  // 5. Construct Edges with Resilience Specs
  const edges: EdgeSpec[] = (raw.edges || []).map((e) => {
    const isHardened = mode === 'hardened';
    return {
      id: `${e.from}->${e.to}`,
      from: e.from,
      to: e.to,
      calls_per_request: e.calls_per_request ?? 1.0,
      mode: e.mode ?? 'sync',
      critical: e.critical ?? true,
      timeout_ms: e.timeout_ms ?? (isHardened ? 800 : 500),
      retries: isHardened ? 2 : e.retries ?? 3,
      backoff: {
        mode: isHardened ? 'exponential' : 'none',
        jitter: isHardened,
        base_delay_ms: 100,
        max_delay_ms: 1500,
      },
      circuit_breaker: {
        enabled: isHardened,
        failure_rate_threshold: 0.5,
        min_calls: 10,
        open_duration_s: 15,
        probe_fraction: 0.1,
      },
      cache: {
        hit_ratio: e.to.includes('cache') || e.to.includes('redis') ? 0.85 : 0.0,
        warm_time_s: 30,
      },
      bulkhead_max_concurrent: null,
    };
  });

  // 6. Workload Entrypoint
  const entryNode = services.find((s) => s.id === raw.workload?.entry) || services[0];

  const spec: ArchitectureSpec = {
    name: raw.name || 'AI Synthesized Architecture',
    description:
      raw.description ||
      `Google Gemini synthesized architecture for "${prompt}". Calibrated for ${baseRps} RPS with ${services.length} services across ${sortedTiers.length} tiers.`,
    services,
    edges,
    workload: {
      entry: entryNode.id,
      pattern: raw.workload?.pattern || 'constant',
      base_rps: baseRps,
      multiplier: 1.0,
      duration_s: 180,
      ramp_time_s: 30,
    },
    faults: [],
    slo: {
      success_pct: 99.0,
      p95_ms: 600,
    },
    seed: 42,
    value_per_request_inr: 500,
  };

  // 7. Inject Chaos Fault if requested
  if (includeFault) {
    const faultTarget =
      raw.faultTarget && services.some((s) => s.id === raw.faultTarget)
        ? raw.faultTarget
        : services[services.length - 1].id;

    spec.faults.push({
      id: 'ai_chaos_fault_1',
      type: 'latency',
      target: faultTarget,
      factor: 5,
      start_s: 60,
      end_s: 120,
    });
  }

  // 8. Validate Spec against Zod Schema
  const validation = validateArchitecture(spec);
  if (!validation.success || !validation.data) {
    throw new Error(
      `Synthesized architecture failed schema validation: ${validation.errors?.join(', ')}`
    );
  }

  const validatedSpec = validation.data;

  // 9. Format Tiers for UI Preview
  const tiers: SynthesizedServiceTier[] = sortedTiers.map((tierNum) => {
    const list = tierBuckets[tierNum];
    return {
      tierName: `Tier ${tierNum + 1}: ${list[0]?.role?.toUpperCase() || 'DOMAIN'} (${list.length} services)`,
      services: list.map((s) => s.name || s.id),
    };
  });

  const domain = raw.domain || 'Distributed Cloud Platform';
  const insights: string[] = [
    `Synthesized by Google Gemini: ${services.length} microservices organized across ${sortedTiers.length} distinct tiers.`,
    `Calibrated baseline traffic to ${baseRps} RPS with Little's Law thread & queue sizing.`,
    mode === 'fragile_naive'
      ? `Configured naive unbacked retry patterns to demonstrate cascading failure propagation under chaos.`
      : `Hardened with exponential jitter backoff, circuit breakers, and load shedding.`,
    includeFault
      ? `Scheduled a 5x latency surge chaos card at T+60s to test upstream resilience.`
      : `Clean baseline state ready for manual chaos card injection.`,
  ];

  const suggestedExperiment =
    'Run the simulation at 4x speed. Watch the latency surge trigger an orange retry storm across upstream tiers, then activate AI Auto-Pilot to self-heal in real-time!';

  return {
    spec: validatedSpec,
    summary: {
      domain,
      architectureName: raw.name || 'AI Synthesized Architecture',
      description: spec.description || '',
      servicesCount: services.length,
      edgesCount: edges.length,
      tiers,
      insights,
      suggestedExperiment,
    },
  };
}
