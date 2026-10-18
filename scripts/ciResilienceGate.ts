#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { ArchitectureSpec } from '../src/schema/architecture';
import { shopFastNaiveTemplate, shopFastHardenedTemplate } from '../src/schema/templates';
import { runLinter } from '../src/lint/linter';
import { runFastResilienceSuite } from '../src/optimizer/fastSuite';
import { parseArchitectureYamlOrJson } from '../src/schema/importers';

export interface GateResult {
  passed: boolean;
  score: number;
  threshold: number;
  errorCount: number;
  warningCount: number;
  criticalViolations: string[];
  scenarioResults: { name: string; score: number; successPct: number; moneyLostInr: number }[];
}

export function evaluateResilienceGate(
  spec: ArchitectureSpec,
  threshold: number = 50,
  failOnCriticalLints: boolean = true
): GateResult {
  // 1. Run Linter
  const lintReport = runLinter(spec);
  const criticalFindings = lintReport.findings.filter((f) => f.severity === 'critical');
  const warningFindings = lintReport.findings.filter((f) => f.severity === 'warning');

  // 2. Run Fast Resilience Suite
  const suiteReport = runFastResilienceSuite(spec);

  const scenarioResults = suiteReport.scenarioResults.map((s) => ({
    name: s.scenarioName,
    score: s.score,
    successPct: s.avgSuccessPct,
    moneyLostInr: s.moneyLostInr,
  }));

  const passed =
    suiteReport.resilienceScore >= threshold &&
    (!failOnCriticalLints || criticalFindings.length === 0);

  return {
    passed,
    score: suiteReport.resilienceScore,
    threshold,
    errorCount: criticalFindings.length,
    warningCount: warningFindings.length,
    criticalViolations: criticalFindings.map((f) => `${f.ruleId}: ${f.title}`),
    scenarioResults,
  };
}

// CLI Execution Wrapper
export function runCli(): void {
  const args = process.argv.slice(2);
  let threshold = 50;
  let targetSpec: ArchitectureSpec = shopFastHardenedTemplate;
  let specName = 'ShopFast (Hardened Reference)';

  for (const arg of args) {
    if (arg.startsWith('--threshold=')) {
      threshold = parseInt(arg.split('=')[1], 10) || 70;
    } else if (arg === '--naive') {
      targetSpec = shopFastNaiveTemplate;
      specName = 'ShopFast (Naive Anti-patterns)';
    } else if (!arg.startsWith('--')) {
      const filePath = path.resolve(process.cwd(), arg);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        targetSpec = parseArchitectureYamlOrJson(content);
        specName = targetSpec.name || path.basename(filePath);
      }
    }
  }

  console.log('\n===============================================================');
  console.log('         🧨 CASCADELAB CI/CD RESILIENCE GATEWAY');
  console.log('===============================================================\n');
  console.log(`Target Architecture : ${specName}`);
  console.log(`Services Evaluated  : ${targetSpec.services.length}`);
  console.log(`Dependency Edges    : ${targetSpec.edges.length}`);
  console.log(`Resilience Threshold: ${threshold} / 100\n`);

  console.log('Running static architecture linter & 6-scenario chaos evaluation...');
  const result = evaluateResilienceGate(targetSpec, threshold);

  console.log('\n---------------- Chaos Suite Benchmark Results ----------------');
  result.scenarioResults.forEach((s) => {
    const statusIcon = s.score >= 70 ? '✓' : '✗';
    console.log(
      ` ${statusIcon} ${s.name.padEnd(35)} | Score: ${String(s.score).padStart(3)} | Success: ${s.successPct.toFixed(1).padStart(5)}% | Lost: ₹${Math.round(s.moneyLostInr).toLocaleString()}`
    );
  });

  console.log('---------------------------------------------------------------');
  console.log(`Static Linter Findings : ${result.errorCount} Critical Errors, ${result.warningCount} Warnings`);

  if (result.criticalViolations.length > 0) {
    console.log('\nCritical Architectural Violations:');
    result.criticalViolations.forEach((v) => console.log(`  ❌ ${v}`));
  }

  console.log('\n===============================================================');
  if (result.passed) {
    console.log(`✅ [GATE PASSED] Overall Resilience Score: ${result.score}/100 (Threshold: ${result.threshold})`);
    console.log('   Pull request qualifies for safe production deployment.');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.log(`❌ [GATE FAILED] Overall Resilience Score: ${result.score}/100 (Threshold: ${result.threshold})`);
    console.log('   Architecture does not meet required resilience SLO criteria.');
    console.log('===============================================================\n');
    process.exit(1);
  }
}

// Only invoke CLI when executed directly
if (process.argv[1] && process.argv[1].endsWith('ciResilienceGate.ts')) {
  runCli();
}
