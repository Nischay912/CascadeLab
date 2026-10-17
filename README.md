# 🧨 CascadeLab

### A Resilience Digital Twin for Microservices: Simulate, Explain, and Auto-Harden Cascading Failures *Before* They Hit Production

[![TypeScript](https://img.shields.io/badge/Language-TypeScript%20(Strict)-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38BDF8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/Canvas-React%20Flow-FF0072.svg)](https://reactflow.dev/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest-6E9F18.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Backend](https://img.shields.io/badge/Architecture-100%25%20Browser--Only-emerald.svg)]()
[![Cost](https://img.shields.io/badge/Infrastructure%20Cost-₹0%20(Free)-brightgreen.svg)]()

---

## ⚡ The Real Engineering Problem

Modern software (fintech, UPI/payments, quick-commerce, streaming, ride-hailing) is built from dozens of interconnected microservices. In distributed architectures, **major outages rarely begin with a fatal total crash**. Instead, they happen when a minor slowdown in one downstream dependency cascades upstream:

> A third-party payment gateway slows down by $5\times$ $\to$ the checkout service's worker threads sit waiting $\to$ upstream clients timeout and **retry** $\to$ the retries multiply traffic onto the struggling callee (a **retry storm**) $\to$ queues fill $\to$ instances crash and restart in cold loops $\to$ the entire platform collapses, and **it stays down even after the initial issue resolves** (a **metastable failure**).

Engineering teams typically discover these traps in production during high-stakes flash sales or product launches. Existing chaos engineering tools require running, risky production infrastructure, while architecture diagrams are static and say nothing about dynamic failure propagation.

**CascadeLab solves this at design time.** It is an interactive, browser-only resilience digital twin that simulates traffic surges and cascading failures, explains their root causes, and automatically finds the cheapest configuration to harden the architecture.

---

## ✨ Key Capabilities & Features

### 1. 🗺️ Visual Architecture Canvas & Digital Twin
* **Interactive Topological Canvas:** Built with React Flow and `dagre` hierarchical auto-layout. Drag, drop, connect, inspect, and tune microservice parameters.
* **Instant `docker-compose.yml` Import:** Paste standard Compose files to automatically extract services, replica counts, and `depends_on` dependencies into an interactive graph.
* **5 Pre-Built Architectures:**
  * **ShopFast (Flagship 13-service e-commerce store):** Complete topology with realistic startup anti-patterns (unbounded retries, single-instance database SPOF, missing circuit breakers).
  * **ShopFast (Hardened Reference):** Resilient version featuring jittered exponential backoffs, circuit breakers, gateway load shedding, and database replication.
  * **Ride-Hailing Fleet Dispatch:** Geospatial location ingestion, H3 spatial indexing, matcher engine, and surge pricing.
  * **Video Streaming Edge Delivery:** Global CDN edge routers, manifest generators, DRM token verification, and origin chunk storage.
  * **UPI / Payments Switch Hub:** High-throughput banking switch with remitter/beneficiary bank connectors.
  * **Quick-Commerce 10-Min Delivery:** Dark-store realtime stock reservation, rider allocation, and checkout.
* **Lossless Share-by-URL:** Compresses the full architecture topology, fault scenario, and deterministic seed into the URL hash using `lz-string`—share complete simulations with a single URL.

### 2. 🧮 Fluid Queueing Physics Simulation Engine
* **Pure TypeScript in Web Workers:** Computes multi-service queuing dynamics off the main thread at 60 ticks per minute ($dt = 1\text{ s}$), completing a 180-second batch simulation in $< 100\text{ ms}$.
* **Seeded PRNG (`mulberry32`):** 100% deterministic and reproducible. Same seed $\to$ byte-identical simulation telemetry.
* **True Cascade Propagation:** Calculates dynamic effective service times ($S_{\text{eff}}$), worker occupancy, queue buildups, and upstream capacity collapse.
* **Resilience Mechanisms Simulated:**
  * **Retry Storm Amplification:** Geometric series calculation of repeated attempts.
  * **Exponential Backoff & Jitter:** Demonstrates how jitter de-synchronizes retry waves.
  * **Circuit Breakers:** Closed $\to$ Open $\to$ Half-Open states with fast-failing traffic to relieve struggling downstream services.
  * **Load Shedding:** Early HTTP 503 drops at queue thresholds to protect goodput and preserve latency.
  * **Crash Loops & Cold Restarts:** Overloaded instances crash probabilistically $\propto (\rho - 1)$ and reboot cold.
  * **Autoscaling Lag:** Models spin-up delay ($t_{\text{startup}}$) proving autoscaling alone cannot rescue a system from sudden spikes.
  * **Cache Thundering Herd:** Cache flush faults drop hit ratios to 0%, slamming backing stores until cold caches warm up.
  * **Availability Zones:** Models multi-AZ instance distributions and simulates full zone outages.

### 3. 🔍 Design-Time Architecture Linter
* **Static Graph Rules:** Scans topologies for over 15 known resilience vulnerabilities without running a simulation:
  * Retries without backoff or jitter
  * Dangerous retry depth amplification along call paths ($> 8\times$)
  * **Timeout Inversion:** Caller timeout $<$ callee worst-case processing time (orphaned background work)
  * Missing circuit breakers on critical paths
  * Single Points of Failure (SPOFs) via graph articulation-point analysis
  * High fan-in dependencies missing bulkheads
  * Missing load shedding on entry queues

### 4. 🧠 Automated Root Cause & Metastable Failure Detection
* **Topological Root Cause Isolation:** Walks graph dependencies upstream to distinguish the genuine trigger from downstream victims.
* **Failure Pattern Classifier:** Identifies and labels incidents with evidence cards (*Retry Storm, Concurrency Exhaustion, Queue Buildup, Crash Loop, Cache Stampede, SPOF*).
* **Metastable Failure Detector:** Pinpoints situations where the system remains down after the injected fault duration has ended, explaining the self-sustaining feedback loop.

### 5. 🛡️ Auto-Harden Optimizer & Pareto Frontier
* **Multi-Objective Cost-Aware Search:** Genetic algorithm (NSGA-II Lite) balancing **Resilience Score vs. Cost (₹/month)**.
* **Interactive Pareto Curve:** Visualizes optimal trade-offs and generates concrete configuration diffs (e.g. *Add jittered backoff, add breaker to payments, gateway load shedding, +1 checkout replica, duplicate orders-db for +₹3,200/mo*).
* **Split-Screen Replay:** Replays the identical disaster side-by-side (Before vs. After) with the same seed to visually prove that the hardened configuration survives where the naive collapsed.

### 6. 🎮 Interactive Game Modes & Presentation Tools
* **"Break It!" Challenge:** Players/judges get a chaos budget to trigger faults within 30 seconds to maximize blast radius and monetary damage on a local leaderboard.
* **"Defend It!" Challenge:** Players get 90 seconds and 3 configuration tweaks during an active incident to restore the SLO, comparing their choices against the optimizer's solution.
* **NOC Mission-Control Aesthetics:** Dark theme (`#0B1020`), animated 60 FPS edge particles (Cyan = Normal, Orange = Retries, Red = Errors), and an expanding **Failure Wave** ripple.
* **Presenter Mode:** Fullscreen high-contrast projector mode with hotkeys (`Space` = Play/Pause, `R` = Reset, `1`/`2`/`3` = Speed).

### 7. 🧪 Empirical Reality Check & Validation
* **Queueing Theory Validation:** Built-in validation suite verifying Little’s Law ($< 0.001\%$ error) and matching Sakasegawa latency within $\pm 15\%$ of exact Erlang-C formulas across 32 test points.
* **Reality Check Mini-Stack:** Empirical overlay comparing CascadeLab’s mathematical predictions against a real running 4-service microservice stack under load.
* **One-Click SRE Postmortem:** Generates an industry-standard incident postmortem document (Markdown and printable PDF) with event timelines, financial impact, and prioritized action items.

---

## 📐 Mathematical Foundations

CascadeLab’s simulation engine is built on validated fluid queueing network principles:

### 1. Effective Service Time ($S_{\text{eff}}$)
When a caller service $A$ makes synchronous downstream calls to service $B$, caller worker threads remain occupied:
$$S_{\text{eff}} = S_{\text{own}} + \sum_{\text{sync edges}} p_{\text{eff}} \times \text{wait}_B$$
Where $p_{\text{eff}} = p \times (1 - \text{hit\_ratio})$.

### 2. Expected Retry Attempts (Geometric Series)
Given attempt failure probability $f$ and maximum retries $R$:
$$\text{attempts} = \sum_{k=0}^{R} f^k = \frac{1 - f^{R+1}}{1 - f}$$
When failure rate $f \to 1$, $\text{attempts} \to R + 1$.

### 3. Mean Latency ($W$) via Sakasegawa Approximation
For multi-server queues ($m = \text{instances} \times \text{concurrency}$) with utilization $\rho = \frac{\lambda}{\mu}$:
* **For $\rho < 0.98$:**
  $$W = S_{\text{eff}} \times \left(1 + \frac{\rho^{\sqrt{2(m+1)} - 1}}{m(1 - \rho)}\right)$$
* **For $\rho \ge 0.98$ (Backlog Queue Delay):**
  $$W = S_{\text{eff}} + \frac{Q}{\mu} \times 1000$$

### 4. Little's Law
$$L = \lambda \cdot W$$
Guarantees inventory balance between arrival rate $\lambda$, average system time $W$, and in-flight requests $L$.

---

## 💻 Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Core Framework** | React 19 + TypeScript (Strict) | Strict typing for mathematical safety, zero runtime bugs |
| **Bundler & Tooling** | Vite 6 | Ultra-fast HMR and ESM build pipeline |
| **Graph Visualization** | React Flow (`@xyflow/react`) | Highly customizable node/edge rendering with SVG overlays |
| **Graph Auto-Layout** | Dagre | Automated hierarchical Left-to-Right dagre graph positioning |
| **State Management** | Zustand | Lightweight, decoupled global stores with zero boilerplate |
| **Schema Validation** | Zod | Runtime schema validation for YAML, JSON, and Compose specs |
| **Styling & Theme** | Tailwind CSS | NOC mission-control aesthetic (`#0B1020`) with custom tokens |
| **Simulation Engine** | Web Workers + Mulberry32 | Deterministic fluid queueing math running off the main thread |
| **State Compression** | `lz-string` | Compact, URL-safe scenario state encoding |
| **Testing** | Vitest | Fast test runner validating queueing theory and determinism |

---

## 📁 Repository Structure

```
cascadelab/
├── data/
│   ├── templates/            # YAML architecture specifications (ShopFast, Streaming, UPI, etc.)
│   ├── demo-scenarios/       # Frozen scenario definitions for live presentations
│   └── reality-check/        # Recorded empirical telemetry from real running stacks
├── src/
│   ├── schema/               # Zod validation schemas, types, YAML & Compose importers
│   ├── sim/                  # Fluid simulation engine, PRNG, workloads, faults, math
│   ├── analysis/             # Root cause, pattern detectors, metastable failure logic
│   ├── lint/                 # 15+ static resilience rules, graph articulation points
│   ├── chaos/                # 40+ scenario generator, resilience matrix heatmap
│   ├── optimizer/            # Multi-objective genetic algorithm (NSGA-II Lite), Pareto front
│   ├── postmortem/           # SRE markdown and printable PDF generator
│   ├── viz/                  # React Flow canvas, ServiceNode, TrafficEdge, dagre layout
│   ├── ui/                   # NOC TopNav, LeftPanel, RightPanel, BottomTimeline, theme
│   ├── demo/                 # Demo Director guided script runner, Break It! & Defend It! games
│   └── state/                # Zustand stores & URL hash synchronizer
├── reality-check/            # Mini-stack (Node/Fastify/Python) and load generator script
└── tests/
    ├── unit/                 # Schema, importer, and layout tests
    └── validation/           # Little's law, Erlang-C, determinism, and retry formula tests
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js `v18.0.0` or later (tested on `v22.x`)
* npm `v9.0.0` or later

### Installation
```bash
git clone https://github.com/Nischay912/CascadeLab.git
cd CascadeLab
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Verification Test Suite
```bash
npm test
```

### Build for Production (Static Offline App)
```bash
npm run build
```
The compiled static assets in `dist/` can be deployed to GitHub Pages, Vercel, or Netlify, or opened directly from disk without internet.

---

## ⌨️ Presenter & Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Run / Pause simulation |
| `R` | Reset simulation time to $t = 0\text{ s}$ |
| `1` | Set playback speed to $1\times$ |
| `2` | Set playback speed to $4\times$ |
| `3` | Set playback speed to $16\times$ |
| `Ctrl + K` / `Cmd + K` | Open command palette |
