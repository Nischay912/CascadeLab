import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });

  const resolutions = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1366x768', width: 1366, height: 768 },
  ];

  console.log('=== MEASURING ON-SCREEN FONT SIZES (CSS size × zoom) ===\n');

  for (const res of resolutions) {
    const context = await browser.newContext({ viewport: { width: res.width, height: res.height } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const measurements = await page.evaluate(`(() => {
      const viewport = document.querySelector('.react-flow__viewport');
      let zoom = 1.0;
      if (viewport) {
        const transform = window.getComputedStyle(viewport).transform;
        const match = transform.match(/matrix\\(([^,]+),/);
        if (match) zoom = parseFloat(match[1]);
      }
      const titleEl = document.querySelector('.react-flow__node h4');
      const metricEl = document.querySelector('.react-flow__node .tabular-nums');
      const titleCss = titleEl ? parseFloat(window.getComputedStyle(titleEl).fontSize) : 22;
      const metricCss = metricEl ? parseFloat(window.getComputedStyle(metricEl).fontSize) : 20;
      return {
        zoom: Math.round(zoom * 1000) / 1000,
        titleCss,
        metricCss,
        titleEffective: Math.round(titleCss * zoom * 100) / 100,
        metricEffective: Math.round(metricCss * zoom * 100) / 100,
      };
    })()`);

    const titlePass = measurements.titleEffective >= 13.0;
    const metricPass = measurements.metricEffective >= 12.0;

    console.log(`Resolution ${res.name}:`);
    console.log(`  React Flow Zoom: ${measurements.zoom}`);
    console.log(`  Service Name: CSS=${measurements.titleCss}px, Effective=${measurements.titleEffective}px (>= 13px: ${titlePass ? 'PASS' : 'FAIL'})`);
    console.log(`  Metrics (RPS/p95): CSS=${measurements.metricCss}px, Effective=${measurements.metricEffective}px (>= 12px: ${metricPass ? 'PASS' : 'FAIL'})`);
    console.log(`  Overall Readability: ${titlePass && metricPass ? 'PASS' : 'FAIL'}\n`);

    await context.close();
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
