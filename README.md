# 🧨 CascadeLab

> **A Resilience Digital Twin for Microservices: Simulate, Explain and Auto-Harden Cascading Failures *Before* They Hit Production.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-green.svg)](https://vitest.dev/)
[![Zero Backend](https://img.shields.io/badge/Backend-None%20(100%25%20Browser)-brightgreen.svg)]()
[![Cost](https://img.shields.io/badge/Cash%20Cost-₹0-success.svg)]()

---

## ⚡ What is CascadeLab?

Modern software architectures (fintech, e-commerce, streaming, ride-hailing) are distributed networks of interdependent microservices. Most severe outages are **not caused by a single service crashing**—they occur when a minor slowdown in an external dependency cascades, multiplying load through retries, exhausting worker threads, and triggering **metastable failures** that keep the entire system down even after the initial issue resolves.

**CascadeLab** is a zero-infrastructure, browser-based resilience digital twin that enables software engineers to:
1. **Model** distributed microservice topologies via interactive visual canvas, YAML, or `docker-compose.yml`.
2. **Lint** designs for over 15 known resilience anti-patterns (retry storm traps, SPOFs, timeout inversions).
3. **Simulate** flash sales, dependency slowdowns, and network partitions with true queueing-theory physics.
4. **Visualize** cascading failures in real-time with an animated NOC-style dark dashboard (normal cyan vs. violent orange retry floods).
5. **Auto-Harden** architectures using a multi-objective cost-aware optimizer that outputs an exact diff and Pareto frontier (Score vs ₹/month).
6. **Replay & Prove** resilience improvements side-by-side with identical deterministic seeds.
7. **Validate** predictions against both analytical models (Little's Law, Erlang-C) and empirical real-stack measurements.

---

## 🛠️ Development & Build Status

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | **Skeleton:** Tooling, design tokens, NOC shell, empty states, CI tests | ✅ Complete |
| **Phase 1** | **Schema & Templates:** Zod schemas, 5 architecture templates, URL-hash state | ⏳ Up Next |
| **Phase 2** | **Engine Core:** Deterministic Web Worker, fluid queueing model, seeded PRNG | ⏳ Planned |
| **Phase 3** | **Mechanisms:** Retries, jittered backoff, circuit breakers, autoscaling, cache | ⏳ Planned |
| **Phase 4** | **Visualisation:** Particles, Failure Wave animation, metrics sparklines | ⏳ Planned |
| **Phase 5** | **Architecture Linter:** 15+ static resilience rules & SPOF articulation graph | ⏳ Planned |
| **Phase 6** | **Analysis:** Root cause, pattern classification, metastable detector | ⏳ Planned |
| **Phase 7** | **Chaos Suite:** 40+ failure permutations, resilience matrix heatmap | ⏳ Planned |
| **Phase 8** | **Auto-Harden:** Cost-aware genetic optimizer, Pareto front, split-screen replay | ⏳ Planned |
| **Phase 9** | **Postmortem & Export:** Auto-generated SRE incident postmortem (Markdown/PDF) | ⏳ Planned |
| **Phase 10** | **Experience:** Demo Director, "Break It!" & "Defend It!" interactive games | ⏳ Planned |
| **Phase 11** | **Reality Check:** Real mini-stack vs simulator predicted metrics overlay | ⏳ Planned |
| **Phase 12** | **Hardening:** Offline build, performance verification, accessibility | ⏳ Planned |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v22+`
- npm `v9+` or `v11+`

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 🎮 Keyboard Shortcuts
- `Space`: Run / Pause simulation
- `R`: Reset simulation to $t = 0$
- `1` / `2` / `3`: Set playback speed to $1\times$, $4\times$, or $16\times$
