import { PostmortemData } from './types';

/**
 * Converts a structured PostmortemData report into professional GitHub Flavored Markdown.
 */
export function exportPostmortemToMarkdown(postmortem: PostmortemData): string {
  const p = postmortem;

  return `# Incident Postmortem: ${p.title}

**Incident ID:** \`${p.id}\`  
**Date:** ${p.date}  
**Severity:** **${p.severity}**  
**Status:** **${p.status}**  
**Investigator:** ${p.leadInvestigator}  
**Target Architecture:** ${p.architectureName}

---

## 1. Executive Summary

${p.executiveSummary}

---

## 2. Customer & Financial Impact

| Metric | Measured Value | Target SLO / SLA |
|---|---|---|
| **Incident Duration** | \`${p.impact.durationSeconds} seconds\` | \`< 30 seconds\` |
| **Lowest User Success Rate** | \`${p.impact.successRateDuringIncident}%\` | \`≥ 99.0%\` |
| **Estimated Dropped Transactions** | \`${p.impact.totalRequestsLost.toLocaleString()} requests\` | \`0\` |
| **Estimated Financial Loss** | \`₹${p.impact.financialLossInr.toLocaleString('en-IN')}\` | \`₹0\` |
| **Blast Radius** | \`${p.impact.blastRadiusPercentage}% (${p.impact.degradedServices.length} services degraded)\` | \`< 10%\` |
| **Time to Detect (TTD)** | \`${p.impact.timeToDetectS}s\` | \`< 15s\` |
| **Time to Recover (TTR)** | \`${p.impact.timeToRecoverS !== null ? `${p.impact.timeToRecoverS}s` : 'Failed to self-heal (Metastable)'}\` | \`< 60s\` |

---

## 3. Incident Timeline

| Time (UTC) | T+ (s) | Event Description | Category | Severity |
|---|---|---|---|---|
${p.timeline
  .map(
    (e) =>
      `| \`${e.timestamp}\` | \`+${e.relativeTimeS}s\` | ${e.event} | \`${e.category}\` | ${
        e.severity === 'critical' ? '🔴 Critical' : e.severity === 'warning' ? '🟠 Warning' : '🔵 Info'
      } |`
  )
  .join('\n')}

---

## 4. Root Cause Analysis

> [!WARNING]
> **Primary Culprit:** \`${p.rootCause.originServiceName} (${p.rootCause.originServiceId})\`  
> **Failure Pattern:** \`${p.rootCause.failurePattern.toUpperCase()}\`

### Explanation
${p.rootCause.explanation}

### Empirical Evidence Gathered
${p.rootCause.evidence.map((ev) => `- 🔍 ${ev}`).join('\n')}

---

## 5. Contributing Architectural Factors

${p.contributingFactors.map((cf) => `- ⚠️ ${cf}`).join('\n')}

---

## 6. What Went Well & What Went Poorly

### What Went Well
${p.whatWentWell.map((w) => `- ✅ ${w}`).join('\n')}

### What Went Poorly
${p.whatWentPoorly.map((w) => `- ❌ ${w}`).join('\n')}

---

## 7. Action Items & Auto-Hardening Recommendations

| ID | Priority | Remediation Action | Owner | Cost Impact |
|---|---|---|---|---|
${p.actionItems
  .map(
    (a) =>
      `| \`${a.id}\` | **${a.priority}** | ${a.action} | \`${a.owner}\` | ${
        a.costDeltaInr > 0 ? `+₹${a.costDeltaInr.toLocaleString('en-IN')}/mo` : 'Free (₹0)'
      } |`
  )
  .join('\n')}

---
*Report generated automatically by [CascadeLab](https://github.com/CascadeLab) Resilience Digital Twin.*
`;
}
