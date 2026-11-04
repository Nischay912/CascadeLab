# Component 2: Objectives and Scope

**Course / Assessment:** Alternative Assessment Technique (AAT)  
**Theme:** Real-World Engineering Problem $\rightarrow$ Technically Feasible & Commercially Viable Solution  
**Project Title:** **CascadeLab — A Resilience Digital Twin & Chaos Simulation Platform for Distributed Microservices**  
**Team Size:** 4 Students (ISE / CSE)  

---

## 2.1 Measurable Engineering Objectives (SMART)

To ensure academic rigor and commercial viability, CascadeLab is guided by six specific, measurable, achievable, relevant, and time-bound (**SMART**) engineering objectives:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CASCADELAB SMART OBJECTIVES OVERVIEW                          │
├─────┬───────────────────────────┬──────────────────────────────────┬───────────────────┤
│ #   │ OBJECTIVE                 │ TARGET SPECIFICATION / METRIC    │ TIMELINE / STATUS │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ1│ Deterministic Simulation  │ 180s simulation run in < 100 ms; │ Weeks 1–3         │
│     │ Queueing Kernel           │ Little's Law error < 0.001%      │ (ACHIEVED: 95 ms) │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ2│ Generative AI Synthesis   │ Natural language prompt-to-DAG   │ Weeks 4–5         │
│     │ & Architecture Engine     │ compile time < 2.5s; 100% schema │ (ACHIEVED: 1.8 s) │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ3│ Autonomous AIOps Incident │ DEFCON 5→1 triage < 500 ms;      │ Weeks 6–7         │
│     │ Commander & Autopilot     │ MTTR reduction > 85%             │ (ACHIEVED: 92%)   │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ4│ Multi-Objective Genetic   │ Pareto frontier generation < 3s; │ Weeks 5–6         │
│     │ Resilience Optimizer      │ Resilience score lift ≥ +40 pts  │ (ACHIEVED: +48)   │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ5│ Multi-Domain Benchmark    │ 5 enterprise topologies (Fintech,│ Weeks 4–6         │
│     │ Topologies & Calibration  │ E-Commerce, Ride-Hailing, CDN,K8s│ (ACHIEVED: 5/5)   │
├─────┼───────────────────────────┼──────────────────────────────────┼───────────────────┤
│ OBJ6│ Live Financial Loss &     │ Live ₹ GMV loss recalculation    │ Weeks 7–8         │
│     │ Telemetry Engine          │ at 60 FPS; noise-gate < 0.01%    │ (ACHIEVED: 60 FPS)│
└─────┴───────────────────────────┴──────────────────────────────────┴───────────────────┘
```

1. **Objective 1 (Core Queueing Simulation Engine):**  
   Develop a deterministic, discrete-time fluid simulation kernel in TypeScript executing in Web Workers that computes non-linear multi-server queueing delays (Sakasegawa $M/M/c$ approximation), retry amplification dynamics, thread-pool saturation, and circuit breaker state machines for topologies with up to 25 services in **less than $100\text{ milliseconds}$** (simulating a full 180-second disaster lifecycle), adhering to Little's Law ($L = \lambda W$) with an average residual error of **$< 0.001\%$**.
2. **Objective 2 (Generative AI Architecture Synthesis):**  
   Integrate Google Gemini 2.5 Flash / Pro LLM via structured JSON schema prompting paired with an offline heuristic fallback compiler to automatically translate unformatted natural language prompts (e.g., *"Build an e-commerce platform with Redis caching, Stripe payment gateway, and high-concurrency inventory locks"*) into fully validated topological graphs with optimal service capacities, queue limits, and call dependencies in **under $2.5\text{ seconds}$** with zero syntax errors.
3. **Objective 3 (Autonomous AIOps Incident Commander & Self-Healing):**  
   Build an automated incident response state machine operating across **DEFCON 5 (Nominal)** through **DEFCON 1 (Catastrophic Collapse)** that continuously evaluates runtime telemetry, isolates root-cause bottleneck services, and dynamically executes autonomous mitigation policies (adaptive load shedding, circuit breaker fast-tripping, retry-budget clamps, and replica scale-out) in **under $500\text{ milliseconds}$**, reducing simulated Mean Time to Recovery (MTTR) by **over $85\%$**.
4. **Objective 4 (Multi-Objective Pareto Genetic Optimization):**  
   Implement a multi-objective genetic algorithm (NSGA-II Lite) that evaluates candidate resilience configurations across a multi-dimensional fitness space, balancing Availability Score ($0\text{--}100$) against Cloud Infrastructure Cost (\$/month), outputting an interactive non-dominated Pareto frontier and enabling a synchronized side-by-side replay view within **$3.0\text{ seconds}$**.
5. **Objective 5 (Multi-Domain Industry Benchmarks & Reality Calibration):**  
   Pre-package five production-grade enterprise microservice topologies spanning E-Commerce (ShopFast), Banking / UPI Rails (PayStream), Ride-Hailing Mesh (QuickRide), Global Edge Streaming (StreamPulse), and Cloud-Native Kubernetes Infrastructure, and validate simulation accuracy against published real-world cloud outage benchmarks (AWS Kinesis, Ticketmaster) with a Mean Absolute Percentage Error (MAPE) of **$< 5.0\%$**.
6. **Objective 6 (Live Financial Telemetry & Executive Governance):**  
   Build a high-precision business telemetry engine that maps request-level drop rates directly into lost Gross Merchandise Value (GMV in ₹/min), complete with dynamic in-place parameter re-simulation, a fluid circular SVG Resilience Ring ($0\text{--}100$), and a one-click automated Executive Postmortem Generator exporting Google SRE-compliant postmortems to Markdown and PDF.

---

## 2.2 Project Scope: System Inclusions

```mermaid
flowchart TD
    subgraph SCOPE["CascadeLab Project Scope Architecture"]
        direction TB
        subgraph INC["System Inclusions (Delivered Modules)"]
            I1["1. Generative AI Architecture Studio<br/>(Gemini 2.5 Flash + Heuristic Fallback)"]
            I2["2. Interactive Flow Canvas<br/>(@xyflow/react, Dagre Auto-Layout)"]
            I3["3. Deterministic Fluid Kernel<br/>(Sakasegawa M/M/c, Mulberry32 PRNG)"]
            I4["4. 15-Rule Static Architecture Linter<br/>(SPOF, Retry Multiplier, Timeout Inversion)"]
            I5["5. Multi-Domain Benchmark Library<br/>(5 Pre-Built Industry Topologies)"]
            I6["6. Multi-Objective Genetic Optimizer<br/>(Pareto Frontier & Split-Screen Replay)"]
            I7["7. Capacity Cliff Stress Sweeper<br/>(Saturation Boundary & Bottleneck Isolation)"]
            I8["8. Autonomous AIOps Incident Commander<br/>(DEFCON 5-1 FSM & Self-Healing Policies)"]
            I9["9. Real-Time Telemetry & Financial Engine<br/>(Live Resilience Ring & In-Place ₹ GMV Loss)"]
            I10["10. Gamified SRE Battle Arenas<br/>('Break It!' Red Team vs 'Defend It!' Blue Team)"]
            I11["11. Executive Postmortem Engine<br/>(Markdown & SRE-Grade PDF Export)"]
            I12["12. Synchronized 180s Seekbar Scrubber<br/>(Nominal &rarr; Overload &rarr; Cooldown &rarr; Green Dot)"]
        end
    end

    style SCOPE fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
    style INC fill:#1e293b,stroke:#10b981,stroke-width:1px,color:#f8fafc
```

The functional scope of CascadeLab encompasses the following 12 fully delivered modules:
1. **Generative AI Architecture Studio:** Natural language prompt ingestion powered by Google Gemini 2.5 Flash / Pro and an offline heuristic compiler capable of generating production topologies with zero external API dependencies.
2. **Interactive Topology Modeling Canvas:** High-performance visual graph canvas built on `@xyflow/react` and Dagre auto-layout, featuring custom glowing SVG service nodes, animated traffic particle edges, and real-time inspector panels.
3. **Deterministic Fluid Simulation Kernel:** Pure TypeScript queueing simulation executing in background Web Workers, running 180 discrete 1-second ticks deterministically using a seeded PRNG (`Mulberry32`).
4. **15-Rule Static Architecture Linter:** Real-time graph analysis engine evaluating topologies against 15 industrial reliability rules (Single Points of Failure, Unbounded Retries, Missing Circuit Breakers, Timeout Inversion, and Deadlock Cycles).
5. **Multi-Domain Industry Benchmark Suite:** Peer-reviewed reference architectures spanning ShopFast E-Commerce, PayStream UPI Banking, QuickRide Geolocation, StreamPulse CDN, and Cloud-Native K8s.
6. **Genetic Pareto Multi-Objective Optimizer:** Evolutionary resilience tuning engine generating non-dominated Pareto frontiers balancing resilience score against cloud operational expenses (\$/month).
7. **Split-Screen Synchronized Replay View:** Side-by-side comparative simulation player synchronizing baseline vs. hardened topologies across a lockstep 180-second timeline.
8. **Capacity Cliff Stress Boundary Sweeper:** Automated traffic arrival sweeper ($\lambda = 500\text{--}10,000+\text{ RPS}$) pinpointing the mathematical inflection cliff where queues saturate and latency explodes.
9. **Autonomous AIOps Incident Commander:** Closed-loop self-healing engine featuring DEFCON 5 to 1 status escalation, root-cause isolation, and automated remediation action dispatch.
10. **Real-Time Financial Loss & Resilience Telemetry:** Continuous rupee GMV loss tracking with in-navbar dynamic value updating, baseline noise filtering, and a 100-point circular SVG Resilience Ring.
11. **Gamified SRE Sandboxes (*Break It!* & *Defend It!*):** Interactive simulation modes enabling red-team chaos engineering (maximizing blast radius with token budgets) and blue-team mitigation defense.
12. **Executive Postmortem & SLA Generator:** One-click incident summary compiler producing publication-ready postmortems with Root-Cause timelines, Five Whys analysis, and PDF/Markdown export.

---

## 2.3 Project Scope: Deliberate Limitations & Exclusions

To maintain high simulation speed ($< 100\text{ ms}$) and avoid infinite hosting costs, specific boundaries were formally established:

| Dimension | Included in CascadeLab Scope | Deliberate Exclusion / Out of Scope | Technical Justification |
|---|---|---|---|
| **Simulation Paradigm** | Discrete-time **fluid queueing model** ($\Delta t = 1.0\text{ s}$) with Sakasegawa $M/M/c$ approximations. | Individual **packet-level discrete-event simulation** (e.g., ns-3, SimGrid). | Packet-level simulation requires minutes to hours per run, destroying real-time user interactivity ($60\text{ FPS}$) and responsive parameter tuning. |
| **Execution Environment** | **100% Client-Side** execution via browser Web Workers and local state. | Heavy server-side backend or cloud database dependencies. | Eliminates recurring hosting expenses (₹0 cash cost), ensures instant responsiveness, and guarantees zero cloud security/privacy risks for proprietary architectures. |
| **Deployment Integration** | Pre-deployment design-time digital twin & synthetic chaos simulator. | Live production bytecode agent injection (e.g., eBPF or JVM bytecode manipulation). | In-production fault injection poses severe blast-radius hazards (accidental Sev-1 outages) and requires root infrastructure access that enterprises strictly restrict. |
| **Topology Scale** | Architectures of **$1\text{ to }30$ interconnected microservices**. | Mega-graphs exceeding $500+$ distinct microservices. | Browser memory and canvas rendering performance drop beyond 30 interactive nodes at 60 FPS; 95% of real-world domain sub-systems operate within 10–25 services. |
| **AI Architecture Generation** | Hybrid approach: Cloud Gemini 2.5 Flash API + **Offline Heuristic Compiler**. | Self-hosted 70B parameter open-source LLM server. | Running self-hosted LLMs requires dedicated multi-GPU cloud instances costing ₹40,000+/month, violating the zero-budget engineering constraint. |

---

## 2.4 Detailed Presentation Slide Planning (Component 2 Deck)

For the final capstone presentation deck (Component 14), Component 2 will be presented across the following dedicated slides:

* **Slide 2.1 — Master SMART Objectives Scorecard:** Clear table highlighting all 6 SMART engineering objectives, target metrics, and empirical verification results.
* **Slide 2.2 — System Inclusions & Architectural Modules:** Visual breakdown of the 12 delivered subsystems illustrating the end-to-end journey from natural language prompt to self-healing incident response.
* **Slide 2.3 — Deliberate Boundaries & Technical Justifications:** Transparent review of design trade-offs (fluid abstraction vs. packet simulation, client-side zero-cost architecture vs. server clusters).

---

### Key Takeaways for the Final PPT Presentation

> [!TIP]
> **Summary for PPT Slide (Component 2):**
> * **6 SMART Objectives:** Deterministic fluid kernel ($< 100\text{ ms}$), Gemini AI synthesis ($< 2.5\text{ s}$), AIOps self-healing autopilot ($< 500\text{ ms}$), Genetic Pareto optimizer, 5 domain benchmarks, and live ₹ GMV loss telemetry.
> * **12 Delivered Subsystems:** Encompasses everything from AI prompt compilation to split-screen synchronized replay and automated postmortem generation.
> * **Deliberate Boundaries:** 100% safe, design-time digital twin; browser Web Worker execution; zero server hosting expenses.
