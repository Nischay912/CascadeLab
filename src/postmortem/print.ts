import { PostmortemData } from './types';

export function generatePrintableHtml(p: PostmortemData): string {
  const getSeverityBadgeStyle = () => {
    if (p.severity.startsWith('P1')) {
      return 'background: #fee2e2; color: #991b1b; border: 1px solid #f87171;';
    }
    if (p.severity.startsWith('P2')) {
      return 'background: #fef3c7; color: #92400e; border: 1px solid #f59e0b;';
    }
    return 'background: #e0f2fe; color: #075985; border: 1px solid #38bdf8;';
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Incident Postmortem - ${p.id}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .org-banner {
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 4px;
    }
    h1 {
      font-size: 18pt;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: #0f172a;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 9pt;
      color: #475569;
      align-items: center;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8.5pt;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .badge-status {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }
    .badge-meta {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #d8b4fe;
    }
    section {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e293b;
      margin: 0 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 10pt;
      color: #334155;
      line-height: 1.5;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .metric-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      display: block;
      margin-bottom: 2px;
    }
    .metric-value {
      font-size: 14pt;
      font-weight: 800;
      font-family: ui-monospace, monospace;
      color: #0f172a;
    }
    .metric-sub {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 2px;
      display: block;
    }
    .val-loss { color: #dc2626; }
    .val-warn { color: #d97706; }
    .val-accent { color: #0284c7; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-top: 6px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      text-align: left;
      padding: 6px 8px;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      border: 1px solid #e2e8f0;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .root-cause-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .evidence-item {
      font-size: 9pt;
      color: #334155;
      margin-bottom: 4px;
      display: flex;
      gap: 6px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .review-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
    }
    .review-card h3 {
      margin: 0 0 6px 0;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .review-card ul {
      margin: 0;
      padding-left: 16px;
      font-size: 8.5pt;
      color: #334155;
    }
    .review-card li {
      margin-bottom: 3px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="org-banner">CascadeLab Resilience Digital Twin • SRE Incident Postmortem</div>
    <h1>${p.title}</h1>
    <div class="meta-bar">
      <span><strong>Incident ID:</strong> <span class="font-mono">${p.id}</span></span>
      <span><strong>Date:</strong> ${p.date}</span>
      <span><strong>Investigator:</strong> ${p.leadInvestigator}</span>
      <span><strong>Architecture:</strong> ${p.architectureName}</span>
      <span class="badge" style="${getSeverityBadgeStyle()}">${p.severity}</span>
      <span class="badge badge-status">${p.status}</span>
    </div>
  </div>

  <!-- 1. Executive Summary -->
  <section>
    <h2>1. Executive Summary</h2>
    <div class="summary-box">
      ${p.executiveSummary}
    </div>
  </section>

  <!-- 2. Customer & Financial Impact -->
  <section>
    <h2>2. Customer & Financial Impact</h2>
    <div class="grid-4">
      <div class="metric-card">
        <span class="metric-label">Financial Loss</span>
        <span class="metric-value val-loss">₹${p.impact.financialLossInr.toLocaleString('en-IN')}</span>
        <span class="metric-sub">Direct unserved revenue</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Lowest Success</span>
        <span class="metric-value val-warn">${p.impact.successRateDuringIncident}%</span>
        <span class="metric-sub">SLO target: ≥ 99.0%</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Blast Radius</span>
        <span class="metric-value">${p.impact.blastRadiusPercentage}%</span>
        <span class="metric-sub">${p.impact.degradedServices.length} services degraded</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Duration / TTR</span>
        <span class="metric-value val-accent">${p.impact.durationSeconds}s</span>
        <span class="metric-sub">TTR: ${p.impact.timeToRecoverS !== null ? `${p.impact.timeToRecoverS}s` : 'Failed to self-heal'}</span>
      </div>
    </div>
  </section>

  <!-- 3. Root Cause Analysis -->
  <section>
    <h2>3. Root Cause Analysis</h2>
    <div class="root-cause-box">
      <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
        <span style="font-weight:700;">Origin: <strong style="color:#0284c7;">${p.rootCause.originServiceName} (${p.rootCause.originServiceId})</strong></span>
        <span class="badge badge-meta">${p.rootCause.failurePattern.toUpperCase()}</span>
      </div>
      <p style="margin: 4px 0 0 0; font-size: 9.5pt; color: #334155; line-height: 1.45;">
        ${p.rootCause.explanation}
      </p>
    </div>
    <div style="margin-top: 6px;">
      <strong style="font-size: 8.5pt; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px;">Empirical Evidence Gathered:</strong>
      ${p.rootCause.evidence.map((ev) => `<div class="evidence-item"><span>•</span><span>${ev}</span></div>`).join('')}
    </div>
  </section>

  <!-- 4. What Went Well & Poorly -->
  <section>
    <h2>4. Post-Incident Review</h2>
    <div class="grid-2">
      <div class="review-card" style="border-left: 3px solid #10b981;">
        <h3 style="color: #059669;">✓ What Went Well</h3>
        <ul>
          ${p.whatWentWell.map((w) => `<li>${w}</li>`).join('')}
        </ul>
      </div>
      <div class="review-card" style="border-left: 3px solid #ef4444;">
        <h3 style="color: #dc2626;">✕ What Went Poorly</h3>
        <ul>
          ${p.whatWentPoorly.map((w) => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <!-- 5. Corrective Action Items -->
  <section>
    <h2>5. Corrective Action Items & Hardening Plan</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 65px;">ID</th>
          <th style="width: 50px; text-align: center;">Pri</th>
          <th>Remediation Action & Rationale</th>
          <th style="width: 140px;">Owner</th>
          <th style="width: 100px; text-align: right;">Cost Impact</th>
        </tr>
      </thead>
      <tbody>
        ${p.actionItems.map((act) => `
          <tr>
            <td class="font-mono" style="font-weight:600; color:#475569;">${act.id}</td>
            <td style="text-align:center;">
              <span class="badge" style="${
                act.priority === 'P0'
                  ? 'background:#fee2e2; color:#991b1b;'
                  : act.priority === 'P1'
                  ? 'background:#fef3c7; color:#92400e;'
                  : 'background:#e0f2fe; color:#0369a1;'
              }">${act.priority}</span>
            </td>
            <td>
              <strong style="display:block; color:#0f172a;">${act.action}</strong>
              <span style="font-size:8pt; color:#64748b; display:block; margin-top:2px;">${act.rationale}</span>
            </td>
            <td class="font-mono" style="font-size:8pt; color:#475569;">${act.owner}</td>
            <td style="text-align:right; font-family:ui-monospace, monospace; font-weight:700;">
              ${act.costDeltaInr > 0 ? `<span style="color:#d97706;">+₹${act.costDeltaInr.toLocaleString('en-IN')}/mo</span>` : '<span style="color:#059669;">Free (₹0)</span>'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>

  <!-- 6. Chronological Incident Timeline -->
  <section>
    <h2>6. Incident Chronology & Event Log</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 75px;">Time</th>
          <th style="width: 60px;">T+ (s)</th>
          <th>Event Description</th>
          <th style="width: 90px;">Category</th>
          <th style="width: 80px; text-align:center;">Severity</th>
        </tr>
      </thead>
      <tbody>
        ${p.timeline.map((item) => `
          <tr>
            <td class="font-mono" style="color:#64748b;">${item.timestamp}</td>
            <td class="font-mono" style="font-weight:700; color:#0284c7;">+${item.relativeTimeS}s</td>
            <td>${item.event}</td>
            <td class="font-mono" style="text-transform:capitalize; font-size:8pt;">${item.category}</td>
            <td style="text-align:center;">
              <span class="badge" style="${
                item.severity === 'critical'
                  ? 'background:#fee2e2; color:#991b1b;'
                  : item.severity === 'warning'
                  ? 'background:#fef3c7; color:#92400e;'
                  : 'background:#e0f2fe; color:#0369a1;'
              }">${item.severity}</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>

  <!-- Footer -->
  <div class="footer">
    <span>CascadeLab Digital Twin Resilience Audit • Automated SRE Artifact</span>
    <span>Confidential & Proprietary</span>
  </div>

</body>
</html>`;
}
