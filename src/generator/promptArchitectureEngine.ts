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
      'Netflix-like video streaming platform with CDN edge gateway, DRM token verifier, manifest playlist service, and S3 chunk storage.',
    description:
      'High-throughput video on demand topology with edge token validation, HLS/DASH manifest generation, and backing object chunk store.',
  },
  {
    id: 'fintech_upi',
    category: 'Fintech & Banking',
    title: 'UPI Payment Switch Hub',
    icon: 'CreditCard',
    prompt:
      'High-throughput UPI payment switch with remitter/beneficiary bank gateways, HSM encryption, and transactional ledger SPOF.',
    description:
      'Strict banking switch orchestrating dual-leg bank transfers, hardware security module crypto verification, and centralized balance ledger.',
  },
  {
    id: 'ai_pipeline',
    category: 'AI & Machine Learning',
    title: 'Multi-Agent LLM Pipeline',
    icon: 'Bot',
    prompt:
      'Multi-agent AI processing pipeline with prompt router, vector embedding database, model inference worker pool, and Redis context store.',
    description:
      'Generative AI system with RAG vector search, semantic prompt classifier, parallel inference workers, and conversational memory cache.',
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

export function detectDomainFromPrompt(prompt: string): string {
  const normalized = prompt.toLowerCase();
  if (
    normalized.includes('uber') ||
    normalized.includes('ride') ||
    normalized.includes('driver') ||
    normalized.includes('geospatial') ||
    normalized.includes('trip') ||
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
    normalized.includes('courier')
  ) {
    return 'food_delivery';
  }
  if (
    normalized.includes('netflix') ||
    normalized.includes('stream') ||
    normalized.includes('video') ||
    normalized.includes('cdn') ||
    normalized.includes('drm') ||
    normalized.includes('media')
  ) {
    return 'streaming';
  }
  if (
    normalized.includes('upi') ||
    normalized.includes('bank') ||
    normalized.includes('fintech') ||
    normalized.includes('ledger') ||
    normalized.includes('transfer')
  ) {
    return 'fintech';
  }
  if (
    normalized.includes('ai') ||
    normalized.includes('llm') ||
    normalized.includes('agent') ||
    normalized.includes('vector') ||
    normalized.includes('embedding') ||
    normalized.includes('inference')
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
    normalized.includes('multiplayer')
  ) {
    return 'gaming';
  }
  if (
    normalized.includes('shop') ||
    normalized.includes('ecommerce') ||
    normalized.includes('cart') ||
    normalized.includes('checkout')
  ) {
    return 'ecommerce';
  }
  return 'generic';
}

/**
 * Natural Language Architecture Synthesizer
 * Interprets freeform text prompts and synthesizes fully calibrated, valid ArchitectureSpec topologies.
 */
export function synthesizeArchitectureFromPrompt(
  prompt: string,
  options: PromptGeneratorOptions = {}
): SynthesizedArchitectureResult {
  const normalized = prompt.toLowerCase();
  const mode = options.mode || 'fragile_naive';
  const trafficScale = options.trafficScale || 'medium';
  const includeSpof = options.includeSpof !== false;
  const includeFault = options.includeFault !== false;

  // 1. Detect Domain & Theme
  let domain = 'Cloud Microservices';
  let archName = 'Custom Microservices Platform';
  let defaultBaseRps = 600;
  let defaultPattern: 'constant' | 'ramp' | 'spike' | 'diurnal' | 'flash_sale' = 'constant';

  if (
    normalized.includes('uber') ||
    normalized.includes('ride') ||
    normalized.includes('driver') ||
    normalized.includes('geospatial') ||
    normalized.includes('trip') ||
    normalized.includes('matching')
  ) {
    domain = 'Mobility & Ride-Hailing';
    archName = 'RideFlow: Geospatial Fleet Dispatch';
    defaultBaseRps = 800;
    defaultPattern = 'diurnal';
  } else if (
    normalized.includes('food') ||
    normalized.includes('swiggy') ||
    normalized.includes('zomato') ||
    normalized.includes('delivery') ||
    normalized.includes('restaurant') ||
    normalized.includes('courier')
  ) {
    domain = 'Quick-Commerce & Food Delivery';
    archName = 'QuickBite: Autonomous Delivery Grid';
    defaultBaseRps = 750;
    defaultPattern = 'flash_sale';
  } else if (
    normalized.includes('netflix') ||
    normalized.includes('stream') ||
    normalized.includes('video') ||
    normalized.includes('cdn') ||
    normalized.includes('drm') ||
    normalized.includes('media')
  ) {
    domain = 'Media Streaming & CDN';
    archName = 'StreamCast: Global Video Delivery';
    defaultBaseRps = 1000;
    defaultPattern = 'constant';
  } else if (
    normalized.includes('upi') ||
    normalized.includes('bank') ||
    normalized.includes('fintech') ||
    normalized.includes('ledger') ||
    normalized.includes('transfer')
  ) {
    domain = 'Fintech & Banking Switch';
    archName = 'PaySwitch: Real-Time Payment Hub';
    defaultBaseRps = 900;
    defaultPattern = 'spike';
  } else if (
    normalized.includes('ai') ||
    normalized.includes('llm') ||
    normalized.includes('agent') ||
    normalized.includes('vector') ||
    normalized.includes('embedding') ||
    normalized.includes('inference')
  ) {
    domain = 'Generative AI & LLM Systems';
    archName = 'NeuroMesh: Multi-Agent AI Pipeline';
    defaultBaseRps = 400;
    defaultPattern = 'ramp';
  } else if (
    normalized.includes('iot') ||
    normalized.includes('sensor') ||
    normalized.includes('mqtt') ||
    normalized.includes('telemetry') ||
    normalized.includes('influx')
  ) {
    domain = 'IoT & Telemetry Streaming';
    archName = 'IoTSphere: Edge Sensor Pipeline';
    defaultBaseRps = 1100;
    defaultPattern = 'ramp';
  } else if (
    normalized.includes('game') ||
    normalized.includes('gaming') ||
    normalized.includes('matchmak') ||
    normalized.includes('lobby') ||
    normalized.includes('multiplayer')
  ) {
    domain = 'Gaming & Multiplayer Grid';
    archName = 'ArenaGrid: Real-Time Matchmaking';
    defaultBaseRps = 850;
    defaultPattern = 'spike';
  } else if (
    normalized.includes('shop') ||
    normalized.includes('ecommerce') ||
    normalized.includes('cart') ||
    normalized.includes('checkout')
  ) {
    domain = 'E-Commerce & Retail';
    archName = 'ShopScale: Resilient E-Commerce';
    defaultBaseRps = 700;
    defaultPattern = 'flash_sale';
  }

  // Determine Traffic RPS
  let baseRps = defaultBaseRps;
  if (trafficScale === 'low') baseRps = Math.round(defaultBaseRps * 0.4);
  if (trafficScale === 'high') baseRps = Math.round(defaultBaseRps * 1.6);
  if (trafficScale === 'peak') baseRps = Math.round(defaultBaseRps * 2.5);

  if (normalized.includes('flash sale') || normalized.includes('surge')) {
    defaultPattern = 'flash_sale';
  }

  // 2. Synthesize Entities & Service Tiers
  const entities: ExtractedEntity[] = [];

  // Always Tier 1: Ingress Gateway
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

  // Always Auth / Security Filter
  entities.push({
    id: 'auth-service',
    name: 'Auth & Security Service',
    role: 'Token Verification & Identity Gate',
    tier: 'core',
    service_time_ms: 10,
    initial_instances: 3,
    concurrency: 40,
    queue_limit: 150,
  });

  // Domain-Specific Core Services & Caches
  if (domain === 'Mobility & Ride-Hailing') {
    entities.push(
      {
        id: 'matching-engine',
        name: 'Geospatial Matching Engine',
        role: 'H3 Spatial Driver-Rider Matcher',
        tier: 'core',
        service_time_ms: 25,
        initial_instances: 4,
        concurrency: 35,
        queue_limit: 200,
      },
      {
        id: 'trip-service',
        name: 'Trip Dispatcher Service',
        role: 'Lifecycle & State Machine Manager',
        tier: 'core',
        service_time_ms: 20,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 180,
      },
      {
        id: 'surge-cache',
        name: 'Surge Pricing Cache',
        role: 'In-Memory Demand Multiplier (Redis)',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      },
      {
        id: 'driver-location-db',
        name: 'Driver Geospatial DB',
        role: 'High-Frequency Spatial Store',
        tier: 'data',
        service_time_ms: 12,
        initial_instances: 2,
        concurrency: 60,
        queue_limit: 250,
      },
      {
        id: 'rides-db',
        name: includeSpof ? 'Rides DB (SPOF)' : 'Rides Database Cluster',
        role: 'Transactional Trip Ledger',
        tier: 'data',
        service_time_ms: 15,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 50,
        queue_limit: 200,
      },
      {
        id: 'payment-gateway',
        name: 'External Payment Gateway',
        role: 'Third-Party Bank Settlement API',
        tier: 'external',
        service_time_ms: 120,
        initial_instances: 2,
        concurrency: 100,
        queue_limit: 400,
      }
    );
  } else if (domain === 'Quick-Commerce & Food Delivery') {
    entities.push(
      {
        id: 'restaurant-service',
        name: 'Restaurant Menu Service',
        role: 'Menu Catalog & Store Availability',
        tier: 'core',
        service_time_ms: 18,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 150,
      },
      {
        id: 'order-dispatch',
        name: 'Order Dispatch Optimizer',
        role: 'Kitchen-to-Courier Routing Engine',
        tier: 'core',
        service_time_ms: 28,
        initial_instances: 4,
        concurrency: 35,
        queue_limit: 200,
      },
      {
        id: 'courier-tracker',
        name: 'Live Courier Tracker',
        role: 'GPS Fleet Tracking & ETA Ingestion',
        tier: 'core',
        service_time_ms: 15,
        initial_instances: 3,
        concurrency: 45,
        queue_limit: 200,
      },
      {
        id: 'menu-cache',
        name: 'Menu & Store Redis Cache',
        role: 'In-Memory Catalog & Item Stock',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      },
      {
        id: 'orders-db',
        name: includeSpof ? 'Orders Database (SPOF)' : 'Orders DB (Replicated)',
        role: 'Primary Relational Order Store',
        tier: 'data',
        service_time_ms: 14,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 50,
        queue_limit: 250,
      },
      {
        id: 'payment-gateway',
        name: 'Payment Provider API',
        role: 'External Payment Processor',
        tier: 'external',
        service_time_ms: 110,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 350,
      }
    );
  } else if (domain === 'Media Streaming & CDN') {
    entities.push(
      {
        id: 'drm-token-service',
        name: 'DRM Token Verifier',
        role: 'Widevine/FairPlay Token Validator',
        tier: 'core',
        service_time_ms: 12,
        initial_instances: 4,
        concurrency: 45,
        queue_limit: 180,
      },
      {
        id: 'playlist-generator',
        name: 'Manifest Playlist Service',
        role: 'Dynamic HLS/DASH Playlist Synthesizer',
        tier: 'core',
        service_time_ms: 16,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 160,
      },
      {
        id: 'recommendation-engine',
        name: 'Content Recommender',
        role: 'Personalized Feed Vector Matcher',
        tier: 'core',
        service_time_ms: 35,
        initial_instances: 3,
        concurrency: 30,
        queue_limit: 150,
      },
      {
        id: 'catalog-cache',
        name: 'Media Catalog Cache (Redis)',
        role: 'Title Metadata & Episode Cache',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 90,
        queue_limit: 300,
      },
      {
        id: 'video-chunk-store',
        name: includeSpof ? 'Origin Chunk Storage (SPOF)' : 'Origin Video Storage Cluster',
        role: 'High-Throughput Video Segment Object Store',
        tier: 'data',
        service_time_ms: 22,
        initial_instances: includeSpof ? 1 : 4,
        concurrency: 60,
        queue_limit: 300,
      },
      {
        id: 'cdn-external',
        name: 'Global Edge CDN API',
        role: 'Third-Party Edge Pop Origin Fetcher',
        tier: 'external',
        service_time_ms: 130,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 350,
      }
    );
  } else if (domain === 'Fintech & Banking Switch') {
    entities.push(
      {
        id: 'switch-router',
        name: 'UPI Switch Router',
        role: 'NPCI / ISO 8583 Message Parser',
        tier: 'core',
        service_time_ms: 14,
        initial_instances: 4,
        concurrency: 45,
        queue_limit: 200,
      },
      {
        id: 'validation-engine',
        name: 'Account & Fraud Validator',
        role: 'VPA Resolution & Risk Scoring',
        tier: 'core',
        service_time_ms: 22,
        initial_instances: 3,
        concurrency: 35,
        queue_limit: 160,
      },
      {
        id: 'hsm-crypto',
        name: 'HSM Cryptographic Service',
        role: 'PIN & Encrypted Payload Verification',
        tier: 'core',
        service_time_ms: 15,
        initial_instances: 2,
        concurrency: 40,
        queue_limit: 150,
      },
      {
        id: 'vpa-cache',
        name: 'VPA Resolution Cache',
        role: 'Fast In-Memory Identifier Mapping',
        tier: 'data',
        service_time_ms: 3,
        initial_instances: 2,
        concurrency: 90,
        queue_limit: 300,
      },
      {
        id: 'ledger-db',
        name: includeSpof ? 'Core Banking Ledger (SPOF)' : 'Distributed Transaction Ledger',
        role: 'ACID Balance Journal & Transaction DB',
        tier: 'data',
        service_time_ms: 18,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 40,
        queue_limit: 250,
      },
      {
        id: 'bank-gateway',
        name: 'Beneficiary Bank Connector',
        role: 'External Core Banking System (CBS) API',
        tier: 'external',
        service_time_ms: 150,
        initial_instances: 2,
        concurrency: 70,
        queue_limit: 350,
      }
    );
  } else if (domain === 'Generative AI & LLM Systems') {
    entities.push(
      {
        id: 'prompt-router',
        name: 'Prompt & Intent Router',
        role: 'Task Classifier & Token Counter',
        tier: 'core',
        service_time_ms: 15,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 150,
      },
      {
        id: 'inference-workers',
        name: 'Model Inference Worker Fleet',
        role: 'GPU/TPU Streaming Generation Pool',
        tier: 'core',
        service_time_ms: 65,
        initial_instances: 4,
        concurrency: 20,
        queue_limit: 120,
      },
      {
        id: 'guardrail-service',
        name: 'AI Safety & Guardrail Engine',
        role: 'Input/Output Safety & Redaction Filter',
        tier: 'core',
        service_time_ms: 20,
        initial_instances: 3,
        concurrency: 35,
        queue_limit: 150,
      },
      {
        id: 'context-cache',
        name: 'Conversation Context Cache',
        role: 'Redis Chat History & Window Buffer',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 250,
      },
      {
        id: 'vector-db',
        name: includeSpof ? 'Vector Knowledge DB (SPOF)' : 'Distributed Vector Database',
        role: 'Qdrant/Pinecone Document Embedding Store',
        tier: 'data',
        service_time_ms: 25,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 35,
        queue_limit: 180,
      },
      {
        id: 'external-foundation-model',
        name: 'External Foundation Model API',
        role: 'Upstream Commercial LLM Endpoint',
        tier: 'external',
        service_time_ms: 250,
        initial_instances: 2,
        concurrency: 50,
        queue_limit: 250,
      }
    );
  } else if (domain === 'IoT & Telemetry Streaming') {
    entities.push(
      {
        id: 'anomaly-filter',
        name: 'Anomaly Detection Filter',
        role: 'Threshold & Spurious Metric Filter',
        tier: 'core',
        service_time_ms: 14,
        initial_instances: 4,
        concurrency: 45,
        queue_limit: 200,
      },
      {
        id: 'device-registry',
        name: 'Device Registry Service',
        role: 'Provisioning & Firmware Gate',
        tier: 'core',
        service_time_ms: 18,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 150,
      },
      {
        id: 'influx-timeseries-db',
        name: includeSpof ? 'Timeseries InfluxDB (SPOF)' : 'Timeseries InfluxDB Cluster',
        role: 'High-Throughput Time-Series Metric Store',
        tier: 'data',
        service_time_ms: 12,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 60,
        queue_limit: 300,
      },
      {
        id: 'redis-state',
        name: 'Device State Redis Cache',
        role: 'Fast Last-Known-State Cache',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 250,
      },
      {
        id: 'alert-webhook-api',
        name: 'External Alert Webhook Gateway',
        role: 'PagerDuty / Opsgenie Incident Webhook',
        tier: 'external',
        service_time_ms: 120,
        initial_instances: 2,
        concurrency: 70,
        queue_limit: 300,
      }
    );
  } else if (domain === 'Gaming & Multiplayer Grid') {
    entities.push(
      {
        id: 'matchmaker-engine',
        name: 'Matchmaker Rating Engine',
        role: 'MMR & Skill-Based Player Grouping',
        tier: 'core',
        service_time_ms: 22,
        initial_instances: 4,
        concurrency: 40,
        queue_limit: 180,
      },
      {
        id: 'lobby-balancer',
        name: 'Lobby & Session Balancer',
        role: 'Instance Allocation & Server Router',
        tier: 'core',
        service_time_ms: 16,
        initial_instances: 3,
        concurrency: 45,
        queue_limit: 160,
      },
      {
        id: 'player-cache',
        name: 'Player Session Cache (Redis)',
        role: 'Active Presence & Party Tokens',
        tier: 'data',
        service_time_ms: 3,
        initial_instances: 2,
        concurrency: 90,
        queue_limit: 300,
      },
      {
        id: 'leaderboard-db',
        name: includeSpof ? 'Leaderboard Database (SPOF)' : 'Distributed Player Store',
        role: 'Persistent Rank & Profile Database',
        tier: 'data',
        service_time_ms: 15,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 50,
        queue_limit: 200,
      },
      {
        id: 'game-server-fleet',
        name: 'Dedicated Game Server Fleet API',
        role: 'Bare-Metal Unreal/Unity Match Server Nodes',
        tier: 'external',
        service_time_ms: 110,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      }
    );
  } else {
    // General / Custom Microservices Platform
    entities.push(
      {
        id: 'core-api',
        name: 'Core Application Service',
        role: 'Business Logic & Aggregator',
        tier: 'core',
        service_time_ms: 20,
        initial_instances: 3,
        concurrency: 40,
        queue_limit: 180,
      },
      {
        id: 'worker-service',
        name: 'Background Worker Fleet',
        role: 'Async Task & Event Processor',
        tier: 'core',
        service_time_ms: 25,
        initial_instances: 3,
        concurrency: 35,
        queue_limit: 160,
      },
      {
        id: 'state-cache',
        name: 'Redis State Cache',
        role: 'High-Speed In-Memory Cache',
        tier: 'data',
        service_time_ms: 4,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      },
      {
        id: 'primary-db',
        name: includeSpof ? 'Primary Relational DB (SPOF)' : 'Primary Clustered Database',
        role: 'Persistent Relational Storage',
        tier: 'data',
        service_time_ms: 15,
        initial_instances: includeSpof ? 1 : 3,
        concurrency: 45,
        queue_limit: 200,
      },
      {
        id: 'external-provider',
        name: 'External Third-Party API',
        role: 'Upstream Cloud Partner Gateway',
        tier: 'external',
        service_time_ms: 140,
        initial_instances: 2,
        concurrency: 80,
        queue_limit: 300,
      }
    );
  }

  // 3. Construct Services Array for Spec
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
      startup_delay_s: 30,
      cooldown_s: 90,
    },
    crash: {
      enabled: true,
      after_overload_s: 20,
      restart_delay_s: 30,
    },
    cost_inr_per_instance_month: e.tier === 'data' ? 5000 : 2500,
    zone_spread: ['a', 'b'],
  }));

  // 4. Construct Edges (DAG Topology)
  const edges: any[] = [];
  const entryId = 'api-gateway';

  // Entry connects to Auth
  edges.push({
    id: `${entryId}->auth-service`,
    from: entryId,
    to: 'auth-service',
    calls_per_request: 1.0,
    mode: 'sync',
    critical: true,
    timeout_ms: 300,
    retries: mode === 'hardened' ? 1 : 2,
    backoff: {
      mode: mode === 'hardened' ? ('exponential' as const) : ('none' as const),
      jitter: mode === 'hardened',
      base_delay_ms: 50,
      max_delay_ms: 500,
    },
    circuit_breaker: {
      enabled: mode === 'hardened',
      failure_rate_threshold: 0.4,
      min_calls: 10,
      open_duration_s: 15,
      probe_fraction: 0.1,
    },
    cache: { hit_ratio: 0.0, warm_time_s: 30 },
    bulkhead_max_concurrent: null,
  });

  // Entry connects to Core Services
  const coreServices = entities.filter((e) => e.tier === 'core' && e.id !== 'auth-service');
  coreServices.forEach((core, idx) => {
    edges.push({
      id: `${entryId}->${core.id}`,
      from: entryId,
      to: core.id,
      calls_per_request: idx === 0 ? 1.0 : 0.6,
      mode: 'sync',
      critical: idx === 0,
      timeout_ms: 800,
      retries: mode === 'hardened' ? 1 : 2,
      backoff: {
        mode: mode === 'hardened' ? ('exponential' as const) : ('none' as const),
        jitter: mode === 'hardened',
        base_delay_ms: 50,
        max_delay_ms: 600,
      },
      circuit_breaker: {
        enabled: mode === 'hardened',
        failure_rate_threshold: 0.4,
        min_calls: 10,
        open_duration_s: 15,
        probe_fraction: 0.1,
      },
      cache: { hit_ratio: 0.0, warm_time_s: 30 },
      bulkhead_max_concurrent: null,
    });
  });

  // Core connects to Data / Cache / External
  const dataServices = entities.filter((e) => e.tier === 'data');
  const externalServices = entities.filter((e) => e.tier === 'external');

  // Connect core services to caches and databases
  coreServices.forEach((core) => {
    // Connect to at least one data store or cache
    const targetData = dataServices.find((d) => d.id.includes('cache')) || dataServices[0];
    if (targetData) {
      edges.push({
        id: `${core.id}->${targetData.id}`,
        from: core.id,
        to: targetData.id,
        calls_per_request: 0.8,
        mode: 'sync',
        critical: !targetData.id.includes('cache'),
        timeout_ms: targetData.id.includes('cache') ? 150 : 600,
        retries: mode === 'hardened' ? 1 : 2,
        backoff: {
          mode: mode === 'hardened' ? ('exponential' as const) : ('none' as const),
          jitter: mode === 'hardened',
          base_delay_ms: 50,
          max_delay_ms: 500,
        },
        circuit_breaker: {
          enabled: mode === 'hardened',
          failure_rate_threshold: 0.4,
          min_calls: 10,
          open_duration_s: 15,
          probe_fraction: 0.1,
        },
        cache: { hit_ratio: targetData.id.includes('cache') ? 0.85 : 0.0, warm_time_s: 20 },
        bulkhead_max_concurrent: null,
      });
    }

    const targetDb = dataServices.find((d) => d.id.includes('db') || d.id.includes('store'));
    if (targetDb && targetDb.id !== targetData?.id) {
      edges.push({
        id: `${core.id}->${targetDb.id}`,
        from: core.id,
        to: targetDb.id,
        calls_per_request: 0.4,
        mode: 'sync',
        critical: true,
        timeout_ms: 800,
        retries: mode === 'hardened' ? 1 : 3, // RETRY STORM TRAP if naive!
        backoff: {
          mode: mode === 'hardened' ? ('exponential' as const) : ('none' as const),
          jitter: mode === 'hardened',
          base_delay_ms: 50,
          max_delay_ms: 600,
        },
        circuit_breaker: {
          enabled: mode === 'hardened',
          failure_rate_threshold: 0.4,
          min_calls: 10,
          open_duration_s: 15,
          probe_fraction: 0.1,
        },
        cache: { hit_ratio: 0.0, warm_time_s: 30 },
        bulkhead_max_concurrent: null,
      });
    }
  });

  // Connect last core service to external dependency
  const lastCore = coreServices[coreServices.length - 1] || coreServices[0];
  externalServices.forEach((ext) => {
    edges.push({
      id: `${lastCore.id}->${ext.id}`,
      from: lastCore.id,
      to: ext.id,
      calls_per_request: 1.0,
      mode: 'sync',
      critical: true,
      timeout_ms: 1200,
      retries: mode === 'hardened' ? 1 : 2,
      backoff: {
        mode: mode === 'hardened' ? ('exponential' as const) : ('none' as const),
        jitter: mode === 'hardened',
        base_delay_ms: 100,
        max_delay_ms: 1000,
      },
      circuit_breaker: {
        enabled: mode === 'hardened',
        failure_rate_threshold: 0.35,
        min_calls: 10,
        open_duration_s: 20,
        probe_fraction: 0.1,
      },
      cache: { hit_ratio: 0.0, warm_time_s: 30 },
      bulkhead_max_concurrent: null,
    });
  });

  // 5. Scheduled Fault (For immediate Chaos Testing)
  const faults: any[] = [];
  if (includeFault && externalServices.length > 0) {
    faults.push({
      id: `f_latency_${externalServices[0].id}`,
      type: 'latency',
      target: externalServices[0].id,
      factor: 5.0,
      start_s: 60,
      end_s: 120,
    });
  }

  // 6. Complete Spec Assembly
  const rawSpec = {
    name: archName,
    description: `Synthesized topology for "${prompt}". Calibrated for ${baseRps} RPS with ${entities.length} microservices across 4 tiers.`,
    slo: {
      success_pct: 99.0,
      p95_ms: 600,
    },
    value_per_request_inr: 50,
    services,
    edges,
    workload: {
      entry: entryId,
      pattern: defaultPattern,
      base_rps: baseRps,
      multiplier: defaultPattern === 'flash_sale' ? 2.5 : 1.5,
      duration_s: 180,
      ramp_time_s: 30,
    },
    faults,
    seed: 42,
  };

  // Validate against Zod schema
  const validation = validateArchitecture(rawSpec);
  if (!validation.success || !validation.data) {
    throw new Error(
      `Synthesized topology schema validation failed: ${validation.errors?.join(', ')}`
    );
  }

  // 7. Synthesized Metadata & Insights
  const tiers: SynthesizedServiceTier[] = [
    {
      tierName: 'Tier 1: Ingress Edge',
      services: entities.filter((e) => e.tier === 'ingress').map((e) => e.name),
    },
    {
      tierName: 'Tier 2: Core Domain Logic',
      services: entities.filter((e) => e.tier === 'core').map((e) => e.name),
    },
    {
      tierName: 'Tier 3: Caching, Queues & Databases',
      services: entities.filter((e) => e.tier === 'data').map((e) => e.name),
    },
    {
      tierName: 'Tier 4: External Dependencies',
      services: entities.filter((e) => e.tier === 'external').map((e) => e.name),
    },
  ];

  const insights: string[] = [
    `Identified domain as "${domain}" and synthesized ${entities.length} interdependent microservices.`,
    `Calibrated baseline offered load to ${baseRps} RPS using Little's Law thread balancing.`,
    includeSpof
      ? `Configured intentional single-point-of-failure database (${entities.find((e) => e.name.includes('SPOF'))?.name || 'Primary DB'}) to enable realistic chaos fault testing.`
      : 'Configured high-availability multi-instance databases.',
    externalServices.length > 0
      ? `Scheduled a 5x latency chaos surge on external provider '${externalServices[0].name}' at T+60s to test upstream resilience.`
      : 'Configured nominal baseline operation.',
  ];

  const suggestedExperiment =
    mode === 'fragile_naive'
      ? `Run the simulation at 4x speed. Watch the 5x latency surge at T+60s trigger an unjittered retry storm, then open the AI Commander to deploy autonomous self-healing!`
      : `Test this pre-hardened architecture against the chaos suite. Verify that circuit breakers isolate failures while keeping SLO above 99%.`;

  return {
    spec: validation.data,
    summary: {
      domain,
      architectureName: archName,
      description: rawSpec.description,
      servicesCount: services.length,
      edgesCount: edges.length,
      tiers,
      insights,
      suggestedExperiment,
    },
  };
}
