const fs = require('fs');
const path = require('path');

const slides = [
  {
    id: 1,
    pmeCategory: "PROJECT MANAGEMENT & ENTREPRENEURSHIP (PME) • AAT PROJECT PROPOSAL",
    title: "CascadeLab",
    subtitle: "A Resilience Digital Twin & Chaos Simulation Platform for Distributed Microservices",
    glanceSummary: "<strong>Team of 4 Students (Dept. of ISE)</strong> | Zero-Cost Client-Side Digital Twin | Live in Production at <strong>cascade-lab.vercel.app</strong>",
    badges: [
      { text: "Live in Production: cascade-lab.vercel.app", color: "cyan" },
      { text: "Team Size: 4 Students (Dept. of ISE)", color: "emerald" },
      { text: "100% Client-Side / Zero Cloud Compute Cost", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text"><span class="point-pill pill-cyan">PME THEME</span> Real-World Problem &rarr; Viable Engineering Solution</span>
          </div>
          <div class="card-desc">
            Modern cloud architectures run on hundreds of microservices, yet their greatest vulnerability is <strong class="text-crimson">non-linear cascading failure</strong>. We engineered a browser-native digital twin that solves this multi-billion dollar crisis with zero infrastructure cost.
          </div>
        </div>

        <div class="team-grid">
          <div class="roster-card">
            <div class="roster-role text-cyan">Full-Stack Systems & Simulation Architect</div>
            <div class="roster-name">Nischay Kumar</div>
            <div class="roster-duty">End-to-End Platform Core, Fluid Queueing Kernel & Discrete-Time Simulation Engine</div>
          </div>
          <div class="roster-card">
            <div class="roster-role text-emerald">Frontend & AI Graphics Lead</div>
            <div class="roster-name">Suchith N</div>
            <div class="roster-duty">Interactive React Flow Canvas, 3D Holographic Visuals & Responsive UI</div>
          </div>
          <div class="roster-card">
            <div class="roster-role text-purple">Chaos & Static Intelligence Lead</div>
            <div class="roster-name">Uday Kumar</div>
            <div class="roster-duty">Microservice Linter Rules, Gamified SRE Arenas & Postmortem Generator</div>
          </div>
          <div class="roster-card">
            <div class="roster-role text-amber">AIOps & Business Modeling Lead</div>
            <div class="roster-name">Sthambaj</div>
            <div class="roster-duty">Autonomous DEFCON Commander, Business Model Canvas & Live ₹ GMV Telemetry</div>
          </div>
        </div>

        <div class="stat-grid" style="margin-top: 4px; margin-bottom: 0;">
          <div class="stat-card stat-cyan">
            <div class="stat-num text-cyan">&lt; 100 ms</div>
            <div class="stat-label">Sub-Second 180s Simulation Kernel</div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-num text-purple">1.8 s</div>
            <div class="stat-label">Gemini AI Prompt-to-DAG Synthesis</div>
          </div>
          <div class="stat-card stat-emerald">
            <div class="stat-num text-emerald">₹0</div>
            <div class="stat-label">Cloud Backend Hosting & Compute Cost</div>
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/01_title_digital_twin_cover.jpg", label: "Figure 1.1: 3D Holographic Resilience Digital Twin Concept" },
      { src: "assets/01_baseline_nominal_dashboard.png", label: "Figure 1.2: Production Baseline Dashboard at 100% Health" }
    ],
    speakerNotes: "Welcome respected evaluators and professors. Today our team—Nischay, Suchith, Uday, and Sthambaj—is presenting CascadeLab, our Alternative Assessment Technique project for Project Management & Entrepreneurship. Modern cloud architectures run on hundreds of decoupled microservices, but their greatest vulnerability is non-deterministic cascading failure. We engineered a 100% client-side digital twin deployed live at cascade-lab.vercel.app that solves this multi-billion dollar crisis with zero server overhead."
  },
  {
    id: 2,
    pmeCategory: "COMPONENT 1 • REAL-WORLD PROBLEM IDENTIFICATION",
    title: "The $300,000/Hour Crisis",
    subtitle: "The Physical Anatomy of Cascading & Metastable Failures in Distributed Cloud",
    glanceSummary: "<strong>74% of major outages</strong> are initiated by tiny benign blips. Retries multiply load by <strong>64&times;</strong>, burning <strong>₹3 to ₹5 Crores/hr</strong> in Indian e-commerce.",
    badges: [
      { text: "USENIX OSDI '22 Grounded", color: "crimson" },
      { text: "74% Benign Triggers", color: "amber" },
      { text: "Gartner: $5,600 / Minute", color: "purple" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-crimson">
          <div class="stat-num text-crimson">74%</div>
          <div class="stat-label">Outages Initiated by Benign Blips (DB jitter, GC pause) [USENIX '22]</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="stat-num text-amber">64&times;</div>
          <div class="stat-label">Unbounded Retry Storm Multiplier (3-Tier Call Chain)</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">$5,600</div>
          <div class="stat-label">Average Enterprise IT Downtime Cost per Minute (Gartner)</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">FAILURE DYNAMICS</span> Geometric Retry Storm Amplification</span>
            <span class="code-pill">T_total = (R + 1)^depth</span>
          </div>
          <div class="card-desc">
            When a downstream database experiences transient jitter, upstream microservices trigger uncoordinated retries. In a 3-tier deep call chain with 3 retries each, load amplifies geometrically by <strong class="text-crimson">64&times;</strong>, instantly swamping thread pools.
          </div>
          <!-- Animated SVG Retry Storm Flow -->
          <div class="anim-storm-box">
            <svg class="storm-flow-svg" viewBox="0 0 540 45">
              <!-- Tier Nodes -->
              <rect x="10" y="8" width="80" height="28" rx="6" fill="#0B132B" stroke="#38BDF8" stroke-width="1.5" />
              <text x="50" y="25" fill="#38BDF8" font-size="10" font-family="monospace" text-anchor="middle" font-weight="700">Client: 1&times;</text>

              <line x1="90" y1="22" x2="135" y2="22" stroke="#38BDF8" stroke-width="1.5" />
              <circle class="anim-packet p1" cx="90" cy="22" r="3" fill="#38BDF8" />

              <rect x="135" y="8" width="95" height="28" rx="6" fill="#0B132B" stroke="#38BDF8" stroke-width="1.5" />
              <text x="182" y="25" fill="#FFFFFF" font-size="10" font-family="monospace" text-anchor="middle">Gateway: 4&times;</text>

              <line x1="230" y1="22" x2="280" y2="22" stroke="#F59E0B" stroke-width="1.5" />
              <circle class="anim-packet p2" cx="230" cy="22" r="3.5" fill="#F59E0B" />

              <rect x="280" y="8" width="100" height="28" rx="6" fill="#0B132B" stroke="#F59E0B" stroke-width="1.5" />
              <text x="330" y="25" fill="#F59E0B" font-size="10" font-family="monospace" text-anchor="middle">Orders: 16&times;</text>

              <line x1="380" y1="22" x2="430" y2="22" stroke="#EF4444" stroke-width="2" />
              <circle class="anim-packet p3" cx="380" cy="22" r="4" fill="#EF4444" />

              <rect x="430" y="8" width="100" height="28" rx="6" fill="#200B10" stroke="#EF4444" stroke-width="2" />
              <text x="480" y="25" fill="#EF4444" font-size="10" font-family="monospace" text-anchor="middle" font-weight="800">DB: 64&times; COLLAPSE</text>
            </svg>
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">THE TRAP</span> The Permanent Metastable Failure State</span>
          </div>
          <div class="card-desc">
            Even after the original database blip resolves, internal retry feedback loops keep queue wait times near infinity. The cluster remains trapped at <strong class="text-amber">100% CPU utilization and 0% goodput</strong>, requiring catastrophic hard restarts.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">INDIAN CONTEXT</span> Festive Flash Sales & UPI Checkout Paralysis</span>
          </div>
          <div class="card-desc">
            During Diwali, Big Billion Days, and Great Indian Festival flash sales, cascading payment timeouts cost Indian e-commerce platforms <strong class="text-emerald">₹3 to ₹5 Crores/hour</strong> in unrecoverable lost Gross Merchandise Value (GMV).
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/02_cascading_failure_retry_storm.jpg", label: "Figure 2.1: 3D Conceptualization of a Retry Storm Wave" },
      { src: "assets/02_mid_cascade_failure_wave.png", label: "Figure 2.2: Red Collapse Wave Propagating Backwards in UI" }
    ],
    speakerNotes: "Slide 2 covers Component 1: Problem Identification. As proven by USENIX OSDI 2022 research, 74% of catastrophic cloud outages are not caused by hardware fires or cyberattacks, but by tiny benign blips like a 50ms database jitter. When downstream services hesitate, upstream services aggressively retry without backoff. In a 3-tier architecture, this geometric retry storm multiplies incoming traffic by 64 times, trapping the system in a metastable failure loop. In the Indian market, this causes 3 to 5 Crores per hour in lost sales."
  },
  {
    id: 3,
    pmeCategory: "COMPONENT 1 & 12 • EXISTING LIMITATIONS & MARKET GAPS",
    title: "Why Existing Tools Fail",
    subtitle: "Testing in Production is Russian Roulette — The 5 Critical Industry Gaps",
    glanceSummary: "<strong>Live chaos has catastrophic blast radius</strong>. Staging costs ₹25L/yr with 5% fidelity. APMs alert <em>after</em> crashes. CascadeLab is <strong>100% risk-free</strong>.",
    badges: [
      { text: "Gremlin: High Blast Radius", color: "crimson" },
      { text: "Staging: ₹25L/yr Blindspot", color: "amber" },
      { text: "CascadeLab: 100% Risk-Free", color: "emerald" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">GAP 1</span> Live Production Chaos (Gremlin, Chaos Mesh)</span>
            <span class="text-sm text-crimson font-mono font-bold">UNACCEPTABLE BLAST RADIUS</span>
          </div>
          <div class="card-desc">
            Injecting network delays into live production creates immense financial and SLA risk. Enterprises strictly forbid production testing during peak revenue quarters.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">GAP 2</span> Sterilized Staging Environments</span>
            <span class="text-sm text-amber font-mono font-bold">₹15–25 LAKHS/YR WASTED</span>
          </div>
          <div class="card-desc">
            Staging clusters run at only 5% production scale with synthetic cold caches. They completely fail to simulate non-linear queue saturation and capacity cliffs.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">GAP 3</span> Retrospective APMs (Datadog, Dynatrace)</span>
            <span class="text-sm text-purple font-mono font-bold">PURELY REACTIVE FIRE-FIGHTING</span>
          </div>
          <div class="card-desc">
            APMs alert engineers <em class="text-white">after</em> the outage has already destroyed user sessions, inundating teams with thousands of noisy alerts (alert fatigue).
          </div>
        </div>

        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">GAP 4</span> Architecture Modeling Friction</span>
            <span class="text-sm text-cyan font-mono font-bold">DAYS OF MANUAL YAML WRITING</span>
          </div>
          <div class="card-desc">
            Manually transcribing 15 microservices with queues and retries takes days. No existing tool compiles natural language descriptions into valid topologies.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">GAP 5</span> Financial Telemetry Blindness</span>
            <span class="text-sm text-emerald font-mono font-bold">ABSTRACT METRICS VS ₹ GMV</span>
          </div>
          <div class="card-desc">
            Existing tools report abstract CPU% and p99 latency without translating technical downtime into real-time lost revenue in Indian Rupees (₹ GMV).
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/03_chaos_break_vs_defend_arena.jpg", label: "Figure 3.1: Chaos Engineering Arena: Red Team vs Blue Team" },
      { src: "assets/03_service_inspector_linter.png", label: "Figure 3.2: Topological Root-Cause Back-Tracing Drawer" }
    ],
    speakerNotes: "Slide 3 highlights Component 1 limitations and Component 12 competitive landscape. Why can't current tools solve this? First, Chaos Engineering tools like Gremlin inject faults into live clusters, creating immense blast radius. Second, staging environments cost 15 to 25 Lakhs per year yet test at 5% scale, hiding queue cliffs. Third, APMs like Datadog are retrospective—they notify you after your revenue is already lost. CascadeLab creates an uncontested blue ocean by enabling pre-production simulation with zero risk."
  },
  {
    id: 4,
    pmeCategory: "COMPONENT 2 • OBJECTIVES & SYSTEM SCOPE",
    title: "The CascadeLab Solution",
    subtitle: "6 SMART Objectives & Rigorous Engineering Scope Boundaries",
    glanceSummary: "<strong>6 SMART Objectives:</strong> Sub-second sim (95ms), AI topology synthesis (1.8s), autonomous self-healing (92% MTTR cut), 5 domain benchmarks, 60 FPS live ₹ loss.",
    badges: [
      { text: "6 SMART Objectives", color: "cyan" },
      { text: "12 Functional Modules", color: "emerald" },
      { text: "Zero Cloud Compute Cost", color: "purple" }
    ],
    leftContent: `
      <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 12px;">
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">95 ms</div>
          <div class="stat-label">OBJ 1: 180s Simulation Execution Speed (Target &lt; 100ms)</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-num text-purple">1.8 s</div>
          <div class="stat-label">OBJ 2: Gemini 2.5 Flash DAG Compilation (Target &lt; 2.5s)</div>
        </div>
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">92%</div>
          <div class="stat-label">OBJ 3: Autonomous AIOps MTTR Cut (Target &ge; 85%)</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text"><span class="point-pill pill-cyan">OBJ 4</span> Genetic Pareto Resilience Optimizer</span>
            <span class="text-sm text-cyan font-mono font-bold">+48 PTS LIFT</span>
          </div>
          <div class="card-desc">
            Evaluates 40+ resilience configurations across the Pareto frontier, optimizing resilience score against budget constraints in &lt; 3 seconds.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text"><span class="point-pill pill-amber">OBJ 5</span> 5 Production-Grade Domain Benchmarks</span>
            <span class="text-sm text-amber font-mono font-bold">MAPE = 3.8%</span>
          </div>
          <div class="card-desc">
            Pre-calibrated reference archetypes (E-Commerce, UPI Banking, Ride-Hailing, CDN, K8s) verified against physical Node.js microservice benchmarks.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text"><span class="point-pill pill-emerald">OBJ 6</span> Live ₹ GMV Financial Telemetry</span>
            <span class="text-sm text-emerald font-mono font-bold">60 FPS REAL-TIME</span>
          </div>
          <div class="card-desc">
            Dynamic revenue loss recalculation with a strict noise gate (&ge; 99.99% success rate = ₹0 loss) preventing floating-point penny leakage during baseline.
          </div>
        </div>

        <div class="feature-card border-purple" style="padding: 8px 12px;">
          <div class="card-desc" style="font-size: 11.5px;">
            <strong class="text-white">Project Scope Governance:</strong> <span class="text-emerald font-bold">IN-SCOPE:</span> Browser-native digital twin, GenAI synthesis, autonomous self-healing, postmortem exports. <span class="text-crimson font-bold">OUT-OF-SCOPE:</span> Kernel eBPF packet-injection, physical database transaction replay.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/01_baseline_nominal_dashboard.png", label: "Figure 4.1: Production Baseline Dashboard with 13 Microservices" },
      { src: "assets/14_multi_domain_templates_selector.png", label: "Figure 4.2: 5 Pre-Built Enterprise Domain Benchmark Selector" }
    ],
    speakerNotes: "Slide 4 details Component 2: Objectives and Scope. We established 6 SMART engineering objectives. First, execute a full 180-second discrete-time fluid simulation in under 100 milliseconds—we achieved 95 milliseconds. Second, compile natural language to a microservice DAG in under 2.5 seconds—achieved 1.8 seconds using Gemini 2.5 Flash. Third, autonomous self-healing cutting MTTR by at least 85%—achieved 92%. Fourth, genetic Pareto optimization. Fifth, 5 domain benchmarks. Sixth, live 60 FPS rupee loss calculation."
  },
  {
    id: 5,
    pmeCategory: "COMPONENT 3 • PROPOSED TECHNICAL METHODOLOGY",
    title: "Core Mathematical Kernel",
    subtitle: "Deterministic Discrete-Time Fluid Queueing Engine in Multi-Threaded Web Workers",
    glanceSummary: "<strong>Sakasegawa M/M/c approximation</strong> models heavy-traffic queueing. <strong>Little's Law verified (error &lt; 0.001%)</strong>. Mulberry32 PRNG guarantees 100% repeatable chaos replay.",
    badges: [
      { text: "dt = 1.0s Fluid Step", color: "cyan" },
      { text: "Sakasegawa M/M/c", color: "emerald" },
      { text: "Little's Law Verified", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">01 QUEUE DELAY</span> Sakasegawa Heavy-Traffic M/M/c Formulation</span>
            <span class="text-xs font-mono text-cyan font-bold">HEAVY-TRAFFIC ASYMPTOTE</span>
          </div>
          <div class="math-display">
            <span class="math-var">W</span><span class="math-sub">q</span>
            <span class="math-op">&approx;</span>
            <div class="math-frac">
              <span class="math-num">
                <span class="math-var">&rho;</span><span class="math-sup"><span class="math-sqrt-box"><span class="math-radical">&radic;</span><span class="math-radicand">2(<span class="math-var">c</span>+1)</span></span> &minus; 1</span>
              </span>
              <span class="math-den"><span class="math-var">c</span> (1 &minus; <span class="math-var">&rho;</span>)</span>
            </div>
            <span class="math-op">&times;</span>
            <div class="math-frac">
              <span class="math-num"><span class="math-var">C</span><span class="math-sub">a</span><span class="math-sup">2</span> + <span class="math-var">C</span><span class="math-sub">s</span><span class="math-sup">2</span></span>
              <span class="math-den">2</span>
            </div>
            <span class="math-op">&times;</span>
            <div class="math-frac">
              <span class="math-num">1</span>
              <span class="math-den"><span class="math-var">&mu;</span></span>
            </div>
          </div>
          <div class="card-desc" style="margin-top: 4px;">
            Captures non-linear queue explosion as server utilization <span class="math-var">&rho;</span> &rarr; 1.0. Formally verified against <strong class="text-white">Little's Law</strong> (<span class="math-var">L</span> = <span class="math-var">&lambda;</span><span class="math-var">W</span>) with error &lt; 0.001%.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">02 DEPENDENCY DELAY</span> Held Service Time Compounding (Downstream Hostage)</span>
            <span class="text-xs font-mono text-amber font-bold">BACKWARDS WAVE</span>
          </div>
          <div class="math-display">
            <span class="math-var">S</span><span class="math-sub">eff, i</span>
            <span class="math-op">=</span>
            <span class="math-var">S</span><span class="math-sub">own, i</span>
            <span class="math-op">+</span>
            <div class="math-sum-block">
              <span class="math-sum-sym">&sum;</span>
              <span class="math-sum-sub">j &isin; deps</span>
            </div>
            <span class="math-var">P</span><span class="math-sub">ij</span>
            <span class="math-op">&times;</span>
            <span class="math-var">W</span><span class="math-sub">q, j</span>
          </div>
          <div class="card-desc" style="margin-top: 4px;">
            When downstream dependency <em>j</em> slows down, upstream worker threads remain blocked, transmitting queue saturation backwards through the call graph.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">03 RESILIENCE METRIC</span> Dynamic Fleet Resilience Score</span>
            <span class="text-xs font-mono text-emerald font-bold">REAL-TIME LIFT</span>
          </div>
          <div class="math-display" style="font-size: 18px;">
            <span class="math-var">Score</span>(<span class="math-var">t</span>)
            <span class="math-op">=</span>
            <span style="color:#38BDF8; font-weight:700;">0.50</span> <span class="math-op">&times;</span> <span class="math-var">SuccessRate</span>
            <span class="math-op">+</span>
            <span style="color:#A855F7; font-weight:700;">0.25</span> <span class="math-op">&times;</span> <span class="math-var">LatencySLA</span>
            <span class="math-op">+</span>
            <span style="color:#10B981; font-weight:700;">0.25</span> <span class="math-op">&times;</span> <span class="math-var">FleetAvail</span>
          </div>
        </div>

        <!-- Animated Queue Saturation SVG Visual -->
        <div class="anim-math-box">
          <div class="anim-math-header">
            <span class="point-pill pill-cyan">LIVE QUEUE SIMULATION</span>
            <span class="text-xs font-mono text-slate">Sakasegawa Curve: Queue Delay vs Utilization (&rho;)</span>
            <span class="live-dot-pulse"></span>
          </div>
          <svg class="queue-curve-svg" viewBox="0 0 540 60">
            <line x1="40" y1="50" x2="520" y2="50" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <line x1="40" y1="10" x2="40" y2="50" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
            <path d="M 40 48 Q 280 47, 400 38 T 490 8" fill="none" stroke="#38BDF8" stroke-width="2.5" />
            <line x1="480" y1="8" x2="480" y2="50" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="3,3" />
            <text x="485" y="20" fill="#EF4444" font-size="9" font-family="monospace" font-weight="700">&rho;=0.98 CLAMP</text>
            <circle class="anim-pulse-point" cx="400" cy="38" r="4" fill="#10B981" />
            <text x="45" y="45" fill="#94A3B8" font-size="9" font-family="monospace">&rho;=0</text>
            <text x="260" y="45" fill="#94A3B8" font-size="9" font-family="monospace">&rho;=0.7 (Stable)</text>
            <text x="45" y="18" fill="#38BDF8" font-size="9" font-family="monospace">W_q Delay &rarr; &infin;</text>
          </svg>
        </div>

        <div class="stat-grid" style="margin-top: 2px; margin-bottom: 0;">
          <div class="stat-card stat-cyan">
            <div class="stat-num text-cyan">Web Worker</div>
            <div class="stat-label">Offloads heavy math from UI thread (fluid 60 FPS)</div>
          </div>
          <div class="stat-card stat-purple">
            <div class="stat-num text-purple">Mulberry32</div>
            <div class="stat-label">Seeded PRNG guarantees 100% deterministic chaos replay</div>
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/03_service_inspector_linter.png", label: "Figure 5.1: Service Inspector & Concurrency Tuning Drawer" },
      { src: "assets/09_reality_check_empirical_validation.png", label: "Figure 5.2: Reality Check Empirical Calibration Graph (MAPE = 3.8%)" }
    ],
    speakerNotes: "Slide 5 covers Component 3: Proposed Methodology. At the heart of CascadeLab is a discrete-time fluid queueing engine executing in dedicated Web Workers. We implement the Sakasegawa approximation for M/M/c queues to model non-linear queue delay as utilization approaches 100%. When a downstream service slows down, upstream threads are held hostage, compounding latency backwards. Our engine is verified against Little's Law with less than 0.001% error and runs with Mulberry32 deterministic seeding."
  },
  {
    id: 6,
    pmeCategory: "COMPONENT 3 • PROPOSED TECHNICAL METHODOLOGY",
    title: "Generative AI Architecture Studio",
    subtitle: "Gemini 2.5 Flash Prompt-to-DAG Synthesis with Strict JSON Schema Validation",
    glanceSummary: "<strong>Natural language to distributed DAG in 1.8 seconds</strong>. Zero-shot JSON schema enforcement. Built-in offline heuristic fallback guarantees 100% uptime with zero API keys.",
    badges: [
      { text: "Gemini 2.5 Flash", color: "purple" },
      { text: "Sub-2s Compilation", color: "cyan" },
      { text: "Dual-Engine Fallback", color: "emerald" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-purple">
          <div class="stat-num text-purple">1.8 s</div>
          <div class="stat-label">Prompt-to-DAG Compilation Latency</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">100%</div>
          <div class="stat-label">Strict JSON Schema Conformity</div>
        </div>
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">Offline</div>
          <div class="stat-label">Built-In Heuristic Fallback Engine</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">PILLAR 1</span> Zero-Shot Topology Synthesis</span>
          </div>
          <div class="card-desc">
            Engineers input natural language prompts (e.g. <em>"Design a high-throughput Indian UPI switch with NPCI timeouts and payment retries"</em>). Gemini 2.5 Flash generates a complete 12-node DAG with queue depths, retry counts, and latency bounds in 1.8s.
          </div>
        </div>

        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">PILLAR 2</span> Strict Structural Schema Enforcement</span>
          </div>
          <div class="card-desc">
            Output is validated against a rigorous JSON schema ensuring acyclic dependencies, valid service archetypes, proper retry backoffs, and realistic baseline latencies.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">PILLAR 3</span> Dual-Engine Offline Heuristic Fallback</span>
          </div>
          <div class="card-desc">
            If API quotas expire or internet connectivity drops, the built-in deterministic heuristic compiler (<code class="font-mono text-cyan">promptArchitectureEngine.ts</code>) generates full-fidelity topologies instantly.
          </div>
        </div>

        <div class="feature-card border-amber" style="padding: 8px 12px;">
          <div class="card-desc" style="font-size: 11.5px;">
            <strong class="text-white">Zero-Trust Secret Isolation:</strong> API keys are stored strictly in client-side <code class="font-mono text-cyan">localStorage</code>. No proprietary prompts or enterprise keys are ever transmitted to or logged on any external server.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/11_ai_prompt_architecture_studio.png", label: "Figure 6.1: Generative AI Architecture Studio Modal" },
      { src: "assets/12_ai_synthesis_generated_spec_preview.png", label: "Figure 6.2: Synthesized 12-Node Microservice JSON Spec Preview" }
    ],
    speakerNotes: "Slide 6 presents our Generative AI Architecture Studio. Instead of spending days writing YAML files, architects simply describe their system in plain English. Gemini 2.5 Flash synthesizes a complete microservice DAG with baseline latencies, queue sizes, and retry counts in 1.8 seconds. We enforce strict JSON schema validation. To ensure high enterprise availability, we built an offline heuristic parser that functions without internet or API keys. Keys remain safely in the user's browser."
  },
  {
    id: 7,
    pmeCategory: "COMPONENT 3 • PROPOSED TECHNICAL METHODOLOGY",
    title: "Autonomous AIOps Incident Commander",
    subtitle: "DEFCON 5→1 Threat Escalation, Root-Cause Back-Tracing & Sub-Second Self-Healing",
    glanceSummary: "<strong>Autonomous DEFCON 5&rarr;1 threat escalation</strong>. Pinpoints ground-zero failure in milliseconds. Deploys circuit breakers & load shedding in <strong>&lt; 500ms, slashing MTTR by 92%</strong>.",
    badges: [
      { text: "DEFCON 5→1 State Machine", color: "crimson" },
      { text: "< 500ms Auto-Mitigation", color: "cyan" },
      { text: "92% MTTR Reduction", color: "emerald" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">&lt; 500 ms</div>
          <div class="stat-label">Autonomous Auto-Remediation Execution Speed</div>
        </div>
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">92%</div>
          <div class="stat-label">Mean Time to Recover (MTTR) Reduction vs Manual SRE</div>
        </div>
        <div class="stat-card stat-crimson">
          <div class="stat-num text-crimson">0</div>
          <div class="stat-label">Human Operator Approvals Required in Auto-Pilot Mode</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">STATE MACHINE</span> DEFCON 5 &rarr; 1 Threat Escalation</span>
          </div>
          <div class="card-desc">
            Continuously monitors fleet error rate, queue backlog, and p99 latency. Dynamically escalates threat status: <span class="text-emerald font-bold">DEFCON 5 (Nominal)</span> &rarr; <span class="text-cyan font-bold">DEFCON 4 (Advisory)</span> &rarr; <span class="text-amber font-bold">DEFCON 3 (Elevated)</span> &rarr; <span class="text-crimson font-bold">DEFCON 2 (Critical)</span> &rarr; <strong class="text-crimson">DEFCON 1 (Catastrophic Collapse)</strong>.
          </div>
        </div>

        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">ROOT CAUSE</span> Heuristic Topological Back-Tracing</span>
          </div>
          <div class="card-desc">
            When failure cascades occur, the algorithm traverses the dependency graph upstream from failing endpoints to pinpoint the exact <strong class="text-white">ground-zero culprit</strong> (e.g., downstream payment gateway) and classifies the root cause (Queue Buildup, Latency Injection, or Retry Storm).
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">AUTO-HEALING</span> 3-Tier Autonomous Mitigation Execution</span>
          </div>
          <div class="card-desc">
            Instantly deploys: <strong class="text-cyan">(1) Circuit Breakers</strong> to fast-fail failing downstream dependencies, <strong class="text-purple">(2) Exponential Backoff with Jitter</strong> to eliminate retry synchrony, and <strong class="text-emerald">(3) Edge Load Shedding</strong> to protect core checkout flows.
          </div>
        </div>

        <!-- Live Simulated Telemetry Event Stream -->
        <div class="telemetry-live-stream">
          <div class="stream-header">
            <span class="defcon-badge-anim defcon-1">
              <span class="defcon-beacon"></span>
              DEFCON 1 MITIGATION ACTIVE
            </span>
            <span class="stream-title font-mono text-xs">AI COMMANDER EVENT LOG (REAL-TIME)</span>
            <span class="live-tag"><span class="live-dot-pulse"></span> STREAMING</span>
          </div>
          <div class="stream-logs">
            <div class="log-entry"><span class="text-muted font-mono">[T+00:14s]</span> <span class="text-cyan font-bold">&Delta;Latency</span> payment-gw &gt; 1,200ms &rarr; <span class="text-amber">DEFCON 3</span></div>
            <div class="log-entry"><span class="text-muted font-mono">[T+00:21s]</span> <span class="text-crimson font-bold">RETRY STORM</span> traffic amplified 64&times; &rarr; <span class="text-crimson font-bold">DEFCON 1</span></div>
            <div class="log-entry highlight-log"><span class="text-muted font-mono">[T+00:22s]</span> <span class="text-emerald font-bold">&#x2714; AUTO-HEAL:</span> Tripped CircuitBreaker('payment-gw') in <strong class="text-white">480ms</strong></div>
            <div class="log-entry"><span class="text-muted font-mono">[T+00:24s]</span> <span class="text-emerald font-bold">&#x2714; RECOVERED:</span> Fleet Goodput 99.8%, ₹0 loss averted</div>
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/05_ai_autonomous_commander_self_healing.jpg", label: "Figure 7.1: 3D Autonomous AI Commander Neural Core Visual" },
      { src: "assets/13_ai_incident_commander_defcon.png", label: "Figure 7.2: AI Incident Commander Active DEFCON 1 HUD & Remediation" }
    ],
    speakerNotes: "Slide 7 covers our Autonomous AIOps Incident Commander. When human SREs are paged at 3 AM, mean time to recover is 45 to 90 minutes. CascadeLab's autonomous commander monitors system health continuously. Upon detecting an anomaly, it escalates through DEFCON 5 to 1, back-traces the dependency graph to find ground zero, and deploys targeted mitigations—tripping circuit breakers and shedding non-critical load—in under 500 milliseconds, slashing MTTR by 92%."
  },
  {
    id: 8,
    pmeCategory: "COMPONENT 3 & 12 • MULTI-DOMAIN INDUSTRY BENCHMARKS",
    title: "5 Production-Grade Enterprise Archetypes",
    subtitle: "Pre-Calibrated Domain Topologies Reflecting Real-World Distributed Systems",
    glanceSummary: "<strong>5 Pre-calibrated enterprise architectures:</strong> E-Commerce, UPI Banking, Ride-Hailing, Video CDN, and Kubernetes Mesh. Calibrated against physical benchmarks with <strong>MAPE &lt; 3.8%</strong>.",
    badges: [
      { text: "5 Enterprise Archetypes", color: "cyan" },
      { text: "Peer-Reviewed Topologies", color: "emerald" },
      { text: "MAPE < 3.8% Calibrated", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">01 E-COMMERCE</span> ShopFast Flash Sale (13 Services)</span>
            <span class="text-sm font-mono text-cyan font-bold">13 NODES</span>
          </div>
          <div class="card-desc">
            Edge Gateway &rarr; Product Catalog &rarr; Inventory &rarr; Cart &rarr; Payment Gateway &rarr; Notification. Accurately models inventory lock contention and flash-sale checkout spikes.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">02 FINTECH</span> PayStream UPI Banking Switch (8 Services)</span>
            <span class="text-sm font-mono text-emerald font-bold">8 NODES</span>
          </div>
          <div class="card-desc">
            Core Banking &rarr; NPCI Switch &rarr; Ledger &rarr; Fraud Check &rarr; KYC &rarr; Webhook Dispatcher. Models bank gateway timeouts, retry storms, and webhook backpressure.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">03 MOBILITY</span> QuickRide Geolocation Mesh (6 Services)</span>
            <span class="text-sm font-mono text-amber font-bold">6 NODES</span>
          </div>
          <div class="card-desc">
            Geospatial Shards, Driver Matching Engine, Route Optimizer, Surge Pricing Engine. Simulates location update flood and geo-shard partition disconnects.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">04 MEDIA</span> StreamPulse Video CDN Mesh (7 Services)</span>
            <span class="text-sm font-mono text-purple font-bold">7 NODES</span>
          </div>
          <div class="card-desc">
            Edge POPs, DRM Tokenizer, Transcoder, Manifest Generator. Simulates thundering-herd cache stampedes during live sporting events.
          </div>
        </div>

        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">05 INFRA</span> CloudNative Kubernetes Service Mesh (6 Services)</span>
            <span class="text-sm font-mono text-crimson font-bold">6 NODES</span>
          </div>
          <div class="card-desc">
            Envoy Sidecars, mTLS Ingress, Worker Pods. Evaluates sidecar CPU exhaustion and container OOM pod eviction cascades.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/07_multi_domain_global_edge_mesh.jpg", label: "Figure 8.1: Global Multi-Domain Edge Mesh Topology" },
      { src: "assets/14_multi_domain_templates_selector.png", label: "Figure 8.2: 5 Pre-Built Enterprise Domain Benchmark Selector" }
    ],
    speakerNotes: "Slide 8 details our 5 pre-built enterprise domain benchmarks. Rather than toy academic graphs, CascadeLab includes calibrated archetypes for high-impact industries: ShopFast e-commerce for retail flash sales, PayStream for Indian UPI and NPCI banking switches, QuickRide for mobility geolocation, StreamPulse for video streaming CDN thundering herds, and a CloudNative Kubernetes mesh with Envoy sidecars. Each is calibrated with empirical Mean Absolute Percentage Error under 3.8%."
  },
  {
    id: 9,
    pmeCategory: "COMPONENT 3 • PROPOSED TECHNICAL METHODOLOGY",
    title: "Gamified SRE Arenas & Postmortems",
    subtitle: "Dual-Perspective Training: Break It! Red-Team Attack vs Defend It! Blue-Team Defense",
    glanceSummary: "<strong>Gamified Red Team vs Blue Team battle arenas</strong>. Attackers inject chaos; defenders triage under a ₹ budget. <strong>1-Click Executive Postmortem generator</strong> exports PDF/MD with financial ROI.",
    badges: [
      { text: "Break It! Red Team", color: "crimson" },
      { text: "Defend It! Blue Team", color: "emerald" },
      { text: "Executive Postmortems", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">RED TEAM</span> "Break It!" Chaos Engineering Arena</span>
            <span class="text-sm font-mono text-crimson font-bold">OFFENSIVE SRE</span>
          </div>
          <div class="card-desc">
            Engineers take the offensive role with a budget of chaos credits. Inject latency, drop packets, or kill pods to find hidden architectural vulnerabilities and maximize cascade financial damage.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">BLUE TEAM</span> "Defend It!" Incident Commander Arena</span>
            <span class="text-sm font-mono text-emerald font-bold">DEFENSIVE SRE</span>
          </div>
          <div class="card-desc">
            Engineers act as on-call incident commanders during an ongoing Sev-1 outage. Under strict time and financial budget constraints, strategically tune circuit breakers, retry budgets, and load shedding to restore SLOs.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">AUTOMATION</span> One-Click Executive Postmortem Generator</span>
            <span class="text-sm font-mono text-purple font-bold">PDF / MARKDOWN</span>
          </div>
          <div class="card-desc">
            Automatically generates C-suite ready incident postmortems complete with:
            <div class="point-row" style="margin-top: 6px;"><span class="point-pill pill-cyan">TIMELINE</span> <span class="text-slate">Second-by-second incident chronology from trigger to resolution</span></div>
            <div class="point-row"><span class="point-pill pill-crimson">ROOT CAUSE</span> <span class="text-slate">Empirical graph back-tracing identifying ground-zero bottleneck</span></div>
            <div class="point-row"><span class="point-pill pill-emerald">FINANCIAL ROI</span> <span class="text-slate">Quantified rupee losses incurred vs millions averted by resilience guards</span></div>
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/07_break_it_live_battle_hud.png", label: "Figure 9.1: Gamified 'Break It!' Chaos Battle HUD" },
      { src: "assets/10_executive_postmortem_report.png", label: "Figure 9.2: One-Click Executive SRE Postmortem Generator (PDF/MD)" }
    ],
    speakerNotes: "Slide 9 presents our Gamified SRE Arenas and Executive Postmortem Generator. To bridge training and production readiness, we created two interactive battle modes: 'Break It!' where red-team chaos engineers inject faults to test cluster resilience, and 'Defend It!' where blue-team incident commanders allocate a fixed budget to mitigate outages. After every incident, CascadeLab generates a full, professional executive postmortem with root-cause analysis and financial impact in one click."
  },
  {
    id: 10,
    pmeCategory: "COMPONENT 3 & 11 • VERIFICATION & SIMULATION EXPERIMENTS",
    title: "Split-Screen Replay & Capacity Cliffs",
    subtitle: "Synchronized Side-by-Side Timeline & Parameterized Traffic Stress Boundary Sweeper",
    glanceSummary: "<strong>Synchronized 180s split-screen replay</strong> proves hardening maintains 99.8% health while naive defaults die. <strong>Capacity Cliff Sweeper</strong> identifies saturation knee point &lambda;* across 40 scenarios.",
    badges: [
      { text: "Lockstep 180s Scrubbing", color: "cyan" },
      { text: "Capacity Cliff Sweeper", color: "crimson" },
      { text: "40 Chaos Scenarios", color: "emerald" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">EXPERIMENT 1</span> Synchronized Split-Screen Comparative Replay</span>
          </div>
          <div class="card-desc">
            Runs <strong class="text-crimson">Naive Defaults (Left)</strong> and <strong class="text-emerald">Hardened Architecture (Right)</strong> side-by-side across a unified 180-second timeline.
            <div class="point-row" style="margin-top: 6px;">
              <span class="point-pill pill-crimson">NAIVE COLLAPSE</span>
              <span class="text-slate">At t=45s, unhardened cluster enters metastable collapse; <strong>₹2.35 Lakhs GMV lost</strong>.</span>
            </div>
            <div class="point-row">
              <span class="point-pill pill-emerald">HARDENED STABILITY</span>
              <span class="text-slate">Circuit breakers fast-fail immediately; maintains <strong>99.8% goodput with ₹0 loss</strong>.</span>
            </div>
          </div>
        </div>

        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">EXPERIMENT 2</span> Capacity Cliff Stress Boundary Sweeper</span>
            <span class="code-pill">&Delta;&lambda; = 250 RPS</span>
          </div>
          <div class="card-desc">
            Automatically sweeps traffic from 500 RPS to 10,000 RPS. Plots Goodput vs Offered Load to detect the exact <strong class="text-amber">saturation knee point (&lambda;*)</strong> where queue wait time diverges to infinity.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">EXPERIMENT 3</span> 40-Scenario Chaos Engineering Matrix</span>
          </div>
          <div class="card-desc">
            Evaluates 40 systematic failure tests (retry storms, downstream latency spikes, missing circuit breakers, and thread exhaustion), verifying that auto-hardening turns every failing red test into resilient green.
          </div>
        </div>

        <!-- Animated Split-Screen Scrubbing Timeline Tracker -->
        <div class="anim-scrub-box">
          <div class="anim-scrub-header">
            <span class="point-pill pill-cyan">SYNCHRONIZED 180s TIMELINE</span>
            <span class="text-xs font-mono text-crimson font-bold">&#x26A0; INFLECTION: t=45s</span>
            <span class="live-tag"><span class="live-dot-pulse"></span> LOCKSTEP REPLAY</span>
          </div>
          <div class="timeline-track">
            <div class="timeline-bar-bg">
              <div class="timeline-inflection-marker" style="left: 25%;"></div>
              <div class="timeline-moving-scrubber"></div>
            </div>
            <div class="timeline-labels">
              <span>t=0s (Nominal)</span>
              <span class="text-crimson font-bold">t=45s (Naive Dies)</span>
              <span>t=120s</span>
              <span>t=180s (End)</span>
            </div>
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/15_split_screen_synchronized_replay.png", label: "Figure 10.1: Split-Screen Synchronized Comparative Replay HUD" },
      { src: "assets/16_capacity_cliff_analysis.png", label: "Figure 10.2: Capacity Cliff Traffic Stress Boundary Sweeper & Goodput Curve" }
    ],
    speakerNotes: "Slide 10 demonstrates Component 3 and 11: Prototype, Simulation, and Experimental Validation. We built two advanced visualization engines: First, Split-Screen Synchronized Replay runs naive defaults against hardened configurations in lockstep. You can scrub to second 45 and watch the unhardened system die while the hardened system absorbs the shock. Second, our Capacity Cliff Sweeper pushes load from 500 to 10,000 RPS to map the exact mathematical tipping point where goodput collapses."
  },
  {
    id: 11,
    pmeCategory: "COMPONENT 4 • WORK BREAKDOWN STRUCTURE (WBS)",
    title: "Work Breakdown Structure (WBS)",
    subtitle: "5 Hierarchical Levels, 6 Work Packages & 21 Terminal Tasks Following 100% Rule",
    glanceSummary: "<strong>5 Hierarchical WBS Levels</strong> | 6 Work Packages (WP1&ndash;WP6) | <strong>21 Terminal Work Packages</strong> strictly adhering to the 100% MECE rule across 1,480 student hours.",
    badges: [
      { text: "5 Hierarchical Levels", color: "cyan" },
      { text: "6 Work Packages (WP1-WP6)", color: "emerald" },
      { text: "100% Mutually Exclusive", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">WP1</span> Core Mathematical Simulation Kernel</span>
            <span class="text-sm font-mono text-cyan font-bold">360 HOURS</span>
          </div>
          <div class="card-desc">
            Fluid queueing equations, Sakasegawa heavy-traffic formulation, Little's Law verification, Mulberry32 deterministic PRNG, multi-threaded Web Worker offloading.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">WP2</span> Generative AI Architecture Studio</span>
            <span class="text-sm font-mono text-purple font-bold">220 HOURS</span>
          </div>
          <div class="card-desc">
            Gemini 2.5 Flash prompt engineering, zero-shot JSON schema validation, offline heuristic fallback compiler, client-side secret encryption.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">WP3</span> Interactive Canvas & Visualization Subsystems</span>
            <span class="text-sm font-mono text-emerald font-bold">280 HOURS</span>
          </div>
          <div class="card-desc">
            React Flow graph rendering, dynamic SVG particle animations, 5 domain benchmark archetypes, dark-tech responsive interface.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">WP4</span> Chaos Engineering, Linter & Verification Suite</span>
            <span class="text-sm font-mono text-amber font-bold">260 HOURS</span>
          </div>
          <div class="card-desc">
            Static resilience linter rules, Break It! & Defend It! battle arenas, split-screen replay engine, capacity cliff stress sweeper, 40-test chaos matrix.
          </div>
        </div>

        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">WP5 & WP6</span> Financial Telemetry, Deployment & Business</span>
            <span class="text-sm font-mono text-crimson font-bold">360 HOURS</span>
          </div>
          <div class="card-desc">
            Dynamic ₹ GMV loss engine, executive postmortem generator, Vercel CI/CD edge deployment, Business Model Canvas, and AAT documentation.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/06_genetic_algorithm_resilience_optimization.jpg", label: "Figure 11.1: 3D Genetic Algorithm Optimization Concept Art" },
      { src: "assets/06_auto_harden_pareto_frontier.png", label: "Figure 11.2: Genetic Algorithm Pareto Frontier Optimization Drawer" }
    ],
    speakerNotes: "Slide 11 addresses Component 4: Work Breakdown Structure. We decomposed CascadeLab into 5 hierarchical levels and 6 core work packages covering 21 terminal work packages. WP1 covers the mathematical simulation core; WP2 covers Generative AI; WP3 covers the interactive canvas UI; WP4 covers the chaos and linter suite; and WP5 and WP6 cover financial telemetry and commercial deployment. The WBS strictly obeys the 100% rule with no duplicate tasks across our 4 team members."
  },
  {
    id: 12,
    pmeCategory: "COMPONENT 5 • NETWORK DIAGRAM & CRITICAL PATH METHOD",
    title: "Network Diagram & Critical Path (CPM)",
    subtitle: "Activity-on-Node Precedence Network & Forward/Backward Pass Schedule Calculations",
    glanceSummary: "<strong>Critical Path: 46 Working Days (9.2 Calendar Weeks)</strong>. Forward/Backward passes determine zero float on critical tasks. Decoupled UI & BMC streams prevent bottlenecks.",
    badges: [
      { text: "21 Activities (A to U)", color: "cyan" },
      { text: "Critical Path: 46 Days", color: "crimson" },
      { text: "Zero Critical Slippage", color: "emerald" }
    ],
    leftContent: `
      <div class="feature-card border-crimson" style="margin-bottom: 12px;">
        <div class="card-header-row">
          <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">CRITICAL PATH</span> Zero Total Float Sequence (TF = 0)</span>
          <span class="text-sm font-mono text-crimson font-bold">46 WORKING DAYS</span>
        </div>
        <div class="font-mono text-xs text-white" style="line-height: 1.6; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px;">
          A (Scope) &rarr; B (Math) &rarr; C (Worker) &rarr; D (Sim Core) &rarr; E (DAG) &rarr; F (Linter) &rarr; P (Reality Check) &rarr; Q (Split-Screen) &rarr; R (Cliff) &rarr; T (E2E Test) &rarr; U (Deploy)
        </div>
      </div>

      <div class="cpm-table-container">
        <table class="cpm-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Dur</th>
              <th>ES / EF</th>
              <th>LS / LF</th>
              <th>Float</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr class="crit-row">
              <td class="font-bold text-white">D: Sim Engine Core</td>
              <td>7d</td>
              <td>10 / 17</td>
              <td>10 / 17</td>
              <td class="text-crimson font-bold">0d</td>
              <td><span class="point-pill pill-crimson">CRITICAL</span></td>
            </tr>
            <tr class="crit-row">
              <td class="font-bold text-white">P: Reality Check Calibration</td>
              <td>6d</td>
              <td>26 / 32</td>
              <td>26 / 32</td>
              <td class="text-crimson font-bold">0d</td>
              <td><span class="point-pill pill-crimson">CRITICAL</span></td>
            </tr>
            <tr>
              <td class="font-bold text-white">L: Pareto Optimizer</td>
              <td>5d</td>
              <td>26 / 31</td>
              <td>27 / 32</td>
              <td class="text-amber font-bold">1d</td>
              <td><span class="point-pill pill-amber">Near-Crit</span></td>
            </tr>
            <tr>
              <td class="font-bold text-white">G: UI Flow Canvas</td>
              <td>7d</td>
              <td>10 / 17</td>
              <td>19 / 26</td>
              <td class="text-cyan font-bold">9d</td>
              <td><span class="point-pill pill-cyan">Float 9d</span></td>
            </tr>
            <tr>
              <td class="font-bold text-white">S: BMC & Business Model</td>
              <td>8d</td>
              <td>6 / 14</td>
              <td>34 / 42</td>
              <td class="text-emerald font-bold">28d</td>
              <td><span class="point-pill pill-emerald">Float 28d</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="feature-card border-cyan" style="margin-top: 10px;">
        <div class="card-desc">
          <strong class="text-white">Decoupled Parallel Execution:</strong> Frontend UI canvas (Float = 9 days) and Business Model documentation (Float = 28 days) operated as non-blocking streams, insulating the critical path from schedule risk.
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/09_reality_check_empirical_validation.png", label: "Figure 12.1: Activity P: Reality-Check Benchmark Calibration Overlay" },
      { src: "assets/07_break_it_live_battle_hud.png", label: "Figure 12.2: Activity Q: Gamified Break It! Arena HUD" }
    ],
    speakerNotes: "Slide 12 covers Component 5: Network Diagram and Critical Path Method. We performed full forward and backward pass calculations across all 21 project activities. The Critical Path is 46 working days, or 9.2 calendar weeks, running from mathematical derivation through simulation core, reality-check calibration, split-screen replay, to final Vercel deployment. Activities like UI canvas styling had 9 days of float and business modeling had 28 days of float, allowing us to absorb unexpected technical hurdles without missing our launch deadline."
  },
  {
    id: 13,
    pmeCategory: "COMPONENT 6 • GANTT CHART & PROJECT TIMELINE",
    title: "Gantt Chart & Sprint Execution",
    subtitle: "10-Week Schedule Across 4 Agile Sprints with 5 Gate Milestones (M1–M5)",
    glanceSummary: "<strong>10 Weeks, 4 Agile Sprints, 5 Gate Milestones</strong> completed with zero critical slippage (SPI = 1.00). Parallel workstreams prevented resource contention.",
    badges: [
      { text: "10 Calendar Weeks", color: "cyan" },
      { text: "4 Agile Sprints", color: "emerald" },
      { text: "SPI = 1.00 (On-Time)", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">SPRINT 1 (W1–3)</span> Foundation & Mathematical Engine</span>
            <span class="point-pill pill-emerald">MILESTONE M1 ACHIEVED</span>
          </div>
          <div class="card-desc">
            Formal derivation of Sakasegawa M/M/c approximation, Web Worker multi-threading bridge, and Little's Law error validation (&lt; 0.001%).
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">SPRINT 2 (W4–6)</span> Core Platform & GenAI Topology Studio</span>
            <span class="point-pill pill-emerald">MILESTONE M2 ACHIEVED</span>
          </div>
          <div class="card-desc">
            React Flow canvas, node/edge animation, Gemini 2.5 Flash prompt-to-DAG compiler, and offline heuristic fallback parser.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">SPRINT 3 (W7–8)</span> Chaos Engineering & Experimental Validation</span>
            <span class="point-pill pill-emerald">MILESTONE M3 ACHIEVED</span>
          </div>
          <div class="card-desc">
            Split-screen synchronized replay, capacity cliff sweeper, 40-test chaos matrix, and reality check benchmark calibration against physical Node.js traces.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">SPRINT 4 (W9–10)</span> Hardening, Commercial BMC & Live Launch</span>
            <span class="point-pill pill-emerald">MILESTONES M4 & M5 ACHIEVED</span>
          </div>
          <div class="card-desc">
            Dynamic ₹ GMV loss engine, executive postmortem PDF exporter, CI/CD automated test suite, Vercel global edge launch, and PME pitch deck completion.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/06_auto_harden_pareto_frontier.png", label: "Figure 13.1: Milestone M3: Pareto Frontier Genetic Auto-Hardening" },
      { src: "assets/05_2_chaos_matrix_after_hardening.png", label: "Figure 13.2: Milestone M4: 40-Test Chaos Engineering Matrix (100% Green)" }
    ],
    speakerNotes: "Slide 13 covers Component 6: Gantt Chart and Project Timeline. We executed CascadeLab over a 10-week schedule structured into 4 two-to-three week Agile sprints with 5 strict gate reviews. Sprint 1 delivered the verified mathematical kernel; Sprint 2 integrated the React canvas and Gemini AI studio; Sprint 3 implemented chaos verification and the 40-scenario matrix; and Sprint 4 completed financial telemetry and public production launch. We maintained a Schedule Performance Index of exactly 1.00."
  },
  {
    id: 14,
    pmeCategory: "COMPONENT 7 • RESOURCE REQUIREMENTS",
    title: "Comprehensive Resource Requirements",
    subtitle: "Human, Hardware, Software, Cloud Infrastructure & Data Asset Allocation",
    glanceSummary: "<strong>4-Student Resource Allocation (1,480 hours)</strong> | React 18, TypeScript, Vite, Web Workers | Vercel Edge + Gemini API | <strong>Zero Server Hosting Cost</strong>.",
    badges: [
      { text: "4 Student Roles", color: "cyan" },
      { text: "Modern Dev Stack", color: "emerald" },
      { text: "₹0 Cloud Backend Cost", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">HUMAN</span> 4-Student Engineering Team (1,480 Total Hours)</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Nischay Kumar (400h):</strong> End-to-end platform core, sim kernel & CPM. <strong class="text-white">Suchith N (380h):</strong> Canvas UI & 3D art. <strong class="text-white">Uday Kumar (360h):</strong> Chaos arenas & linter. <strong class="text-white">Sthambaj (340h):</strong> AIOps state machine & BMC.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">SOFTWARE</span> Development Frameworks & Tooling</span>
          </div>
          <div class="card-desc">
            React 18, TypeScript 5.2, Vite 5, Tailwind CSS, Lucide Icons, Web Workers API, Mulberry32 PRNG, Playwright E2E testing framework.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">CLOUD</span> Infrastructure & API Services</span>
          </div>
          <div class="card-desc">
            Vercel Global Edge Network (zero-latency static delivery with automated GitHub Actions CI/CD) and Google Gemini 2.5 Flash API for natural language DAG synthesis.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">HARDWARE & DATA</span> Workstations & Empirical Benchmarks</span>
          </div>
          <div class="card-desc">
            Apple M-Series and x86_64 development workstations with dedicated GPUs; USENIX OSDI '22 empirical trace dataset for physical calibration.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/04_sre_command_center_telemetry.jpg", label: "Figure 14.1: SRE Command Center Telemetry Hardware & Workstation Setup" },
      { src: "assets/03_service_inspector_linter.png", label: "Figure 14.2: Development Architecture: Client-Side React Flow & Inspector" }
    ],
    speakerNotes: "Slide 14 outlines Component 7: Resource Requirements. Our human resource plan allocated 1,480 engineering hours across our 4 team members with clear specialization. Our software stack leverages React 18, TypeScript, Vite, and native Web Workers. For cloud infrastructure, we chose Vercel's global edge network, keeping ongoing server costs at zero because the entire simulation executes directly in the user's browser."
  },
  {
    id: 15,
    pmeCategory: "COMPONENT 8 • DETAILED COST ESTIMATION & BUDGET",
    title: "Cost Estimation & Financial Budget",
    subtitle: "COCOMO II Bottom-Up Analysis: Academic Prototype vs Commercial Enterprise Deployment",
    glanceSummary: "<strong>Academic AAT Outlay: ₹0</strong> | Commercial Dev Equivalent: <strong>₹11.84 Lakhs</strong> (1,480 hrs @ ₹800/hr) | Year 1 SaaS Operating Budget: <strong>₹17.65 Lakhs</strong>.",
    badges: [
      { text: "COCOMO II Bottom-Up", color: "cyan" },
      { text: "Academic Cost: ₹0", color: "emerald" },
      { text: "Commercial Budget: ₹17.65L", color: "amber" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">₹0</div>
          <div class="stat-label">Academic AAT Outlay (Student Capital)</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">₹11.84 L</div>
          <div class="stat-label">Commercial Dev Labor Value (1,480 hrs @ ₹800/hr)</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="stat-num text-amber">₹17.65 L</div>
          <div class="stat-label">Year 1 Commercial SaaS Operating Budget</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">DEVELOPMENT</span> Commercial Engineering Valuation Breakdown</span>
          </div>
          <div class="card-desc">
            Full-Stack Systems Lead (400h): <strong class="text-white">₹3.20L</strong> | UI & Graphics Lead (380h): <strong class="text-white">₹3.04L</strong> | Chaos & Linter Lead (360h): <strong class="text-white">₹2.88L</strong> | AIOps & BMC Lead (340h): <strong class="text-white">₹2.72L</strong>. Total Development Labor: <strong class="text-cyan">₹11,84,000</strong>.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">OPERATION</span> Year 1 Commercial SaaS Run Budget</span>
          </div>
          <div class="card-desc">
            Vercel Pro CDN: <strong class="text-white">₹25,000</strong> | Gemini 2.5 Flash API Tokens: <strong class="text-white">₹1,80,000</strong> | Legal, IP & Domain: <strong class="text-white">₹60,000</strong> | SRE Support & Maintenance: <strong class="text-white">₹15,00,000</strong>. Total Year 1 Operating Budget: <strong class="text-amber">₹17,65,000</strong>.
          </div>
        </div>

        <div class="feature-card border-emerald" style="padding: 8px 12px;">
          <div class="card-desc" style="font-size: 11.5px;">
            <strong class="text-emerald">Unit Economics Moat:</strong> Because the simulation runs client-side via Web Workers, marginal server cost per active user is <strong>₹0.00</strong>, enabling an industry-leading <strong>87% gross margin</strong>.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/08_defend_it_sre_mitigation_modal.png", label: "Figure 15.1: Defend It! Budget-Constrained Mitigation Modal" },
      { src: "assets/10_executive_postmortem_report.png", label: "Figure 15.2: Quantified Rupee GMV Loss vs Averted Financial Damage" }
    ],
    speakerNotes: "Slide 15 covers Component 8: Detailed Cost Estimation and Budget. From an academic AAT perspective, our out-of-pocket development cost was zero rupees, powered by open-source technologies and student labor. Under commercial COCOMO II estimation, the 1,480 engineering hours represent ₹11.84 Lakhs in software development value. To operationalize CascadeLab as an enterprise SaaS product, our Year 1 operating budget is ₹17.65 Lakhs. Crucially, our client-side architecture gives us an 87% gross margin."
  },
  {
    id: 16,
    pmeCategory: "COMPONENT 9 • RISK IDENTIFICATION & MITIGATION",
    title: "Risk Management Matrix",
    subtitle: "5×5 Assessment Matrix & 4-Tier Defensive Architecture",
    glanceSummary: "<strong>9 Master Risks Evaluated</strong>. Offline heuristic compiler mitigates AI API outages. Sakasegawa clamping prevents math divergence. <strong>Zero-trust secret isolation</strong>.",
    badges: [
      { text: "9 Master Risks Evaluated", color: "cyan" },
      { text: "Dual-Engine AI Fallback", color: "emerald" },
      { text: "Zero-Trust Secret Isolation", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-crimson">
          <div class="card-header-row">
            <span class="card-title-text text-crimson"><span class="point-pill pill-crimson">T1 (SCORE 16)</span> Gemini AI API Outage or Quota Depletion</span>
            <span class="text-sm font-mono text-crimson font-bold">CRITICAL RISK</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Mitigation:</strong> Built-in offline deterministic heuristic compiler (<code class="font-mono text-cyan">promptArchitectureEngine.ts</code>) generates verified multi-service DAGs instantly without network connectivity or API tokens.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">T3 (SCORE 8)</span> Queueing Math Numerical Divergence (&rho; &rarr; 1.0)</span>
            <span class="text-sm font-mono text-amber font-bold">MODERATE RISK</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Mitigation:</strong> Hard numerical clamping on server utilization at &rho; &le; 0.98, coupled with exponential moving average smoothing (&alpha; = 0.5) to prevent NaN/infinite float overflows.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">O1 (SCORE 10)</span> Enterprise User API Key Leakage & Privacy</span>
            <span class="text-sm font-mono text-purple font-bold">HIGH RISK</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Mitigation:</strong> Zero-backend client architecture ensures Gemini API keys and enterprise architecture topologies reside solely in browser <code class="font-mono text-cyan">localStorage</code>, never touching our servers.
          </div>
        </div>

        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">T4 (SCORE 4)</span> Financial Loss Floating-Point Rounding Noise</span>
            <span class="text-sm font-mono text-cyan font-bold">LOW RISK</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Mitigation:</strong> Strict baseline noise filter (<code class="font-mono text-cyan">SuccessRate &ge; 99.99% &rarr; Loss = ₹0</code>) prevents micro-penny leakage during nominal operations.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/05_ai_autonomous_commander_self_healing.jpg", label: "Figure 16.1: Automated Incident Defense Architecture" },
      { src: "assets/09_reality_check_empirical_validation.png", label: "Figure 16.2: Empirical Reality Check Guard Against Model Divergence" }
    ],
    speakerNotes: "Slide 16 details Component 9: Risk Identification and Mitigation. We evaluated 9 master risks across technical, operational, and commercial categories using a 5-by-5 probability-impact matrix. Our highest-rated risk was external AI API downtime; we mitigated this by building an offline heuristic parser that provides 100% platform availability even when offline. To safeguard enterprise confidentiality, we implemented zero-trust secret isolation where API keys never leave local browser memory."
  },
  {
    id: 17,
    pmeCategory: "COMPONENT 10 • BUSINESS MODEL CANVAS (BMC)",
    title: "Business Model Canvas (9 Blocks)",
    subtitle: "Sustainable Commercial Viability: Enterprise B2B Developer Tool & EdTech Platform",
    glanceSummary: "<strong>Tiered B2B SaaS:</strong> Community Free, Team ₹8L/yr, Enterprise ₹24L/yr. High-velocity FinTech & E-Commerce target customers. <strong>87% Gross Margin & 90x ROI</strong>.",
    badges: [
      { text: "9 BMC Components", color: "cyan" },
      { text: "87% Gross Margin", color: "emerald" },
      { text: "Enterprise B2B SaaS", color: "purple" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">VALUE PROPOSITION</span> Why Customers Pay for CascadeLab</span>
          </div>
          <div class="card-desc">
            Eliminates 74% of Sev-1 cascading outages before production; saves ₹15–25 Lakhs/yr in idle staging clusters; connects engineering downtime directly to real-time ₹ GMV loss for executive clarity.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">SEGMENTS & CHANNELS</span> Target Enterprise Accounts</span>
          </div>
          <div class="card-desc">
            High-velocity Indian FinTech and E-Commerce scale-ups (Flipkart, Swiggy, Zerodha, PhonePe) and Global SaaS companies. Reached via direct SRE developer advocacy, GitHub Marketplace, and technical postmortem webinars.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">REVENUE STREAMS</span> 3-Tier Enterprise SaaS Pricing</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Community (₹0 Free):</strong> 5 nodes, standard chaos scenarios, open-source.
            <br><strong class="text-white">Team Edition (₹8 Lakhs/year):</strong> Up to 25 nodes, Gemini GenAI studio, custom traffic sweeps.
            <br><strong class="text-white">Enterprise Suite (₹24 Lakhs/year):</strong> Unlimited nodes, automated CI/CD PR resilience gates, custom domain benchmarks, SLA guarantee.
          </div>
        </div>

        <div class="feature-card border-amber" style="padding: 8px 12px;">
          <div class="card-desc" style="font-size: 11.5px;">
            <strong class="text-white">Key Partners & Resources:</strong> Cloud providers (Vercel, AWS), Google Gemini AI, Academic CS departments, and SRE community contributors.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/04_root_cause_metastable_analysis.png", label: "Figure 17.1: Root Cause & Financial Damage Analytics in Platform" },
      { src: "assets/08_defend_it_sre_mitigation_modal.png", label: "Figure 17.2: Enterprise SRE Mitigation & Configuration Controls" }
    ],
    speakerNotes: "Slide 17 covers Component 10: The Business Model Canvas across all 9 standard building blocks. Our value proposition focuses on pre-production chaos safety, saving staging costs, and executive financial translation. We target Indian unicorn scale-ups and global SaaS microservice teams through developer-first channels. Our revenue model offers three tiers: Free Community, Team at ₹8 Lakhs per year, and Enterprise at ₹24 Lakhs per year. Client-side execution delivers an exceptional 87% gross margin."
  },
  {
    id: 18,
    pmeCategory: "COMPONENT 12 • MARKET & CUSTOMER ANALYSIS",
    title: "Market Opportunity & Moat",
    subtitle: "$14.8B Total Addressable Market & Uncontested Blue-Ocean Competitive Moat",
    glanceSummary: "<strong>TAM: $14.8B | SAM: $3.2B | SOM: $85M (India/SEA)</strong>. 4 Buyer Personas: Staff SRE (Vikram), VP Infra (Sarah), Cloud Architect (Arjun), Professor (Dr. Ramesh).",
    badges: [
      { text: "TAM: $14.8 Billion", color: "cyan" },
      { text: "SAM: $3.2 Billion", color: "emerald" },
      { text: "SOM: $85 Million", color: "purple" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">$14.8 B</div>
          <div class="stat-label">TAM: Global Observability & Chaos Engineering Market</div>
        </div>
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">$3.2 B</div>
          <div class="stat-label">SAM: Enterprise Microservice Cloud-Native Teams</div>
        </div>
        <div class="stat-card stat-purple">
          <div class="stat-num text-purple">$85 M</div>
          <div class="stat-label">SOM: India & SEA High-Growth FinTech / E-Commerce</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">PERSONA 1</span> Vikram — Staff Site Reliability Engineer (SRE)</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Pain:</strong> Woken up at 3 AM by Sev-1 pages; post-incident triage is painful and manual.
            <br><strong class="text-cyan">CascadeLab Value:</strong> Simulates failure modes beforehand; autonomous commander remediates in &lt; 500ms.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">PERSONA 2</span> Sarah — VP of Cloud Infrastructure</span>
          </div>
          <div class="card-desc">
            <strong class="text-white">Pain:</strong> Spending ₹25 Lakhs/year on idle staging environments that fail to catch outages.
            <br><strong class="text-emerald">CascadeLab Value:</strong> Replaces expensive staging with client-side digital twins, slashing cloud waste.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">PERSONAS 3 & 4</span> Cloud Architect (Arjun) & CS Professor (Dr. Ramesh)</span>
          </div>
          <div class="card-desc">
            Arjun compiles 15-node topologies from English in 2 seconds. Dr. Ramesh uses gamified arenas to teach distributed systems to 120+ university students.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/07_multi_domain_global_edge_mesh.jpg", label: "Figure 18.1: Enterprise Market Scope: Global Edge Architectures" },
      { src: "assets/04_sre_command_center_telemetry.jpg", label: "Figure 18.2: Target Customer Persona: Enterprise SRE Command Centers" }
    ],
    speakerNotes: "Slide 18 details Component 12: Market and Customer Analysis. The global observability and resilience market stands at $14.8 Billion. Our Serviceable Addressable Market is $3.2 Billion, and our 3-year serviceable obtainable market in India and Southeast Asia is $85 Million. We designed CascadeLab around 4 distinct personas: Vikram the SRE who hates 3 AM pages, Sarah the VP of Infra who wants to cut staging waste, Arjun the architect, and Dr. Ramesh who teaches distributed systems."
  },
  {
    id: 19,
    pmeCategory: "COMPONENT 13 • EXPECTED MEASURABLE OUTCOMES",
    title: "Measurable Multi-Dimensional Impact",
    subtitle: "Quantified Technical, Social, Environmental & Commercial Performance Metrics",
    glanceSummary: "<strong>Sub-second 95ms engine</strong> | 92% MTTR reduction | <strong>4,800 kWh green energy conserved</strong> | <strong>90x enterprise customer ROI</strong> by averting Sev-1 outages.",
    badges: [
      { text: "Technical Excellence", color: "cyan" },
      { text: "Social & Wellness", color: "emerald" },
      { text: "Environmental ESG", color: "purple" },
      { text: "Commercial Viability", color: "amber" }
    ],
    leftContent: `
      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">TECHNICAL</span> Proven Sub-Second Engineering Metrics</span>
            <span class="text-sm font-mono text-cyan font-bold">95 MS ENGINE</span>
          </div>
          <div class="card-desc">
            Sub-second simulation kernel (95ms); 1.8s Gemini AI DAG compilation; 92% reduction in Mean Time to Recover; Little's Law error &lt; 0.001%; MAPE &lt; 3.8% empirical accuracy.
          </div>
        </div>

        <div class="feature-card border-emerald">
          <div class="card-header-row">
            <span class="card-title-text text-emerald"><span class="point-pill pill-emerald">SOCIAL</span> Human Well-Being & Eliminating Engineer Burnout</span>
            <span class="text-sm font-mono text-emerald font-bold">ZERO 3 AM PAGES</span>
          </div>
          <div class="card-desc">
            Eradicates 3 AM on-call Sev-1 firefighting emergencies; reduces SRE stress and team attrition; democratizes advanced distributed systems education for students globally.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">ENVIRONMENTAL</span> Green Cloud ESG: Slashing Carbon Waste</span>
            <span class="text-sm font-mono text-purple font-bold">4,800 KWH / YR</span>
          </div>
          <div class="card-desc">
            Eliminates always-on redundant staging clusters, conserving <strong class="text-white">4,800 kWh/year</strong> of cloud server power per enterprise, reducing ~3.4 metric tons of CO2 emissions.
          </div>
        </div>

        <div class="feature-card border-amber">
          <div class="card-header-row">
            <span class="card-title-text text-amber"><span class="point-pill pill-amber">COMMERCIAL</span> Compelling Enterprise ROI & Breakeven</span>
            <span class="text-sm font-mono text-amber font-bold">90&times; CUSTOMER ROI</span>
          </div>
          <div class="card-desc">
            A single prevented 45-minute cascading outage during festive peak saves an Indian e-commerce platform <strong class="text-emerald">₹2.25 Crores</strong>, yielding an immediate 90&times; return on annual subscription.
          </div>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/05_2_chaos_matrix_after_hardening.png", label: "Figure 19.1: Technical Verification: 40-Scenario Chaos Matrix Passed" },
      { src: "assets/10_executive_postmortem_report.png", label: "Figure 19.2: Financial Verification: Live Rupee Loss Telemetry & ROI" }
    ],
    speakerNotes: "Slide 19 covers Component 13: Expected Outcomes across four dimensions. Technically, we deliver a 95ms engine with 92% MTTR reduction. Socially, we eliminate the dreaded 3 AM on-call emergency, preventing engineer burnout. Environmentally, by replacing 24/7 idle staging clusters with on-demand browser simulation, we conserve 4,800 kilowatt-hours of server power per company. Commercially, preventing just one festive outage delivers a 90x return on investment."
  },
  {
    id: 20,
    pmeCategory: "COMPONENT 14 • ENTREPRENEURIAL PITCH & CALL TO ACTION",
    title: "Entrepreneurial Pitch & The Ask",
    subtitle: "Summary, Customer ROI, 3-Year Strategic Roadmap & Live Demonstration",
    glanceSummary: "<strong>Seed Ask: ₹36 Lakhs</strong> for 18-month runway. 30 enterprise clients = <strong>₹4.8 Cr ARR</strong> with Month 8 breakeven. <strong>Live in production right now</strong>.",
    badges: [
      { text: "90x Customer ROI", color: "cyan" },
      { text: "Seed Funding: ₹36 Lakhs", color: "emerald" },
      { text: "Live Demo Ready", color: "purple" }
    ],
    leftContent: `
      <div class="stat-grid">
        <div class="stat-card stat-emerald">
          <div class="stat-num text-emerald">₹36 L</div>
          <div class="stat-label">Seed Capital Ask (18-Month GTM & Dev Runway)</div>
        </div>
        <div class="stat-card stat-cyan">
          <div class="stat-num text-cyan">₹4.8 Cr</div>
          <div class="stat-label">Year 2 ARR Target (30 Enterprise Accounts @ ₹16L)</div>
        </div>
        <div class="stat-card stat-amber">
          <div class="stat-num text-amber">Month 8</div>
          <div class="stat-label">Operating Cashflow Breakeven Point</div>
        </div>
      </div>

      <div class="card-stack">
        <div class="feature-card border-cyan">
          <div class="card-header-row">
            <span class="card-title-text text-cyan"><span class="point-pill pill-cyan">PITCH SUMMARY</span> The Autonomous Resilience Digital Twin</span>
          </div>
          <div class="card-desc">
            CascadeLab transforms microservice resilience from reactive firefighting into design-time certainty. We combine Generative AI DAG compilation, sub-second fluid simulation, autonomous AIOps self-healing, and real-time financial telemetry into a zero-backend platform.
          </div>
        </div>

        <div class="feature-card border-purple">
          <div class="card-header-row">
            <span class="card-title-text text-purple"><span class="point-pill pill-purple">ROADMAP</span> 3-Year Strategic Execution Milestones</span>
          </div>
          <div class="card-desc">
            <div class="point-row"><span class="point-pill pill-cyan">Q1 2027</span> <span class="text-slate"><strong class="text-white">CI/CD GitHub Action Gate:</strong> Automatically simulates and blocks fragile microservice PRs before merge.</span></div>
            <div class="point-row"><span class="point-pill pill-emerald">Q2 2027</span> <span class="text-slate"><strong class="text-white">OpenTelemetry Ingestion:</strong> Ingests live production Jaeger/Zipkin traces to mirror production twins automatically.</span></div>
            <div class="point-row"><span class="point-pill pill-amber">Q3 2027</span> <span class="text-slate"><strong class="text-white">Multi-Region Cloud DR:</strong> Cross-cloud failover simulation across AWS, Azure, and Google Cloud.</span></div>
          </div>
        </div>

        <div style="margin-top: 6px;">
          <a href="https://cascade-lab.vercel.app/" target="_blank" class="live-cta-button">
            <span>🚀 Launch Live Production Platform: cascade-lab.vercel.app</span>
            <span style="font-size: 14px;">&rarr;</span>
          </a>
        </div>
      </div>
    `,
    rightImages: [
      { src: "assets/04_sre_command_center_telemetry.jpg", label: "Figure 20.1: SRE Command Center Telemetry Platform" },
      { src: "assets/10_executive_postmortem_report.png", label: "Figure 20.2: One-Click Executive SRE Postmortem Generator" }
    ],
    speakerNotes: "Slide 20 concludes with Component 14: Final Presentation and Entrepreneurial Pitch. In summary, CascadeLab solves a multi-billion dollar crisis by replacing dangerous production chaos and expensive staging with a zero-cost browser digital twin. We are raising ₹36 Lakhs in seed capital to accelerate enterprise integrations. With 30 enterprise clients, we will generate ₹4.8 Crores in Annual Recurring Revenue and reach cashflow breakeven in Month 8. The platform is not a mockup—it is live in production right now at cascade-lab.vercel.app. We welcome your questions."
  }
];

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CascadeLab — PME Entrepreneurial Solution & Project Proposal</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  
  <!-- Client-side PPTX generation bundle -->
  <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>

  <style>
    :root {
      --bg-dark: #070B14;
      --bg-card: #0F172A;
      --border-card: rgba(255, 255, 255, 0.08);
      --cyan: #38BDF8;
      --cyan-glow: rgba(56, 189, 248, 0.25);
      --emerald: #10B981;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      --purple: #A855F7;
      --purple-glow: rgba(168, 85, 247, 0.25);
      --amber: #F59E0B;
      --crimson: #EF4444;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --font-heading: 'Outfit', sans-serif;
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-body);
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      user-select: none;
    }

    /* Top Navigation Header Redesign */
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(7, 11, 20, 0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(56, 189, 248, 0.18);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      z-index: 100;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      font-family: var(--font-heading);
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 9px;
      text-decoration: none;
    }

    .brand-logo-text {
      background: linear-gradient(135deg, #FFFFFF, var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .live-pulse-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      background: var(--emerald);
      border-radius: 50%;
      box-shadow: 0 0 12px var(--emerald);
      animation: pulse-emerald 2s infinite ease-in-out;
    }

    @keyframes pulse-emerald {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); box-shadow: 0 0 4px var(--emerald); }
    }

    .brand-tag-group {
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 1px solid rgba(255, 255, 255, 0.12);
      padding-left: 14px;
    }

    .brand-pill {
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 800;
      background: rgba(56, 189, 248, 0.12);
      color: var(--cyan);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .brand-desc {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* Center Navigation Pill */
    .nav-center-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 30px;
      padding: 5px 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .nav-arrow-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      font-size: 14px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-arrow-btn:hover {
      background: rgba(56, 189, 248, 0.2);
      border-color: var(--cyan);
      color: var(--cyan);
      transform: scale(1.05);
    }

    .slide-counter {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 700;
    }

    .slide-num-current {
      color: var(--cyan);
    }

    .slide-divider {
      color: rgba(255, 255, 255, 0.3);
    }

    .slide-num-total {
      color: var(--text-muted);
    }

    .nav-mini-progress {
      width: 110px;
      height: 5px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
      overflow: hidden;
    }

    .nav-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--cyan), var(--emerald));
      transition: width 0.3s ease;
    }

    .pct-badge {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--emerald);
      font-weight: 700;
      min-width: 32px;
      text-align: right;
    }

    /* Right Controls */
    .nav-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 3px;
      border-radius: 8px;
    }

    .nav-btn {
      background: transparent;
      border: none;
      color: #CBD5E1;
      font-family: var(--font-mono);
      font-size: 11.5px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .nav-btn:hover {
      background: rgba(56, 189, 248, 0.15);
      color: var(--cyan);
    }

    .live-app-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #059669, #10B981);
      color: #FFFFFF;
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 800;
      padding: 7px 14px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
      border: 1px solid rgba(16, 185, 129, 0.5);
      transition: all 0.25s ease;
    }

    .live-app-badge:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 24px rgba(16, 185, 129, 0.6);
    }

    .live-radar-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      background: #FFFFFF;
      border-radius: 50%;
      animation: pulse-emerald 1.5s infinite;
    }

    /* Main Slide Stage */
    .slide-viewport {
      position: absolute;
      top: 60px;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .slide {
      position: absolute;
      width: calc(100vw - 48px);
      max-width: 1680px;
      height: calc(100vh - 84px);
      max-height: 940px;
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      overflow: hidden;
      opacity: 0;
      transform: translateX(40px) scale(0.99);
      pointer-events: none;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .slide.active {
      opacity: 1;
      transform: translateX(0) scale(1);
      pointer-events: auto;
      z-index: 10;
    }

    .slide.prev {
      opacity: 0;
      transform: translateX(-40px) scale(0.99);
    }

    /* Slide Left Pane */
    .slide-left {
      padding: 32px 36px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      border-right: 1px solid var(--border-card);
      justify-content: flex-start;
    }

    .slide-header {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .category-tag {
      display: inline-block;
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 700;
      color: var(--cyan);
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .slide-tag-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 700;
      color: var(--cyan);
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    /* Presentation / PPT Full-Bleed 16:9 Styles */
    body.ppt-mode .top-bar { display: none !important; }
    body.ppt-mode .slide-viewport { top: 0 !important; padding: 0 !important; }
    body.ppt-mode .slide {
      display: none !important;
    }
    body.ppt-mode .slide.active {
      display: grid !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 1920px !important;
      max-width: 1920px !important;
      height: 1080px !important;
      max-height: 1080px !important;
      border-radius: 0 !important;
      border: none !important;
      box-shadow: none !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
    body.ppt-mode .slide-left {
      padding: 40px 48px !important;
    }
    body.ppt-mode .slide-right {
      padding: 30px !important;
    }
    body.ppt-mode .image-card img {
      height: 380px !important;
    }
    body.ppt-mode .image-label::after { display: none !important; }

    .slide-title {
      font-family: var(--font-heading);
      font-size: 34px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.5px;
      color: #FFFFFF;
    }

    .slide-subtitle {
      font-size: 15px;
      font-weight: 500;
      color: #94A3B8;
      line-height: 1.35;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .badge {
      font-size: 11px;
      font-family: var(--font-mono);
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .badge-cyan { background: rgba(56, 189, 248, 0.12); color: var(--cyan); border: 1px solid rgba(56, 189, 248, 0.25); }
    .badge-emerald { background: rgba(16, 185, 129, 0.12); color: var(--emerald); border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-purple { background: rgba(168, 85, 247, 0.12); color: var(--purple); border: 1px solid rgba(168, 85, 247, 0.25); }
    .badge-amber { background: rgba(245, 158, 11, 0.12); color: var(--amber); border: 1px solid rgba(245, 158, 11, 0.25); }
    .badge-crimson { background: rgba(239, 68, 68, 0.12); color: var(--crimson); border: 1px solid rgba(239, 68, 68, 0.25); }

    /* 2-Second Glance Banner */
    .glance-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 6px;
      margin-bottom: 4px;
    }

    .glance-badge {
      background: linear-gradient(135deg, #38BDF8, #0284C7);
      color: #070B14;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 800;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      letter-spacing: 0.5px;
    }

    .glance-text {
      font-size: 13.5px;
      color: #E2E8F0;
      line-height: 1.45;
    }

    .glance-text strong {
      color: #FFFFFF;
    }

    /* Stat Grid */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px 14px;
      text-align: left;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.stat-crimson { border-color: rgba(239, 68, 68, 0.35); background: rgba(239, 68, 68, 0.07); }
    .stat-card.stat-emerald { border-color: rgba(16, 185, 129, 0.35); background: rgba(16, 185, 129, 0.07); }
    .stat-card.stat-cyan { border-color: rgba(56, 189, 248, 0.35); background: rgba(56, 189, 248, 0.07); }
    .stat-card.stat-amber { border-color: rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.07); }
    .stat-card.stat-purple { border-color: rgba(168, 85, 247, 0.35); background: rgba(168, 85, 247, 0.07); }

    .stat-num {
      font-family: var(--font-heading);
      font-size: 30px;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 11.5px;
      font-family: var(--font-body);
      color: var(--text-muted);
      line-height: 1.35;
    }

    /* Feature & Highlight Cards */
    .card-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .feature-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-left: 4px solid var(--cyan);
      border-radius: 10px;
      padding: 12px 16px;
    }

    .feature-card.border-cyan { border-left-color: var(--cyan); }
    .feature-card.border-emerald { border-left-color: var(--emerald); }
    .feature-card.border-crimson { border-left-color: var(--crimson); }
    .feature-card.border-amber { border-left-color: var(--amber); }
    .feature-card.border-purple { border-left-color: var(--purple); }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .card-title-text {
      font-size: 14.5px;
      font-weight: 700;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-desc {
      font-size: 13px;
      color: #CBD5E1;
      line-height: 1.5;
    }

    .point-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #CBD5E1;
      line-height: 1.45;
      margin-top: 5px;
    }

    .point-pill {
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 4px;
      white-space: nowrap;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .pill-cyan { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .pill-emerald { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); }
    .pill-crimson { background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .pill-amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
    .pill-purple { background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.3); }

    .formula-box {
      font-family: var(--font-mono);
      font-size: 13px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 6px;
      padding: 8px 12px;
      color: #38BDF8;
      overflow-x: auto;
      white-space: pre-wrap;
    }

    .code-pill {
      font-family: var(--font-mono);
      font-size: 11px;
      background: rgba(0, 0, 0, 0.35);
      color: #38BDF8;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }

    /* Text Color Utilities */
    .text-cyan { color: #38BDF8 !important; }
    .text-emerald { color: #10B981 !important; }
    .text-crimson { color: #EF4444 !important; }
    .text-amber { color: #F59E0B !important; }
    .text-purple { color: #C084FC !important; }
    .text-white { color: #FFFFFF !important; }
    .text-slate { color: #CBD5E1 !important; }
    .text-muted { color: #94A3B8 !important; }

    /* Team Roster Grid (Slide 1) */
    .team-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .roster-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .roster-role {
      font-size: 10.5px;
      font-family: var(--font-mono);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .roster-name {
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
    }

    .roster-duty {
      font-size: 11.5px;
      color: var(--text-muted);
      line-height: 1.35;
    }

    /* CPM Schedule Table */
    .cpm-table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .cpm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      text-align: left;
    }

    .cpm-table th {
      background: rgba(15, 23, 42, 0.9);
      padding: 8px 12px;
      color: var(--cyan);
      font-family: var(--font-mono);
      font-weight: 700;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .cpm-table td {
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #CBD5E1;
    }

    .cpm-table tr.crit-row {
      background: rgba(239, 68, 68, 0.08);
    }

    /* Live CTA Button (Slide 20) */
    .live-cta-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, var(--cyan), #0284C7);
      color: #070B14;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 20px var(--cyan-glow);
      transition: all 0.2s ease;
    }

    .live-cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px var(--cyan-glow);
    }

    /* Slide Right Pane (Images) */
    .slide-right {
      background: #060913;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .image-card {
      width: 100%;
      background: #0B1120;
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      cursor: zoom-in;
      transition: all 0.25s ease;
      display: flex;
      flex-direction: column;
    }

    .image-card:hover {
      border-color: var(--cyan);
      box-shadow: 0 10px 30px var(--cyan-glow);
      transform: translateY(-2px);
    }

    .image-card img {
      width: 100%;
      height: 330px;
      object-fit: contain;
      background: #040711;
      display: block;
    }

    .image-label {
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--text-muted);
      padding: 6px 12px;
      background: #0F172A;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .image-label::after {
      content: '🔍 Click to Zoom';
      font-size: 9px;
      color: var(--cyan);
      opacity: 0.8;
    }

    /* Speaker Notes Drawer */
    .speaker-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 180px;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border-top: 2px solid var(--cyan);
      padding: 16px 32px;
      z-index: 90;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .speaker-drawer.open {
      transform: translateY(0);
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .drawer-title {
      font-size: 12px;
      font-family: var(--font-mono);
      font-weight: 700;
      color: var(--cyan);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .drawer-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
    }

    .drawer-content {
      font-size: 13px;
      line-height: 1.6;
      color: #E2E8F0;
      overflow-y: auto;
      font-family: var(--font-body);
    }

    /* Overview Grid Modal */
    .overview-modal {
      position: fixed;
      inset: 0;
      background: rgba(7, 11, 20, 0.95);
      backdrop-filter: blur(20px);
      z-index: 200;
      display: none;
      flex-direction: column;
      padding: 32px;
      overflow-y: auto;
    }

    .overview-modal.open {
      display: flex;
    }

    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .thumb-card {
      background: var(--bg-card);
      border: 1px solid var(--border-card);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .thumb-card:hover, .thumb-card.active {
      border-color: var(--cyan);
      box-shadow: 0 0 20px var(--cyan-glow);
    }

    .thumb-num {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--cyan);
      font-weight: 700;
    }

    .thumb-title {
      font-size: 13px;
      font-weight: 600;
      margin-top: 4px;
      color: #FFFFFF;
    }

    /* Lightbox Modal */
    .lightbox-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(16px);
      z-index: 300;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }

    .lightbox-modal.open {
      display: flex;
    }

    .lightbox-img {
      max-width: 95vw;
      max-height: 92vh;
      border-radius: 8px;
      box-shadow: 0 0 50px rgba(56, 189, 248, 0.3);
      border: 1px solid var(--cyan);
    }

    .lightbox-close {
      position: absolute;
      top: 24px;
      right: 32px;
      color: #FFFFFF;
      font-size: 32px;
      background: transparent;
      border: none;
      cursor: pointer;
    }

    /* Publication-Grade Math Display Typography */
    .math-display {
      background: rgba(2, 6, 23, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 8px;
      padding: 8px 14px;
      margin: 6px 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif;
      font-size: 15.5px;
      color: #F8FAFC;
      letter-spacing: 0.5px;
      overflow-x: auto;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    }
    .math-formula {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cambria Math', 'STIX Two Math', 'Times New Roman', serif;
      font-size: 15.5px;
      color: #F8FAFC;
      letter-spacing: 0.5px;
    }
    .math-row {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .math-var {
      font-style: italic;
      color: #38BDF8;
      font-weight: 600;
      padding: 0 1px;
    }
    .math-sub {
      font-size: 11px;
      vertical-align: sub;
      color: #94A3B8;
      font-style: normal;
      margin-left: 1px;
    }
    .math-sup {
      font-size: 11px;
      vertical-align: super;
      color: #C084FC;
      font-style: normal;
      margin-left: 1px;
    }
    .math-op {
      margin: 0 4px;
      color: #E2E8F0;
      font-style: normal;
      font-weight: 500;
    }
    .math-frac {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      padding: 0 4px;
      margin: 0 3px;
    }
    .math-num {
      border-bottom: 1.5px solid #E2E8F0;
      padding: 0 3px 2px 3px;
      text-align: center;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .math-den {
      padding: 2px 3px 0 3px;
      text-align: center;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .math-sqrt-box {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      margin: 0 2px;
    }
    .math-radical {
      font-size: 20px;
      line-height: 1;
      margin-right: -1px;
      color: #38BDF8;
    }
    .math-radicand {
      border-top: 1.5px solid #38BDF8;
      padding: 2px 4px 1px 2px;
    }
    .math-sum-block {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      margin: 0 4px;
      vertical-align: middle;
    }
    .math-sum-sym {
      font-size: 24px;
      line-height: 1;
      color: #A855F7;
    }
    .math-sum-sub {
      font-size: 10px;
      color: #94A3B8;
      margin-top: -4px;
    }
    .math-notes {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-family: var(--font-body);
      font-size: 11.5px;
      color: var(--text-muted);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 8px;
    }
    .math-notes div strong {
      color: #FFFFFF;
    }

    /* Slide 2: Retry Storm Animation Box */
    .anim-storm-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .storm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 6px;
    }
    .storm-flow-svg {
      width: 100%;
      height: 60px;
      overflow: visible;
    }
    .anim-packet {
      animation: move-packet 2.5s infinite linear;
    }
    .p-fast { animation-duration: 1.8s; }
    .p-mid { animation-duration: 2.2s; }
    .p-slow { animation-duration: 2.8s; }
    @keyframes move-packet {
      0% { transform: translateX(0); opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { transform: translateX(330px); opacity: 0; }
    }

    /* Slide 5: Queue Saturation Curve */
    .anim-math-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .queue-curve-svg {
      width: 100%;
      height: 75px;
    }
    .anim-pulse-point {
      animation: pulse-clamp 1.6s infinite ease-in-out;
    }
    @keyframes pulse-clamp {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.6); opacity: 0.6; }
    }

    /* Slide 7: Live Simulated Telemetry Stream */
    .telemetry-live-stream {
      background: rgba(2, 6, 23, 0.9);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
    }
    .stream-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 6px;
    }
    .defcon-badge-anim {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.2);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .defcon-beacon {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #EF4444;
      animation: defcon-pulse 1s infinite alternate;
    }
    @keyframes defcon-pulse {
      0% { opacity: 0.3; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1.3); box-shadow: 0 0 8px #EF4444; }
    }
    .live-tag {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      color: var(--emerald);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .live-dot-pulse {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--emerald);
      animation: pulse-emerald 1.5s infinite;
    }
    .stream-logs {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: 11px;
    }
    .log-entry {
      color: #CBD5E1;
      line-height: 1.35;
    }
    .highlight-log {
      background: rgba(16, 185, 129, 0.12);
      border-left: 2px solid var(--emerald);
      padding: 2px 6px;
      border-radius: 2px;
    }

    /* Slide 10: Synchronized Scrubbing Timeline */
    .anim-scrub-box {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .timeline-track {
      position: relative;
      height: 28px;
      display: flex;
      align-items: center;
    }
    .timeline-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .timeline-fill-bar {
      height: 100%;
      width: 25%;
      background: linear-gradient(90deg, #10B981, #EF4444);
    }
    .timeline-inflection-marker {
      position: absolute;
      left: 25%;
      top: -2px;
      bottom: -2px;
      width: 2px;
      background: #EF4444;
      box-shadow: 0 0 6px #EF4444;
      z-index: 2;
    }
    .timeline-moving-scrubber {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #38BDF8;
      box-shadow: 0 0 8px #38BDF8;
      animation: scrub-sweep 6s infinite linear;
      z-index: 3;
    }
    @keyframes scrub-sweep {
      0% { left: 0%; }
      100% { left: 100%; }
    }
    .timeline-labels {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <!-- Top Bar Redesign -->
  <header class="top-bar">
    <div class="brand-section">
      <div class="brand-logo">
        <span class="live-pulse-dot"></span>
        <span class="brand-logo-text">CascadeLab</span>
      </div>
      <div class="brand-tag-group">
        <span class="brand-pill">PME AAT</span>
        <span class="brand-desc">Distributed Systems Resilience Digital Twin</span>
      </div>
    </div>

    <!-- Center Navigation Pill -->
    <div class="nav-center-pill">
      <button class="nav-arrow-btn" onclick="prevSlide()" title="Previous Slide (&larr; or PageUp)">&larr;</button>
      <div class="slide-counter">
        <span class="slide-num-current" id="slideIndicator">01</span>
        <span class="slide-divider">/</span>
        <span class="slide-num-total">20</span>
      </div>
      <div class="nav-mini-progress">
        <div class="nav-progress-fill" id="progressFill" style="width: 5%;"></div>
      </div>
      <span class="pct-badge" id="percentIndicator">5%</span>
      <button class="nav-arrow-btn" onclick="nextSlide()" title="Next Slide (&rarr; or Space)">&rarr;</button>
    </div>

    <!-- Right Controls -->
    <div class="nav-controls">
      <div class="btn-group">
        <button class="nav-btn" onclick="toggleOverview()" title="Slide Grid (O)"><span>&#x25A6;</span> Overview</button>
        <button class="nav-btn" onclick="toggleNotes()" title="Speaker Notes (S)"><span>&#x1F4AC;</span> Notes</button>
        <button class="nav-btn" onclick="toggleFullscreen()" title="Fullscreen (F)"><span>&#x26F6;</span> Fullscreen</button>
        <button class="nav-btn" onclick="exportPPTX()" title="Export PowerPoint .pptx"><span>&#x1F4E5;</span> PPTX</button>
        <button class="nav-btn" onclick="window.print()" title="Print / PDF"><span>&#x1F5B6;</span> PDF</button>
      </div>
      <a href="https://cascade-lab.vercel.app/" target="_blank" class="live-app-badge" title="Open live production platform">
        <span class="live-radar-dot"></span>
        <span>cascade-lab.vercel.app &nearr;</span>
      </a>
    </div>
  </header>

  <!-- Slide Stage -->
  <main class="slide-viewport">
    ${slides.map((s, idx) => `
      <article class="slide ${idx === 0 ? 'active' : ''}" id="slide-${s.id}" data-index="${idx}">
        <div class="slide-left">
          <div class="slide-header">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span class="category-tag">${s.pmeCategory}</span>
              <span class="slide-tag-pill font-mono">SLIDE ${(idx + 1).toString().padStart(2, '0')} / 20</span>
            </div>
            <h2 class="slide-title">${s.title}</h2>
            <div class="slide-subtitle">${s.subtitle}</div>
            <div class="badge-row">
              ${s.badges.map(b => `<span class="badge badge-${b.color}">${b.text}</span>`).join('')}
            </div>
            <div class="glance-bar">
              <span class="glance-badge">&#x26A1; 2-SEC GLANCE</span>
              <span class="glance-text">${s.glanceSummary}</span>
            </div>
          </div>
          <div class="slide-body">
            ${s.leftContent}
          </div>
        </div>
        <div class="slide-right">
          ${s.rightImages.map(img => `
            <div class="image-card" onclick="openLightbox('${img.src}')">
              <img src="${img.src}" alt="${img.label}">
              <div class="image-label">
                <span>${img.label}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </article>
    `).join('')}
  </main>

  <!-- Speaker Notes Drawer -->
  <aside class="speaker-drawer" id="speakerDrawer">
    <div class="drawer-header">
      <div class="drawer-title">&#x1F399;&#xFE0F; SPEAKER SCRIPT & PITCH NOTES — SLIDE <span id="notesSlideNum">1</span></div>
      <button class="drawer-close" onclick="toggleNotes()">&times;</button>
    </div>
    <div class="drawer-content" id="notesContent"></div>
  </aside>

  <!-- Overview Grid Modal -->
  <div class="overview-modal" id="overviewModal">
    <div class="overview-header">
      <h2 style="font-family: var(--font-heading); color: #FFFFFF;">Slide Deck Overview (20 Slides)</h2>
      <button class="nav-btn" onclick="toggleOverview()">&times; Close</button>
    </div>
    <div class="overview-grid">
      ${slides.map((s, idx) => `
        <div class="thumb-card" onclick="goToSlide(${idx})">
          <div class="thumb-num">SLIDE ${(idx + 1).toString().padStart(2, '0')} • ${s.pmeCategory.split('•')[0].trim()}</div>
          <div class="thumb-title">${s.title}</div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Lightbox Modal -->
  <div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox()">
    <button class="lightbox-close">&times;</button>
    <img src="" alt="Enlarged Visual" class="lightbox-img" id="lightboxImg">
  </div>

  <!-- Interactive Presentation Engine Script -->
  <script>
    const slidesData = ${JSON.stringify(slides.map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle, pmeCategory: s.pmeCategory, notes: s.speakerNotes })))};
    let currentSlide = 0;
    const totalSlides = slidesData.length;

    function updateSlideUI() {
      // Update active slide class
      document.querySelectorAll('.slide').forEach((el, idx) => {
        el.classList.remove('active', 'prev');
        if (idx === currentSlide) el.classList.add('active');
        else if (idx < currentSlide) el.classList.add('prev');
      });

      // Update progress bar
      const pct = Math.round(((currentSlide + 1) / totalSlides) * 100);
      document.getElementById('progressFill').style.width = pct + '%';
      document.getElementById('slideIndicator').textContent = (currentSlide + 1).toString().padStart(2, '0');
      document.getElementById('percentIndicator').textContent = pct + '%';

      // Update speaker notes
      document.getElementById('notesSlideNum').textContent = currentSlide + 1;
      document.getElementById('notesContent').textContent = slidesData[currentSlide].notes;

      // Update overview thumb active state
      document.querySelectorAll('.thumb-card').forEach((el, idx) => {
        el.classList.toggle('active', idx === currentSlide);
      });
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlideUI();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlideUI();
      }
    }

    function goToSlide(idx) {
      if (idx >= 0 && idx < totalSlides) {
        currentSlide = idx;
        updateSlideUI();
        document.getElementById('overviewModal').classList.remove('open');
      }
    }

    function toggleNotes() {
      document.getElementById('speakerDrawer').classList.toggle('open');
    }

    function toggleOverview() {
      document.getElementById('overviewModal').classList.toggle('open');
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    function openLightbox(src) {
      document.getElementById('lightboxImg').src = src;
      document.getElementById('lightboxModal').classList.add('open');
    }

    function closeLightbox() {
      document.getElementById('lightboxModal').classList.remove('open');
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(totalSlides - 1);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          toggleNotes();
          break;
        case 'o':
        case 'O':
          e.preventDefault();
          toggleOverview();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          closeLightbox();
          document.getElementById('overviewModal').classList.remove('open');
          document.getElementById('speakerDrawer').classList.remove('open');
          break;
      }
    });

    // Download pre-compiled high-res PowerPoint deck
    function exportPPTX() {
      const link = document.createElement('a');
      link.href = 'CascadeLab_PME_AAT_Presentation.pptx';
      link.download = 'CascadeLab_PME_AAT_Presentation.pptx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Initialize UI on load
    updateSlideUI();
  </script>
</body>
</html>
`;

const targetHtmlPath = path.resolve(__dirname, '../presentation/index.html');
fs.writeFileSync(targetHtmlPath, htmlContent, 'utf8');

console.log('Successfully generated presentation HTML at:', targetHtmlPath);
console.log('Total characters:', htmlContent.length);

module.exports = { slides };
