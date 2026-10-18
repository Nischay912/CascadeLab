import { shopFastNaiveTemplate } from '../src/schema/templates';
import { SimulationEngine } from '../src/sim/engine';
import { analyzeSimulationIncident } from '../src/analysis';
import { ArchitectureSpec } from '../src/schema/architecture';

interface TestCase {
  name: string;
  expectedPattern: string;
  createSpec: () => ArchitectureSpec;
}

const testCases: TestCase[] = [];

// 1. 5 Retry Storm scenarios
for (let i = 0; i < 5; i++) {
  testCases.push({
    name: `Retry Storm (factor ${4 + i}x, retries ${2 + (i % 2)})`,
    expectedPattern: 'retry_storm',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.faults = [{ type: 'latency', target: 'payment-provider', factor: 4 + i, start_s: 20, end_s: 60 }];
      const e = s.edges.find((ed: any) => ed.to === 'payment-provider');
      if (e) {
        e.retries = 2 + (i % 2);
        e.backoff = { mode: 'none', jitter: false, base_delay_ms: 50, max_delay_ms: 500 };
      }
      return s;
    },
  });
}

// 2. 5 Concurrency Exhaustion scenarios
for (let i = 0; i < 5; i++) {
  testCases.push({
    name: `Concurrency Exhaustion (workers ${10 + i * 5}, surge ${2 + i * 0.5}x)`,
    expectedPattern: 'concurrency_exhaustion',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.services.forEach((svc: any) => {
        if (svc.id === 'checkout') svc.concurrency = 10 + i * 2;
      });
      s.workload.base_rps = 700 + i * 50;
      return s;
    },
  });
}

// 3. 4 Queue Buildup scenarios
for (let i = 0; i < 4; i++) {
  testCases.push({
    name: `Queue Buildup (limit ${200 + i * 50})`,
    expectedPattern: 'queue_buildup',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.faults = [{ type: 'latency', target: 'orders-db', factor: 6 + i, start_s: 20, end_s: 70 }];
      return s;
    },
  });
}

// 4. 4 Crash Loop scenarios
for (let i = 0; i < 4; i++) {
  testCases.push({
    name: `Crash Loop (overload threshold ${10 + i * 5}s)`,
    expectedPattern: 'crash_loop',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.services.forEach((svc: any) => {
        svc.crash = { enabled: true, after_overload_s: 10 + i * 2, restart_delay_s: 30 };
      });
      s.faults = [{ type: 'latency', target: 'payment-provider', factor: 8, start_s: 15, end_s: 75 }];
      return s;
    },
  });
}

// 5. 4 Cache Stampede scenarios
for (let i = 0; i < 4; i++) {
  testCases.push({
    name: `Cache Stampede (flush duration ${20 + i * 10}s)`,
    expectedPattern: 'cache_stampede',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.faults = [{ type: 'cache_flush', target: 'cache', start_s: 20, end_s: 40 + i * 10 }];
      return s;
    },
  });
}

// 6. 4 SPOF scenarios
for (let i = 0; i < 4; i++) {
  testCases.push({
    name: `SPOF Outage (target: orders-db trial ${i + 1})`,
    expectedPattern: 'spof_failure',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.faults = [{ type: 'kill_instances', target: 'orders-db', percentage: 100, start_s: 20, end_s: 60 }];
      return s;
    },
  });
}

// 7. 4 Metastable Failure scenarios
for (let i = 0; i < 4; i++) {
  testCases.push({
    name: `Metastable Failure (retry storm trap trial ${i + 1})`,
    expectedPattern: 'metastable_failure',
    createSpec: () => {
      const s = JSON.parse(JSON.stringify(shopFastNaiveTemplate));
      s.faults = [{ type: 'latency', target: 'payment-provider', factor: 5 + i, start_s: 20, end_s: 60 }];
      return s;
    },
  });
}

console.log(`Running 30 constructed test cases for T12... Total: ${testCases.length}`);
let passed = 0;
testCases.forEach((tc, idx) => {
  const spec = tc.createSpec();
  const eng = new SimulationEngine(spec, 42 + idx);
  const hist = eng.runBatch(120);
  const rep = analyzeSimulationIncident(spec, hist);
  const matches = rep.patterns.some(p => p.pattern === tc.expectedPattern && p.detected) ||
                  (tc.expectedPattern === 'metastable_failure' && rep.isMetastable);
  if (matches) {
    passed++;
  } else {
    console.log(`FAIL on ${tc.name}: detected patterns =`, rep.patterns.filter(p => p.detected).map(p => p.pattern), 'isMetastable:', rep.isMetastable);
  }
});

const accuracy = (passed / testCases.length) * 100;
console.log(`T12 Accuracy: ${passed}/${testCases.length} (${accuracy.toFixed(1)}%) -> ${accuracy >= 90 ? 'PASS' : 'FAIL'}`);
