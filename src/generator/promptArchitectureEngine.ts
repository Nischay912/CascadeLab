import { ArchitectureSpec, validateArchitecture } from '../schema/architecture';

export interface PromptGeneratorOptions {
  mode?: 'fragile_naive' | 'hardened';
  trafficScale?: 'low' | 'medium' | 'high' | 'peak';
  includeSpof?: boolean;
  includeFault?: boolean;
}

export interface SynthesizedServiceTier {
  tierName: string;
  services: string[];
}

export interface SynthesizedArchitectureResult {
  spec: ArchitectureSpec;
  summary: {
    domain: string;
    architectureName: string;
    description: string;
    servicesCount: number;
    edgesCount: number;
    tiers: SynthesizedServiceTier[];
    insights: string[];
    suggestedExperiment: string;
  };
}

export interface PromptPreset {
  id: string;
  category: string;
  title: string;
  icon: string;
  prompt: string;
  description: string;
}

export interface PromptValidationResult {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'ride_hailing',
    category: 'Mobility & Logistics',
    title: 'Uber / Ride-Hailing Platform',
    icon: 'Car',
    prompt:
      'Generate an Uber-like ride-hailing architecture with a geospatial matching service, a surge pricing cache, and an external payment gateway.',
    description:
      'Real-time driver location tracking, H3 hexagonal spatial matching, dynamic surge cache, and transactional rides database.',
  },
  {
    id: 'food_delivery',
    category: 'Quick Commerce',
    title: 'Food Delivery & Dispatch',
    icon: 'Utensils',
    prompt:
      'Swiggy-style food delivery network with restaurant order ingest, live courier tracking, dispatch optimizer, and PostgreSQL orders DB.',
    description:
      'Multi-tier delivery platform managing live menu catalog, driver location pings, delivery ETA calculation, and restaurant kitchen orders.',
  },
  {
    id: 'video_streaming',
    category: 'Media & Entertainment',
    title: 'Netflix Video Streaming',
    icon: 'Film',
    prompt:
      'Netflix-grade media streaming platform with CDN edge routing, DRM token verification, transcoding fleet, and user catalog cache.',
    description:
      'High-throughput media distribution network with geo-distributed CDN caching, token signing, and manifest generation.',
  },
  {
    id: 'fintech_switch',
    category: 'Fintech & Banking',
    title: 'UPI Payment Switch Hub',
    icon: 'CreditCard',
    prompt:
      'Fintech UPI payment switch with real-time fraud scoring engine, idempotency cache, transaction ledger DB, and beneficiary bank CBS gateway.',
    description:
      'Sub-50ms payment switch processing real-time UPI/IMPS transactions with zero-data-loss ledger and fraud detection.',
  },
  {
    id: 'genai_agents',
    category: 'AI & Machine Learning',
    title: 'Multi-Agent LLM Pipeline',
    icon: 'Bot',
    prompt:
      'Production GenAI pipeline with prompt intent router, semantic cache, vector database (Milvus), and worker pool for GPU model inference.',
    description:
      'Orchestrated multi-agent pipeline with token bucket rate limiting, embeddings vector retrieval, and streaming LLM inference.',
  },
  {
    id: 'iot_telemetry',
    category: 'IoT & Telemetry',
    title: 'IoT Telemetry & Edge Stream',
    icon: 'Cpu',
    prompt:
      'Design an IoT telemetry platform with MQTT ingestion, anomaly detection filter, timeseries InfluxDB, and alert webhook.',
    description:
      'Massive scale sensor payload ingest, real-time threshold anomaly filter, timeseries metrics storage, and automated notification webhook.',
  },
  {
    id: 'gaming_matchmaking',
    category: 'Gaming & Multiplayer',
    title: 'Multiplayer Matchmaking Grid',
    icon: 'Gamepad2',
    prompt:
      'Gaming matchmaking architecture with player queue, MMR ranking service, lobby balancer, and dedicated game server fleet.',
    description:
      'Real-time competitive matchmaking with player skill rating calculation, lobby instance provisioning, and game session persistence.',
  },
  {
    id: 'ecommerce_flash',
    category: 'E-Commerce',
    title: 'E-Commerce Flash Sale',
    icon: 'ShoppingBag',
    prompt:
      'E-commerce store with catalog cache, inventory reservation, checkout worker pool, and external payment provider.',
    description:
      'High-concurrency online storefront with flash sale traffic surges, stock reservation queue, and downstream payment provider.',
  },
];

interface ExtractedEntity {
  id: string;
  name: string;
  role: string;
  tier: 'ingress' | 'core' | 'data' | 'external';
  service_time_ms: number;
  initial_instances: number;
  concurrency: number;
  queue_limit: number;
  isEntry?: boolean;
}

// ============================================================================
// 1. Semantic Architecture Intent Validator
// ============================================================================
export function validatePromptIntent(prompt: string): PromptValidationResult {
  if (!prompt || !prompt.trim()) {
    return {
      isValid: false,
      reason: 'Please enter a natural language architecture description.',
      suggestion: 'Type your system requirements or click any of the 8 presets above.',
    };
  }

  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // 1. Conversational greetings and small talk (e.g., "hi how are you", "hello", "hey there")
  const isGreeting =
    /^(hi+|hello+|hey+|howdy|hola|namaste|sup|yo|greetings)\b/i.test(lower) ||
    /\b(how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|what\s+is\s+up|what's\s+up|are\s+you\s+ai|tell\s+me\s+a\s+joke|thank\s*(you|s)?|good\s+(morning|afternoon|evening|night|day))\b/i.test(
      lower
    );
  if (isGreeting) {
    return {
      isValid: false,
      reason: `Prompt "${trimmed}" is a conversational greeting or query, not a system architecture request.`,
      suggestion:
        'Please describe a distributed system or microservice stack (e.g. "Ride-hailing platform with matching service, Redis surge cache, and payment gateway") or pick an inspiration preset above.',
    };
  }

  // 2. Generic coding / code generation questions (e.g., "write python code for a calculator")
  const CODE_GENERATION_REGEX =
    /^(write|generate|give\s+me|create|build|show\s+me)\s+(a\s+)?(python|javascript|typescript|c\+\+|java|rust|go|react|html|css|sql|bash)\s+(code|script|program|class|function|algorithm)\b/i;
  if (CODE_GENERATION_REGEX.test(lower)) {
    return {
      isValid: false,
      reason: `CascadeLab is a distributed resilience digital twin that simulates queuing networks and failure physics, rather than generating source code.`,
      suggestion:
        'Describe the microservices and infrastructure components instead (e.g. "Authentication service with JWT cache and PostgreSQL user store").',
    };
  }

  // 3. Off-topic queries (e.g., weather, news, recipes)
  const OFF_TOPIC_REGEX =
    /^(what\s+is\s+the\s+weather|recipe\s+for|how\s+to\s+cook|who\s+won\s+the|play\s+a\s+song|sing\s+a\s+song|translate\s+this|poem\s+about)\b/i;
  if (OFF_TOPIC_REGEX.test(lower)) {
    return {
      isValid: false,
      reason: `Prompt appears unrelated to software architecture or cloud infrastructure.`,
      suggestion:
        'Include components such as services, databases, caches, queues, gateways, or workers.',
    };
  }

  // 4. Underspecified / too short (< 2 words or single non-descriptive word like "test" or "database")
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) {
    return {
      isValid: false,
      reason: `Prompt "${trimmed}" is too brief to synthesize a multi-tier microservice architecture.`,
      suggestion:
        'Please mention an entry gateway and at least 1 or 2 downstream services, databases, or APIs.',
    };
  }

  // 5. Check for architectural vocabulary or system nouns
  const ARCH_VOCABULARY = [
    'service',
    'microservice',
    'api',
    'gateway',
    'router',
    'proxy',
    'ingress',
    'load balancer',
    'database',
    'db',
    'postgres',
    'mysql',
    'mongo',
    'mongodb',
    'dynamo',
    'cassandra',
    'redis',
    'cache',
    'memcache',
    'queue',
    'kafka',
    'rabbitmq',
    'sqs',
    'nats',
    'pubsub',
    'worker',
    'pool',
    'fleet',
    'cluster',
    'auth',
    'payment',
    'stripe',
    'billing',
    'order',
    'checkout',
    'cart',
    'catalog',
    'search',
    'user',
    'account',
    'inventory',
    'dispatch',
    'stream',
    'streaming',
    'transcode',
    'video',
    'cdn',
    'notification',
    'email',
    'sms',
    'telemetry',
    'sensor',
    'mqtt',
    'timeseries',
    'influx',
    'matchmaking',
    'game',
    'lobby',
    'llm',
    'ai',
    'vector',
    'embedding',
    'inference',
    'model',
    'agent',
    'uber',
    'swiggy',
    'netflix',
    'upi',
    'banking',
    'fintech',
    'ecommerce',
    'hospital',
    'booking',
    'hotel',
    'airline',
    'flight',
    'delivery',
    'courier',
    'geospatial',
    'location',
    'tracking',
    'webhook',
    'backend',
    'frontend',
    'platform',
    'system',
    'architecture',
    'topology',
    'network',
    'pipeline',
    'node',
    'component',
  ];

  const hasArchKeyword = ARCH_VOCABULARY.some((term) => lower.includes(term));
  if (!hasArchKeyword) {
    return {
      isValid: false,
      reason: `Prompt does not describe a software architecture or cloud system components.`,
      suggestion:
        'Describe services, APIs, databases, or message queues (e.g. "Hospital management with doctor appointment service, patient records DB, and insurance gateway").',
    };
  }

  return { isValid: true };
}

// ============================================================================
// 2. Domain Classifier
// ============================================================================
export function detectDomainFromPrompt(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes('uber') ||
    normalized.includes('ride') ||
    normalized.includes('driver') ||
    normalized.includes('geospatial') ||
    normalized.includes('trip') ||
    normalized.includes('fleet') ||
    normalized.includes('matching')
  ) {
    return 'ridehailing';
  }
  if (
    normalized.includes('food') ||
    normalized.includes('swiggy') ||
    normalized.includes('zomato') ||
    normalized.includes('delivery') ||
    normalized.includes('restaurant') ||
    normalized.includes('courier') ||
    normalized.includes('kitchen')
  ) {
    return 'food_delivery';
  }
  if (
    normalized.includes('netflix') ||
    normalized.includes('stream') ||
    normalized.includes('video') ||
    normalized.includes('cdn') ||
    normalized.includes('drm') ||
    normalized.includes('transcod') ||
    normalized.includes('media')
  ) {
    return 'streaming';
  }
  if (
    normalized.includes('upi') ||
    normalized.includes('bank') ||
    normalized.includes('fintech') ||
    normalized.includes('ledger') ||
    normalized.includes('transfer') ||
    normalized.includes('settlement') ||
    normalized.includes('npci')
  ) {
    return 'fintech';
  }
  if (
    normalized.includes('ai') ||
    normalized.includes('llm') ||
    normalized.includes('agent') ||
    normalized.includes('vector') ||
    normalized.includes('embedding') ||
    normalized.includes('inference') ||
    normalized.includes('milvus')
  ) {
    return 'genai';
  }
  if (
    normalized.includes('iot') ||
    normalized.includes('sensor') ||
    normalized.includes('mqtt') ||
    normalized.includes('telemetry') ||
    normalized.includes('influx')
  ) {
    return 'iot';
  }
  if (
    normalized.includes('game') ||
    normalized.includes('gaming') ||
    normalized.includes('matchmak') ||
    normalized.includes('lobby') ||
    normalized.includes('multiplayer') ||
    normalized.includes('mmr')
  ) {
    return 'gaming';
  }
  if (
    normalized.includes('shop') ||
    normalized.includes('ecommerce') ||
    normalized.includes('cart') ||
    normalized.includes('checkout') ||
    normalized.includes('catalog')
  ) {
    return 'ecommerce';
  }
  return 'custom';
}

// ============================================================================
// 3. Dynamic Semantic Entity Extractor
// ============================================================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function titleCase(text: string): string {
  return text
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Extracts custom components from natural language text.
 * Matches patterns like "geospatial matching service", "surge pricing cache", "external payment gateway", "patient records database", etc.
 */
function extractCustomEntitiesFromPrompt(prompt: string): ExtractedEntity[] {
  const normalized = prompt.toLowerCase();
  const entities: ExtractedEntity[] = [];
  const seenIds = new Set<string>();

  // Regex patterns to capture architectural noun phrases
  // e.g. "a [geospatial matching] service", "[surge pricing] cache", "[external payment] gateway"
  const patterns: Array<{
    regex: RegExp;
    tier: 'ingress' | 'core' | 'data' | 'external';
    defaultLatency: number;
    concurrency: number;
    queueLimit: number;
  }> = [
    // Gateways / Ingress
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(api\s+gateway|ingress\s+gateway|edge\s+router|reverse\s+proxy|load\s+balancer|websocket\s+gateway|ingress)\b/gi,
      tier: 'ingress',
      defaultLatency: 5,
      concurrency: 50,
      queueLimit: 250,
    },
    // Caches
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(cache|redis\s+cache|redis|memcached|in-memory\s+cache|caching\s+layer)\b/gi,
      tier: 'data',
      defaultLatency: 4,
      concurrency: 80,
      queueLimit: 300,
    },
    // Queues / Message Brokers
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(queue|kafka\s+topic|kafka|rabbitmq|sqs\s+queue|event\s+stream|message\s+broker|buffer)\b/gi,
      tier: 'data',
      defaultLatency: 10,
      concurrency: 60,
      queueLimit: 400,
    },
    // Databases / Data Stores
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(database|db|postgres\s+db|postgresql|mysql|mongodb|dynamodb|cassandra|elasticsearch|vector\s+db|ledger\s+db|datastore|store)\b/gi,
      tier: 'data',
      defaultLatency: 16,
      concurrency: 45,
      queueLimit: 220,
    },
    // External APIs / Webhooks
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(external\s+api|external\s+gateway|payment\s+gateway|third-party\s+api|provider\s+gateway|webhook|bank\s+gateway|partner\s+api)\b/gi,
      tier: 'external',
      defaultLatency: 130,
      concurrency: 75,
      queueLimit: 350,
    },
    // Core Services / Engines / Workers / Processors
    {
      regex:
        /\b([a-z0-9_-]+(?:\s+[a-z0-9_-]+)?)\s+(service|engine|worker|processor|manager|filter|dispatcher|hub|pipeline|matcher|scheduler|optimizer)\b/gi,
      tier: 'core',
      defaultLatency: 22,
      concurrency: 40,
      queueLimit: 180,
    },
  ];

  for (const p of patterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(p.regex.source, 'gi');
    while ((match = re.exec(normalized)) !== null) {
      const modifier = match[1]?.trim();
      const baseType = match[2]?.trim();
      if (!baseType) continue;

      // Filter stop words from modifier
      const cleanMod = modifier
        ? modifier
            .replace(/\b(a|an|the|with|and|or|for|of|to|in|our|your|my|some|any|like)\b/gi, '')
            .trim()
        : '';

      const fullName = cleanMod ? `${titleCase(cleanMod)} ${titleCase(baseType)}` : titleCase(baseType);
      let id = slugify(cleanMod ? `${cleanMod}-${baseType}` : baseType);

      // Clean up common id variations
      if (id.endsWith('-service-service')) id = id.replace(/-service-service$/, '-service');
      if (id.endsWith('-db-db')) id = id.replace(/-db-db$/, '-db');
      if (id.endsWith('-cache-cache')) id = id.replace(/-cache-cache$/, '-cache');

      if (!seenIds.has(id) && id.length > 2) {
        seenIds.add(id);
        entities.push({
          id,
          name: fullName,
          role: `${fullName} (${titleCase(p.tier)} Tier)`,
          tier: p.tier,
          service_time_ms: p.defaultLatency,
          initial_instances: p.tier === 'ingress' ? 4 : p.tier === 'core' ? 3 : 2,
          concurrency: p.concurrency,
          queue_limit: p.queueLimit,
          isEntry: p.tier === 'ingress',
        });
      }
    }
  }

  return entities;
}

// ============================================================================
// 4. Natural Language Architecture Synthesizer
// ============================================================================
export function synthesizeArchitectureFromPrompt(
  prompt: string,
  options: PromptGeneratorOptions = {}
): SynthesizedArchitectureResult {
  // 1. Validate Intent & Guard against non-architecture requests
  const validation = validatePromptIntent(prompt);
  if (!validation.isValid) {
    throw new Error(
      `${validation.reason} ${validation.suggestion ? `\n💡 Suggestion: ${validation.suggestion}` : ''}`
    );
  }

  const normalized = prompt.toLowerCase();
  const mode = options.mode || 'fragile_naive';
  const trafficScale = options.trafficScale || 'medium';
  const includeSpof = options.includeSpof !== false;
  const includeFault = options.includeFault !== false;

  // 2. Classify Domain & Baseline Traffic
  const domainKey = detectDomainFromPrompt(prompt);
  let domain = 'Custom Microservices';
  let archName = 'Custom Distributed System';
  let defaultBaseRps = 600;
  let defaultPattern: 'constant' | 'ramp' | 'spike' | 'diurnal' | 'flash_sale' = 'constant';

  switch (domainKey) {
    case 'ridehailing':
      domain = 'Mobility & Ride-Hailing';
      archName = 'RideFlow: Geospatial Fleet Dispatch';
      defaultBaseRps = 800;
      defaultPattern = 'diurnal';
      break;
    case 'food_delivery':
      domain = 'Quick-Commerce & Food Delivery';
      archName = 'QuickBite: Autonomous Delivery Grid';
      defaultBaseRps = 750;
      defaultPattern = 'flash_sale';
      break;
    case 'streaming':
      domain = 'Media Streaming & CDN';
      archName = 'StreamCast: Global Video Delivery';
      defaultBaseRps = 1000;
      defaultPattern = 'constant';
      break;
    case 'fintech':
      domain = 'Fintech & Banking Switch';
      archName = 'PaySwitch: Real-Time Payment Hub';
      defaultBaseRps = 900;
      defaultPattern = 'spike';
      break;
    case 'genai':
      domain = 'Generative AI & LLM Systems';
      archName = 'NeuroMesh: Multi-Agent AI Pipeline';
      defaultBaseRps = 400;
      defaultPattern = 'ramp';
      break;
    case 'iot':
      domain = 'IoT & Telemetry Streaming';
      archName = 'IoTSphere: Edge Sensor Pipeline';
      defaultBaseRps = 1100;
      defaultPattern = 'ramp';
      break;
    case 'gaming':
      domain = 'Gaming & Multiplayer Grid';
      archName = 'ArenaGrid: Real-Time Matchmaking';
      defaultBaseRps = 850;
      defaultPattern = 'spike';
      break;
    case 'ecommerce':
      domain = 'E-Commerce & Retail';
      archName = 'ShopScale: Resilient E-Commerce';
      defaultBaseRps = 700;
      defaultPattern = 'flash_sale';
      break;
    default: {
      // Derive a dynamic domain title from key words in prompt
      const firstFew = prompt
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      domain = 'Custom Architecture';
      archName = `${firstFew} Platform`;
      defaultBaseRps = 650;
      defaultPattern = 'constant';
      break;
    }
  }

  // Determine Traffic RPS
  let baseRps = defaultBaseRps;
  if (trafficScale === 'low') baseRps = Math.round(defaultBaseRps * 0.4);
  if (trafficScale === 'high') baseRps = Math.round(defaultBaseRps * 1.6);
  if (trafficScale === 'peak') baseRps = Math.round(defaultBaseRps * 2.5);

  if (normalized.includes('flash sale') || normalized.includes('surge')) {
    defaultPattern = 'flash_sale';
  }

  // 3. Dynamic Entity Extraction & Assembly
  // First, extract any explicit components mentioned in the user's prompt
  const extracted = extractCustomEntitiesFromPrompt(prompt);
  const entities: ExtractedEntity[] = [];

  // Ingress Gateway: always ensure an Entry Gateway is present
  const hasExplicitIngress = extracted.some((e) => e.tier === 'ingress');
  if (hasExplicitIngress) {
    const ing = extracted.find((e) => e.tier === 'ingress')!;
    ing.isEntry = true;
    entities.push(ing);
  } else {
    entities.push({
      id: 'api-gateway',
      name: domain.includes('IoT') ? 'MQTT / Ingress Gateway' : 'API Gateway',
      role: 'Edge Ingress & Request Router',
      tier: 'ingress',
      service_time_ms: 5,
      initial_instances: Math.max(3, Math.round(baseRps / 200)),
      concurrency: 50,
      queue_limit: 250,
      isEntry: true,
    });
  }

  // Add all non-ingress extracted components
  for (const item of extracted) {
    if (item.tier !== 'ingress' && !entities.some((e) => e.id === item.id)) {
      entities.push(item);
    }
  }

  // Domain-Specific Intelligence & Augmentation
  // If user asked for a specific domain, ensure standard critical tiers are populated
  if (domainKey === 'ridehailing') {
    if (!entities.some((e) => e.id.includes('auth'))) {
      entities.push({
        id: 'auth-service',
        name: 'Auth & Security Service',
        role: 'Driver & Passenger Token Verification',
        tier: 'core',
        service_time_ms: 10,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 150,
      });
    }
    if (!entities.some((e) => e.id.includes('match'))) {
      entities.push({
        id: 'matching-engine',
        name: 'Geospatial Matching Engine',
        role: 'H3 Spatial Driver-Rider Matcher',
        tier: 'core',
        service_time_ms: 25,
        initial_instances: 4,
        concurrency: 35,
        queue_limit: 200,
      });
    }
    if (!entities.some((e) => e.id.includes('trip') || e.id.includes('dispatch'))) {
      entities.push({
        id: 'trip-service',
        name: 'Trip Dispatcher Service',
        role: 'Lifecycle & State Machine Manager',
        tier: 'core',
        service_time_ms: 20,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 180,
      });
    }
    if (!entities.some((e) => e.id.includes('surge') || e.id.includes('cache'))) {
      entities.push({
        id: 'surge-cache',
        name: 'Surge Pricing Cache',
        role: 'In-Memory Demand Multiplier (Redis)',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      });
    }
    if (!entities.some((e) => e.id.includes('driver') || e.id.includes('location'))) {
      entities.push({
        id: 'driver-location-db',
        name: 'Driver Geospatial DB',
        role: 'High-Frequency Spatial Store',
        tier: 'data',
        service_time_ms: 12,
        initial_instances: 2,
        concurrency: 60,
        queue_limit: 250,
      });
    }
    if (!entities.some((e) => e.id.includes('db') || e.id.includes('rides'))) {
      entities.push({
        id: 'rides-db',
        name: includeSpof ? 'Rides DB (SPOF)' : 'Rides Database Cluster',
        role: 'Transactional Trip Ledger',
        tier: 'data',
        service_time_ms: 15,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 50,
        queue_limit: 200,
      });
    }
    if (!entities.some((e) => e.id.includes('payment') || e.tier === 'external')) {
      entities.push({
        id: 'payment-gateway',
        name: 'External Payment Gateway',
        role: 'Third-Party Bank Settlement API',
        tier: 'external',
        service_time_ms: 120,
        initial_instances: 2,
        concurrency: 100,
        queue_limit: 400,
      });
    }
  } else if (domainKey === 'food_delivery') {
    if (!entities.some((e) => e.id.includes('auth'))) {
      entities.push({
        id: 'auth-service',
        name: 'Auth & Identity Filter',
        role: 'JWT & Customer Token Verifier',
        tier: 'core',
        service_time_ms: 8,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 150,
      });
    }
    if (!entities.some((e) => e.id.includes('order'))) {
      entities.push({
        id: 'order-service',
        name: 'Kitchen Order Ingestion Service',
        role: 'State Machine & Cart Finalizer',
        tier: 'core',
        service_time_ms: 22,
        initial_instances: 4,
        concurrency: 40,
        queue_limit: 200,
      });
    }
    if (!entities.some((e) => e.id.includes('dispatch') || e.id.includes('courier'))) {
      entities.push({
        id: 'dispatch-optimizer',
        name: 'Live Courier Dispatcher',
        role: 'Rider ETA & Proximity Route Allocator',
        tier: 'core',
        service_time_ms: 28,
        initial_instances: 3,
        concurrency: 30,
        queue_limit: 160,
      });
    }
    if (!entities.some((e) => e.id.includes('cache') || e.id.includes('menu'))) {
      entities.push({
        id: 'menu-catalog-cache',
        name: 'Restaurant Menu Cache',
        role: 'In-Memory Item Availability Cache',
        tier: 'data',
        service_time_ms: 3,
        initial_instances: 2,
        concurrency: 85,
        queue_limit: 300,
      });
    }
    if (!entities.some((e) => e.id.includes('db'))) {
      entities.push({
        id: 'orders-db',
        name: includeSpof ? 'Orders Database (SPOF)' : 'Orders DB High-Availability',
        role: 'Transactional Orders & Delivery History',
        tier: 'data',
        service_time_ms: 16,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 45,
        queue_limit: 220,
      });
    }
    if (!entities.some((e) => e.tier === 'external')) {
      entities.push({
        id: 'payment-webhook-gateway',
        name: 'Payment Webhook & UPI Router',
        role: 'Third-Party Bank Settlement Webhook',
        tier: 'external',
        service_time_ms: 140,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 350,
      });
    }
  } else {
    // For custom or other domains: ensure we have at least 1 core service, 1 data store, and 1 downstream external/dependency
    if (!entities.some((e) => e.tier === 'core')) {
      entities.push({
        id: 'core-processing-service',
        name: 'Core Application Service',
        role: 'Business Logic & Request Coordinator',
        tier: 'core',
        service_time_ms: 20,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 180,
      });
    }
    if (!entities.some((e) => e.tier === 'data')) {
      entities.push({
        id: 'state-cache',
        name: 'In-Memory State Cache',
        role: 'High-Speed Redis Key-Value Store',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      });
      entities.push({
        id: 'primary-db',
        name: includeSpof ? 'Primary Database (SPOF)' : 'Primary Database Cluster',
        role: 'Persistent Storage Store',
        tier: 'data',
        service_time_ms: 16,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 45,
        queue_limit: 220,
      });
    }
    if (!entities.some((e) => e.tier === 'external')) {
      entities.push({
        id: 'external-provider',
        name: 'External Third-Party API',
        role: 'Upstream Cloud Partner Gateway',
        tier: 'external',
        service_time_ms: 140,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 350,
      });
    }
  }

  // 4. Construct Services Specification
  const services = entities.map((e) => ({
    id: e.id,
    name: e.name,
    displayName: e.name,
    role: e.role,
    entry: Boolean(e.isEntry),
    instances: {
      initial: e.initial_instances,
      min: Math.max(1, e.initial_instances - 1),
      max: e.initial_instances + 6,
    },
    concurrency: e.concurrency,
    service_time_ms: e.service_time_ms,
    queue_limit: e.queue_limit,
    load_shedding: {
      enabled: mode === 'hardened',
      threshold: 0.85,
    },
    autoscale: {
      enabled: true,
      target_util: 0.65,
      eval_period_s: 15,
      startup_delay_s: 25,
      cooldown_s: 45,
    },
    crash: {
      enabled: true,
      after_overload_s: 15,
      restart_delay_s: 30,
    },
    cost_inr_per_instance_month: e.tier === 'data' ? 4500 : 2500,
    zone_spread: ['a', 'b'],
  }));

  // 5. Construct Intelligent DAG Edges
  const entryNode = services.find((s) => s.entry) || services[0];
  const coreNodes = entities.filter((e) => e.tier === 'core');
  const dataNodes = entities.filter((e) => e.tier === 'data');
  const externalNodes = entities.filter((e) => e.tier === 'external');

  const edges: any[] = [];
  const addedEdgeKeys = new Set<string>();

  const addEdge = (fromId: string, toId: string, isCritical = true, weight = 1.0) => {
    const key = `${fromId}->${toId}`;
    if (addedEdgeKeys.has(key) || fromId === toId) return;
    addedEdgeKeys.add(key);

    const isHardened = mode === 'hardened';
    const isCache = toId.includes('cache') || toId.includes('redis');
    edges.push({
      from: fromId,
      to: toId,
      calls_per_request: weight,
      mode: 'sync',
      critical: isCritical,
      timeout_ms: isHardened ? 350 : 800,
      retries: isHardened ? 2 : 3,
      backoff: {
        mode: isHardened ? 'exponential' : 'fixed',
        jitter: isHardened,
        base_delay_ms: isHardened ? 25 : 50,
        max_delay_ms: isHardened ? 300 : 500,
      },
      circuit_breaker: {
        enabled: isHardened,
        failure_rate_threshold: 0.4,
        min_calls: 10,
        open_duration_s: 15,
        probe_fraction: 0.1,
      },
      cache: {
        hit_ratio: isCache ? 0.85 : 0.0,
        warm_time_s: 30,
      },
      bulkhead_max_concurrent: null,
    });
  };

  // Wire Ingress -> Core Services
  for (const core of coreNodes) {
    addEdge(entryNode.id, core.id, true, 1.0);
  }

  // Wire Core Services -> Data & Cache Tiers
  for (const core of coreNodes) {
    for (const data of dataNodes) {
      const isCache = data.id.includes('cache') || data.id.includes('redis');
      addEdge(core.id, data.id, !isCache, isCache ? 1.5 : 1.0);
    }
  }

  // Wire Core Services -> External Gateways
  const primaryCore = coreNodes[coreNodes.length - 1] || coreNodes[0];
  if (primaryCore) {
    for (const ext of externalNodes) {
      addEdge(primaryCore.id, ext.id, false, 1.0);
    }
  }

  // 6. Assemble Full Architecture Spec
  const spec: ArchitectureSpec = {
    name: archName,
    description: `Synthesized topology for "${prompt}". Calibrated for ${baseRps} RPS with ${services.length} microservices across 4 tiers.`,
    services,
    edges,
    workload: {
      entry: entryNode.id,
      pattern: defaultPattern,
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

  // Schedule Chaos Fault on external dependency or database SPOF
  if (includeFault) {
    const faultTarget =
      externalNodes[0]?.id || dataNodes.find((d) => d.id.includes('db'))?.id || services[services.length - 1].id;

    spec.faults.push({
      id: 'ai_chaos_fault_1',
      type: 'latency',
      target: faultTarget,
      factor: 5,
      start_s: 60,
      end_s: 120,
    });
  }

  // 7. Validate Spec with Core CascadeLab Zod Schema
  const validationResult = validateArchitecture(spec);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(
      `Synthesized architecture failed internal schema validation: ${validationResult.errors?.join(', ')}`
    );
  }
  const validatedSpec = validationResult.data;

  // 8. Tiers Breakdown & Insights Summary
  const tiers: SynthesizedServiceTier[] = [
    {
      tierName: 'Tier 1: Ingress Edge',
      services: [entryNode.name || entryNode.id],
    },
    {
      tierName: 'Tier 2: Core Domain Logic',
      services: coreNodes.map((c) => c.name),
    },
    {
      tierName: 'Tier 3: Caching, Queues & Databases',
      services: dataNodes.map((d) => d.name),
    },
    {
      tierName: 'Tier 4: External Dependencies',
      services: externalNodes.map((x) => x.name),
    },
  ];

  const insights: string[] = [
    `Identified domain as "${domain}" and synthesized ${services.length} interdependent microservices.`,
    `Calibrated baseline offered load to ${baseRps} RPS using Little's Law thread balancing.`,
    includeSpof
      ? `Configured intentional single-point-of-failure database (${dataNodes[0]?.name || 'Database'}) to enable realistic chaos fault testing.`
      : `Provisioned high-availability multi-replica clustering across all data tiers.`,
    includeFault
      ? `Scheduled a 5x latency chaos surge on '${externalNodes[0]?.name || 'downstream dependency'}' at T+60s to test upstream resilience.`
      : `Clean baseline state ready for manual chaos card injection.`,
  ];

  const suggestedExperiment =
    'Run the simulation at 4x speed. Watch the 5x latency surge at T+60s trigger an unjittered retry storm, then open the AI Commander to deploy autonomous self-healing!';

  return {
    spec: validatedSpec,
    summary: {
      domain,
      architectureName: archName,
      description: spec.description || '',
      servicesCount: services.length,
      edgesCount: edges.length,
      tiers,
      insights,
      suggestedExperiment,
    },
  };
}
