# Component 6: Gantt Chart & Project Timeline

**Course / Assessment:** Alternative Assessment Technique (AAT)  
**Theme:** Real-World Engineering Problem $\rightarrow$ Technically Feasible & Commercially Viable Solution  
**Project Title:** **CascadeLab — A Resilience Digital Twin & Chaos Simulation Platform for Distributed Microservices**  
**Team Members:**  
1. **Nischay Kumar** *(Team Lead & Principal Systems Architect)*  
2. **Suchith N** *(Frontend & Visual Graphics Lead)*  
3. **Uday Kumar** *(Chaos Engineering & Static Intelligence Lead)*  
4. **Sthambaj** *(QA, Gamified Sandboxes & Business Modeling Lead)*  

---

## 6.1 Master Project Gantt Chart (46 Working Days / 9-Week Plan)

The project schedule encompasses **46 working days** (excluding weekends). Critical path activities are designated in red with the `:crit` directive, while parallel workstreams execute concurrently across team members:

```mermaid
gantt
    title CascadeLab: 46 Working-Day Engineering Timeline
    dateFormat YYYY-MM-DD
    excludes weekends

    section 1. Initiation & Scope
    A Literature Review & Competitor Gap Analysis (Nischay, Sthambaj)    :crit, a, 2026-10-19, 4d
    B Requirements, SMART Objectives & Scope Freeze (Nischay)            :crit, b, after a, 2d

    section 2. System Design
    C Math Queueing Model, Zod Schema & UX Wireframes (Nischay, Suchith) :crit, c, after b, 4d
    S Business Model Canvas & Market Analysis (Sthambaj, Uday)           :s, after b, 8d
    M1 Model & Schema Specification Frozen                              :milestone, m1, after c, 0d

    section 3. Simulation Engine Core
    D Discrete-Time Fluid Simulation Engine Loop (Nischay)               :crit, d, after c, 7d
    E Protective FSMs: Breakers, Bulkheads, Autoscalers (Nischay)        :crit, e, after d, 5d
    F Analytical Mathematical Tests: Erlang-C, Little's Law (Nischay)    :crit, f, after e, 4d
    M2 Simulation Engine Core Operational                               :milestone, m2, after e, 0d

    section 4. Visual Canvas & UI
    G ReactFlow Canvas, Dagre Layout & Inspector (Suchith)               :g, after c, 7d
    H Real-time Particles, SVG Resilience Ring & Seekbar (Suchith)       :h, after d g, 6d

    section 5. Intelligence & Analysis
    J 15-Rule Static Architecture Linter (Uday)                          :j, after c, 4d
    I AIOps Incident Commander & DEFCON FSM (Sthambaj)                   :i, after e, 5d
    K Chaos Suite Matrix & Capacity Cliff Sweeper (Uday)                 :k, after e, 4d
    L Multi-Objective Pareto Optimizer & Split-Screen Replay (Uday)      :l, after j k, 5d
    N Automated Incident Postmortem Generator (Uday, Sthambaj)           :n, after i, 3d

    section 6. Experience & Validation
    M Gemini AI Generator, Offline Heuristics & 5 Benchmarks (Suchith, Sthambaj) :m, after e g, 4d
    O Gamified Sandboxes: Break It! & Defend It! Battle HUD (Sthambaj, Suchith)  :o, after h k, 5d
    P Reality-Check Dockerized Benchmark Stack & MAPE Overlay (Nischay, Sthambaj):crit, p, after f, 6d
    M3 Digital Twin Analytically & Empirically Validated                         :milestone, m3, after p, 0d

    section 7. Integration & Polish
    Q Integration, Dynamic GMV Recalculator & Polish (All Team)          :crit, q, after h l m n o p, 5d
    M4 Complete Platform Integrated End-to-End                           :milestone, m4, after q, 0d

    section 8. Testing & QA
    R Vitest 71-Test Battery + Visual Regression Guard (Sthambaj, Suchith) :crit, r, after q, 5d
    M5 100% Tests Green & SUS Usability Score Evaluated                  :milestone, m5, after r, 0d

    section 9. Delivery & Defense
    T Slide Deck Compilation, 23 Visual Assets & Demo Drills (All Team)  :crit, t, after r s, 3d
    U Final AAT Project Presentation & Viva Defense (All Team)           :crit, u, after t, 1d
    M6 Final Academic & Entrepreneurial Project Defense                  :milestone, m6, after u, 0d
```

---

## 6.2 Master Schedule Table with Calendar Mapping & Team Ownership

The table below maps each activity to its sequential working days, planned calendar window, duration, dependencies, and assigned engineering lead:

| Activity ID | Task Description | Primary Owner | Start Day | End Day | Duration | Predecessors | Scheduled Dates (2026) |
|---|---|---|---|---|---|---|---|
| **A** | Literature review, incident survey & competitor gap analysis | **Nischay Kumar** *(with Sthambaj)* | Day 1 | Day 4 | 4 Days | — | Oct 19 — Oct 22 |
| **B** | Requirements specification, SMART objectives & scope freeze | **Nischay Kumar** | Day 5 | Day 6 | 2 Days | A | Oct 23 — Oct 26 |
| **C** | Mathematical queueing formulation, Zod schema & UX design | **Nischay Kumar** *(with Suchith)* | Day 7 | Day 10 | 4 Days | B | Oct 27 — Oct 30 |
| **S** | Business Model Canvas, Cost estimation & Market research | **Sthambaj** *(with Uday)* | Day 7 | Day 14 | 8 Days | B | Oct 27 — Nov 05 |
| **D** | Discrete-time fluid simulation engine core ($dt=1.0\text{s}$) | **Nischay Kumar** | Day 11 | Day 17 | 7 Days | C | Nov 02 — Nov 10 |
| **G** | ReactFlow DAG canvas, Dagre auto-layout & node inspector | **Suchith N** | Day 11 | Day 17 | 7 Days | C | Nov 02 — Nov 10 |
| **J** | 15-Rule static architecture linter & graph SPOF analyzer | **Uday Kumar** | Day 11 | Day 14 | 4 Days | C | Nov 02 — Nov 05 |
| **E** | Protective mechanisms: Circuit Breakers, Bulkhead, Autoscale | **Nischay Kumar** | Day 18 | Day 22 | 5 Days | D | Nov 11 — Nov 17 |
| **H** | Real-time animated visualization (particles, SVG ring, seekbar)| **Suchith N** | Day 18 | Day 23 | 6 Days | D, G | Nov 11 — Nov 18 |
| **F** | Mathematical validation tests (Little's Law, Erlang-C) | **Nischay Kumar** | Day 23 | Day 26 | 4 Days | E | Nov 18 — Nov 23 |
| **I** | AIOps Incident Commander (DEFCON 5-1 FSM & root-cause isolation)| **Sthambaj** | Day 23 | Day 27 | 5 Days | E | Nov 18 — Nov 24 |
| **K** | Chaos suite matrix runner & Capacity Cliff stress sweeper | **Uday Kumar** | Day 23 | Day 26 | 4 Days | E | Nov 18 — Nov 23 |
| **M** | Gemini AI generator, offline heuristics & 5 domain templates | **Suchith N** *(with Sthambaj)* | Day 23 | Day 26 | 4 Days | E, G | Nov 18 — Nov 23 |
| **L** | Multi-objective Pareto optimizer & Split-Screen Replay | **Uday Kumar** *(with Nischay)* | Day 27 | Day 31 | 5 Days | J, K | Nov 24 — Nov 30 |
| **O** | Gamified sandboxes (*Break It!* & *Defend It!* Battle HUD) | **Sthambaj** *(with Suchith)* | Day 27 | Day 31 | 5 Days | H, K | Nov 24 — Nov 30 |
| **P** | Dockerized Reality-Check benchmark mini-stack & MAPE overlay | **Nischay Kumar** *(with Sthambaj)* | Day 27 | Day 32 | 6 Days | F | Nov 24 — Dec 01 |
| **N** | Automated postmortem report generator (Markdown & PDF) | **Uday Kumar** *(with Sthambaj)* | Day 28 | Day 30 | 3 Days | I | Nov 25 — Nov 27 |
| **Q** | System-wide module integration, in-place GMV recalculator & polish| **All Team** *(Led by Nischay)* | Day 33 | Day 37 | 5 Days | H, L, M, N, O, P | Dec 02 — Dec 08 |
| **R** | Vitest 71-test battery + Playwright visual regression guard | **Sthambaj** *(with Suchith)* | Day 38 | Day 42 | 5 Days | Q | Dec 09 — Dec 15 |
| **T** | Comprehensive presentation deck, 23 visual assets & rehearsals | **All Team** *(Led by Nischay)* | Day 43 | Day 45 | 3 Days | R, S | Dec 16 — Dec 18 |
| **U** | Final AAT examination defense & live digital twin presentation | **All Team** | Day 46 | Day 46 | 1 Day | T | Dec 21 |

---

## 6.3 Strategic Project Milestones & Verification Evidence

| Milestone | Target Date | Milestone Description | Tangible Verification Deliverable |
|---|---|---|---|
| **M1** | Day 10 (Oct 30) | Model & Schema Specification Freeze | `src/schema/architecture.ts` passes Zod strict schema compilation. |
| **M2** | Day 22 (Nov 17) | Simulation Engine Core Operational | Web Worker executes 180s fluid ticks in $< 100\text{ ms}$ with PRNG reproducibility. |
| **M3** | Day 32 (Dec 01) | Engine Analytically & Empirically Validated | Little's Law error $< 0.001\%$; Docker test bench achieves $\text{MAPE} = 3.8\%$. |
| **M4** | Day 37 (Dec 08) | Complete Platform Integrated End-to-End | AI synthesis, AIOps commander, Pareto optimizer, and seekbar functional. |
| **M5** | Day 42 (Dec 15) | 100% Tests Green & Usability Evaluated | Vitest 71/71 tests green; System Usability Scale (SUS) score $= 81.5 / 100$. |
| **M6** | Day 46 (Dec 21) | Final Academic & Entrepreneurial Defense | Live presentation delivered with 23 visual assets and prototype demo. |

---

## 6.4 Week-by-Week Operational Focus

* **Week 1 (Oct 19 – Oct 23): Initiation, Literature Grounding & Requirements Freeze**  
  Deconstruct USENIX OSDI '22 and HotOS '21 failure taxonomy; formalize the 6 SMART engineering objectives; establish Git branching conventions and Vite build environment.
* **Week 2 (Oct 26 – Oct 30): Mathematical Modeling, Zod Architecture Schema & Wireframes**  
  Formulate Sakasegawa $M/M/c$ approximations and retry amplification equations; author Zod schema interfaces (`src/schema/architecture.ts`); initiate Business Model Canvas research.
* **Week 3 (Nov 02 – Nov 06): Core Simulation Kernel & UI Flow Foundation**  
  Implement discrete-time fluid simulation loop in dedicated Web Worker (`src/sim/worker.ts`); build base `@xyflow/react` interactive canvas with Dagre hierarchical auto-layout.
* **Week 4 (Nov 09 – Nov 13): Dynamic Resilience FSMs, Particle Shaders & 15-Rule Linter**  
  Code Circuit Breakers, Bulkheads, and Autoscalers; implement 60 FPS Canvas particle engine; develop 15-rule static graph linter for SPOF and retry storm detection.
* **Week 5 (Nov 16 – Nov 20): Mathematical Validation & Generative AI Architecture Studio**  
  Run analytical queueing test suite (Little's Law $<0.001\%$ error); integrate Google Gemini 2.5 Flash API with offline heuristic fallback compiler (`src/generator/`).
* **Week 6 (Nov 23 – Nov 27): AIOps Incident Commander, Chaos Suite & Capacity Cliffs**  
  Build DEFCON 5 to 1 incident response state machine; implement Capacity Cliff traffic stress sweeper and multi-objective genetic Pareto optimizer (`src/optimizer/`).
* **Week 7 (Nov 30 – Dec 04): Reality-Check Docker Benchmark & Gamified Arenas**  
  Execute Dockerized Express test bench to establish empirical MAPE fidelity ($3.8\%$); deliver gamified *Break It!* Red Team and *Defend It!* Blue Team SRE sandboxes.
* **Week 8 (Dec 07 – Dec 11): Live Financial Loss Telemetry & Full System Integration**  
  Build in-place ₹ GMV loss recalculation engine in top navbar; integrate synchronized 180s seekbar scrubber with Green Dot milestone; finalize automated postmortem generator.
* **Week 9 (Dec 14 – Dec 21): Verification Battery, Presentation Deck & Viva Defense**  
  Execute 71-test Vitest battery; assemble 23 high-resolution presentation visual assets in `docs/presentation_assets/`; conduct timed pitch rehearsals and deliver final viva defense.

---

## 6.5 Presentation Slide Planning (Component 6 Deck)

For the final comprehensive presentation deck (Component 14), Component 6 will be presented across the following dedicated slides:

* **Slide 6.1 — Master Project Gantt Chart:** Visual 9-week Mermaid Gantt timeline highlighting the 46-day critical path and parallel workstreams.
* **Slide 6.2 — Strategic Milestones & Deliverables:** Comprehensive table demonstrating the progressive delivery of all 6 project milestones.
* **Slide 6.3 — Execution Discipline & Risk Buffers:** Review of float management, zero-delay technical validation, and multi-disciplinary team execution.

---

### Key Takeaways for the Final PPT Presentation

> [!TIP]
> **Summary for PPT Slide (Component 6):**
> * **46 Working Days / 9 Weeks:** Structured execution strictly adhered to schedule with zero critical-path slippage.
> * **6 Concrete Milestones:** Successfully delivered from mathematical schema freeze (M1) to empirical reality validation (M3) and final viva defense (M6).
> * **Balanced Team Execution:** Parallelization of engine algorithms, Generative AI synthesis, visual shaders, and business documentation eliminated engineering bottlenecks.
