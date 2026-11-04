# Component 8: Detailed Cost Estimation & Budget

**Course / Assessment:** Alternative Assessment Technique (AAT)  
**Theme:** Real-World Engineering Problem $\rightarrow$ Technically Feasible & Commercially Viable Solution  
**Project Title:** **CascadeLab — A Resilience Digital Twin & Chaos Simulation Platform for Distributed Microservices**  
**Team Size:** 4 Students (ISE / CSE)  

---

## 8.1 Academic Phase: Actual Incurred Development Budget (₹0 Direct Cash)

Through deliberate architectural choices—prioritizing client-side Web Worker execution, open-source libraries, and serverless edge delivery—the development team successfully engineered the entire CascadeLab platform with **zero direct out-of-pocket cash expenditure**:

| Expenditure Category | Resource Description | Commercial Equivalent Value | Actual Incurred Cost | Funding / Sourcing Mechanism |
|---|---|---|:---:|---|
| **Development Hardware** | 4x Personal Laptops (16GB RAM, Core i7/M-Series) | ₹3,20,000 | **₹0.00** | Existing student academic hardware |
| **Hosting & CDN** | Vercel Serverless Edge Global Distribution | ₹18,000 / year | **₹0.00** | Vercel Free Hobby Tier (`cascadelab.vercel.app`) |
| **Code Repository & CI**| GitHub Team Collaboration & Automated Actions | ₹12,000 / year | **₹0.00** | GitHub Public Open-Source Free Tier |
| **Generative AI Inference**| Google Gemini 2.5 Flash Structured JSON API | ₹15,000 / quota | **₹0.00** | Google AI Studio Free Tier + Offline Heuristic Fallback |
| **Visualization Libraries**| `@xyflow/react` + Dagre Layout Engine | ₹25,000 (Commercial) | **₹0.00** | MIT Open-Source Community License |
| **Testing & PDF Export** | Vitest 2.1 + jsPDF Engine | ₹10,000 | **₹0.00** | MIT Open-Source Community License |
| **Total Direct Cash Outflow** | **Complete Academic Engineering Phase** | **₹4,00,000+** | **₹0.00** | **100% Bootstrap / Zero Cash Expenditure** |

---

## 8.2 Notional Project Development Cost (Engineering Manpower Valuation)

While direct cash expenditure was ₹0, the academic valuation of the project based on market-standard engineering compensation reflects substantial technical investment:

$$\text{Notional Manpower Value} = 4\text{ Engineers} \times 9\text{ Weeks} \times 20\text{ Hours/Week} \times ₹900\text{/Hour} = \mathbf{₹6,48,000\text{ (₹6.48 Lakhs)}}$$

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      NOTIONAL ENGINEERING EFFORT BREAKDOWN                             │
├──────────────────┬─────────────────────────────┬─────────────┬───────────┬─────────────┤
│ TEAM MEMBER      │ ROLE TITLE                  │ TOTAL HOURS │ HOURLY    │ NOTIONAL    │
│                  │                             │ (9 WEEKS)   │ RATE (₹)  │ VALUATION   │
├──────────────────┼─────────────────────────────┼─────────────┼───────────┼─────────────┤
│ Nischay Kumar    │ Principal Systems Architect │ 200 Hours   │ ₹1,000/hr │ ₹2,00,000   │
│ Suchith N        │ Frontend & AI Graphics Lead │ 180 Hours   │ ₹900/hr   │ ₹1,62,000   │
│ Uday Kumar       │ Chaos & Intelligence Lead   │ 170 Hours   │ ₹900/hr   │ ₹1,53,000   │
│ Sthambaj         │ AIOps, QA & Business Lead   │ 170 Hours   │ ₹800/hr   │ ₹1,33,000   │
├──────────────────┴─────────────────────────────┴─────────────┼───────────┼─────────────┤
│ TOTAL NOTIONAL ENGINEERING INVESTMENT                        │ 720 Hours │ ₹6,48,000   │
└──────────────────────────────────────────────────────────────┴───────────┴─────────────┘
```

---

## 8.3 Infrastructure Cost Savings vs. Traditional Chaos Engineering

Traditional chaos testing platforms (e.g., Gremlin, Chaos Mesh) require maintaining dedicated cloud clusters running synthetic workloads 24/7. CascadeLab's browser-native digital twin eliminated massive cloud infrastructure costs:

```mermaid
barChart
    title Infrastructure Cost Comparison (9 Months Engineering): Cloud vs CascadeLab
    x-axis ["EKS Cluster", "Chaos Tooling", "APM Ingestion", "Load Gen", "Total Expended"]
    y-axis "Cost in ₹ Thousands" 0 --> 1200
    "Traditional Cloud Lab" : [288, 450, 225, 189, 1152]
    "CascadeLab (Zero-Backend)" : [0, 0, 0, 0, 0]
```

* **AWS EKS Compute Savings:** 3-node Kubernetes cluster ($c5.large$) avoided: $\$320/\text{mo} \times 9 = \$2,880$ (₹2,40,000).
* **Enterprise Chaos SaaS Avoided:** Commercial Gremlin / Chaos Monkey licensing: $\$500/\text{mo} \times 9 = \$4,500$ (₹3,75,000).
* **APM Ingestion Avoided:** Datadog host & custom metrics telemetry fees: $\$250/\text{mo} \times 9 = \$2,250$ (₹1,87,500).
* **Synthetic Load Gen Avoided:** Distributed k6 cloud execution credits: $\$210/\text{mo} \times 9 = \$1,890$ (₹1,57,500).
* **Net Avoided Cloud Infrastructure Expenditure:** **₹11,52,000 (₹11.52 Lakhs Avoided)**.

---

## 8.4 Real-Time Financial Telemetry & Enterprise ROI Model

CascadeLab features a built-in financial damage telemetry engine that translates technical drop rates directly into quantifiable business losses:
$$L_{\text{financial}} = \sum_{t=0}^{T} \text{DroppedRequests}(t) \times \text{GMV}_{\text{per\_req}}$$

* **Case Example (ShopFast Flash Sale):**  
  At an ingress rate of $4,500\text{ RPS}$ and transaction value of ₹40/req, an uncontained 2-minute cascading retry storm dropping $54,000\text{ requests}$ results in:
  $$\text{Direct Financial Loss} = 54,000 \times ₹40 = \mathbf{₹21,60,000\text{ (₹21.6 Lakhs)}}$$
* **CascadeLab ROI Justification:** By simulating this failure pre-deployment, the Auto-Harden engine recommends adding exponential backoff and a 50% circuit breaker fast-fail, completely eliminating queue backlog and preventing ₹21.6 Lakhs in lost GMV. For an enterprise paying \$1,499/month for CascadeLab, preventing a single 15-minute outage delivers a **$90\times\text{ return on investment (ROI)}$**.

---

## 8.5 Commercial Phase: 12-Month SaaS Operational Budget (Commercialization Viability)

To scale CascadeLab from an academic digital twin to a commercial Enterprise SaaS platform, a realistic Year-1 operational budget of **₹36,00,000 (₹36.0 Lakhs)** is projected:

| Budget Item | Operational Justification | Monthly Cost | Annual Cost (₹) |
|---|---|---|:---:|
| **Edge Hosting & Enterprise CDN** | Vercel Enterprise + Cloudflare Pro DDoS protection | ₹15,000 | ₹1,80,000 |
| **Generative AI Inference Tokens** | Google Gemini 2.5 Flash API commercial enterprise tier | ₹30,000 | ₹3,60,000 |
| **Core Engineering R&D** | 2 Full-time Systems / Frontend Engineers | ₹2,00,000 | ₹24,00,000 |
| **Developer Marketing & SRE Evangelism**| SRE conference sponsorships, tech blogs, developer advocacy | ₹37,500 | ₹4,50,000 |
| **Legal, Incorporation & Patents** | Company registration, trademarking, IP protection, legal compliance | — | ₹2,10,000 |
| **Total Year-1 Operational Budget** | **Commercial SaaS Runway (Seed / Bootstrap Phase)** | **₹3,00,000 / mo** | **₹36,00,000** |

---

## 8.6 Commercial Pricing Strategy & Revenue Unit Economics

CascadeLab adopts a **Product-Led Growth (PLG)** freemium monetization model designed to capture developer mindshare before monetizing enterprise infrastructure teams:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          COMMERCIAL PRICING TIERS                                      │
├───────────────────┬──────────────────────┬─────────────────────────────────────────────┤
│ PLAN TIER         │ PRICE                │ TARGET AUDIENCE & CORE CAPABILITIES         │
├───────────────────┼──────────────────────┼─────────────────────────────────────────────┤
│ 1. Community      │ ₹0 / Forever Free    │ Individual engineers, students, academia.   │
│    (Open-Source)  │                      │ • Full fluid queueing simulation kernel     │
│                   │                      │ • Offline heuristic AI architecture compiler│
│                   │                      │ • Up to 15 service nodes & URL sharing      │
├───────────────────┼──────────────────────┼─────────────────────────────────────────────┤
│ 2. Developer Pro  │ $49 / month          │ Senior architects, consultants, startups.   │
│                   │ (₹3,999 / mo)        │ • Gemini 2.5 Flash / Pro unlimited synthesis│
│                   │                      │ • Split-Screen synchronized comparative view│
│                   │                      │ • Automated Executive PDF Postmortem reports│
├───────────────────┼──────────────────────┼─────────────────────────────────────────────┤
│ 3. Enterprise     │ $1,499 / team / month│ High-scale fintech, e-commerce, banks.      │
│    Resilience     │ (₹1,20,000 / mo)     │ • Autonomous AIOps Incident Commander       │
│    Suite          │                      │ • CI/CD GitHub Action resilience gate       │
│                   │                      │ • Custom domain benchmark topology builder  │
│                   │                      │ • Priority SLA, SSO & dedicated SRE advisor │
└───────────────────┴──────────────────────┴─────────────────────────────────────────────┘
```

### Break-Even & Profitability Horizon:
* Target: Acquire **30 Enterprise Teams** (\$1,499/mo) and **100 Pro Developers** (\$49/mo) within 12 months.
* Monthly Recurring Revenue (MRR): $(30 \times ₹1,20,000) + (100 \times ₹3,999) = ₹36,00,000 + ₹3,99,900 = \mathbf{₹40,00,000/\text{month}}$.
* **Break-even achieved in Month 8**, generating an annual recurring revenue (ARR) run-rate of $> \mathbf{₹4.8\text{ Crores}}$ by end of Year 1.

---

## 8.7 Presentation Slide Planning (Component 8 Deck)

For the final comprehensive presentation deck (Component 14), Component 8 will be presented across the following dedicated slides:

* **Slide 8.1 — Academic Incurred Cost (₹0 Direct Cash):** Highlight of the 100% bootstrap model utilizing client-side compute and free edge distribution.
* **Slide 8.2 — Notional Engineering Valuation & Avoided Costs:** Breakdown of ₹6.48 Lakhs manpower valuation and ₹11.52 Lakhs cloud infrastructure costs saved.
* **Slide 8.3 — Real-Time Financial Telemetry & Enterprise ROI:** Explanation of the live ₹ GMV loss recalculation model demonstrating a 90x customer ROI.
* **Slide 8.4 — Commercial SaaS Budget & Pricing Strategy:** Presentation of the ₹36.0 Lakhs Year-1 budget, 3-tier pricing model, and Month-8 break-even roadmap.

---

### Key Takeaways for the Final PPT Presentation

> [!TIP]
> **Summary for PPT Slide (Component 8):**
> * **₹0 Incurred Development Cost:** 100% client-side Web Worker architecture eliminated all server compute bills.
> * **₹11.52 Lakhs Cloud Savings:** Running digital twins in-browser saved thousands of dollars compared to real AWS EKS chaos clusters.
> * **90x Customer ROI:** Preventing a single 15-minute flash sale outage (₹21.6 Lakhs lost GMV) pays for an enterprise license for over 1.5 years.
> * **Commercially Viable:** Scalable SaaS unit economics achieving profitability by Month 8 with 30 enterprise accounts.
