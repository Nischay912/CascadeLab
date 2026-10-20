# CascadeLab Architecture Catalog & Demo-Day Showcase

Welcome to the **CascadeLab Architecture Catalog**. This directory contains production-ready distributed microservice architectures designed for testing, chaos engineering demonstrations, live evaluations, and academic assessment.

---

## Quick Start: How to Import Into CascadeLab

1. Open **CascadeLab** in your browser.
2. In the top navigation bar, click the **"Import"** button.
3. Choose the format of your file:
   - **Docker Compose (`.yml`)**: Convert multi-container application stacks directly into a digital twin with inferred dependencies and Dagre auto-layout.
   - **CascadeLab Architecture (`.yaml`)**: Load fully specified resilience graphs with explicit queue limits, Little's Law concurrency parameters, circuit breakers, retry policies, and canvas coordinates.
4. Paste the YAML/YML content into the modal editor, or click **"Load Template"** to try the built-in switch.
5. Click **"Import & Simulate"**. The digital twin will immediately instantiate the topology and run the discrete-event simulation engine.
6. To clear or delete an imported architecture at any time, click the red **"Delete Arch"** button in the top navigation bar.

---

## Catalog Overview

### 1. Docker Compose Architectures (`examples/docker-compose/`)

| File | Fleet Size | Key Services | Primary Chaos Injection Scenario |
| :--- | :---: | :--- | :--- |
| [`01_basic_lamp_microservices.yml`](docker-compose/01_basic_lamp_microservices.yml) | 4 | `web`, `api`, `redis-cache`, `postgres-db` | Kill Redis cache to observe DB connection pool exhaustion. |
| [`02_ecommerce_storefront_fleet.yml`](docker-compose/02_ecommerce_storefront_fleet.yml) | 8 | `ingress-gateway`, `auth`, `catalog`, `cart`, `order`, `payment`, `inventory`, `notification` | Inject 400ms latency into `payment-service` to observe upstream gateway worker starvation. |
| [`03_fintech_banking_network.yml`](docker-compose/03_fintech_banking_network.yml) | 7 | `switch-gateway`, `fraud-detector`, `token-vault`, `ledger-db`, `hsm-crypto` | Simulate HSM cryptographic timeout and verify circuit breaker isolation. |
| [`04_ai_inference_pipeline.yml`](docker-compose/04_ai_inference_pipeline.yml) | 6 | `inference-gateway`, `embedder-svc`, `vector-db`, `llm-runtime`, `rag-store`, `semantic-cache` | Overload `llm-runtime` to trigger adaptive semantic cache fallback and token rate limiting. |

---

### 2. CascadeLab Resilience Specifications (`examples/`)

These architectures leverage CascadeLab's full mathematical physics model ($M/M/c$ queueing, Little's Law, adaptive load shedding, exponential backoff, and circuit breaker trip thresholds).

| File | Fleet Size | SLO Target | Steady-State Workload | Key Resilience Features |
| :--- | :---: | :---: | :---: | :--- |
| [`cascadelab_boilerplate.yaml`](cascadelab_boilerplate.yaml) | 5 | 99.5% / 500ms | 600 RPS (Constant) | **Master template**: Exhaustive documentation of all fields, autoscaling curves, and retry backoff. |
| [`paynex_fintech_switch.yaml`](paynex_fintech_switch.yaml) | 8 | 99.95% / 250ms | 500 RPS (Diurnal) | **FinTech Switch**: UPI tokenization, sub-second settlement, fallback cashbacks, and debit ledger queues. |
| [`healthcare_ehr_telehealth.yaml`](healthcare_ehr_telehealth.yaml) | 6 | 99.9% / 300ms | 400 RPS (Constant) | **HealthTech**: HIPAA audit trails, WebRTC video signaling, fallback mock EHR records during server blips. |
| [`ridehailing_dispatch_grid.yaml`](ridehailing_dispatch_grid.yaml) | 6 | 99.5% / 400ms | 650 RPS (Ramp) | **Mobility / Logistics**: H3 geospatial hexagonal indexing, dynamic surge multipliers, driver polling buffers. |
| [`video_streaming_edge.yaml`](video_streaming_edge.yaml) | 7 | 99.9% / 350ms | 550 RPS (Diurnal) | **Media & OTT**: Dynamic HLS packaging, DRM tokens, 75% CDN origin cache hit ratio, and QoS telemetry. |

---

## Verification & Compatibility

All architectures in this directory adhere strictly to:
- **CascadeLab Import Schema v1.0** (verified via `src/core/importers.ts`)
- **Docker Compose Specification v2/v3**
- **Nominal Baseline Calibration**: Every example starts in a **100% Calm Green** state at baseline traffic, ensuring clear before-and-after contrast when chaos is injected.
