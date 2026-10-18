import { chromium } from 'playwright';

interface NodeCheckResult {
  id: string;
  name: string;
  box: { x: number; y: number; width: number; height: number };
  hasBadge: boolean;
  hasRps: boolean;
  hasP95: boolean;
  nameFontSizePx: number;
  metricFontSizePx: number;
}

async function verifyResolution(width: number, height: number) {
  console.log(`\n======================================================`);
  console.log(` VERIFYING LAYOUT & TEXT SIZES AT ${width}x${height} `);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Read zoom from .react-flow__viewport transform matrix
  const zoom = await page.evaluate(() => {
    const vp = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!vp) return 1.0;
    const style = window.getComputedStyle(vp);
    const transform = style.transform;
    if (!transform || transform === 'none') return 1.0;
    // matrix(scaleX, skewY, skewX, scaleY, transX, transY)
    const match = transform.match(/matrix\(([^,]+),/);
    return match ? parseFloat(match[1]) : 1.0;
  });

  console.log(`Graph Canvas Zoom: ${zoom.toFixed(3)}x`);

  // Query all nodes
  const nodesData: NodeCheckResult[] = await page.evaluate((currentZoom) => {
    const nodeEls = Array.from(document.querySelectorAll('.react-flow__node'));
    return nodeEls.map((el) => {
      const rect = el.getBoundingClientRect();
      const text = (el as HTMLElement).innerText || '';
      const nameEl = el.querySelector('h4, .font-bold') as HTMLElement;
      const name = nameEl ? nameEl.innerText.trim() : 'Unknown';

      // Computed font size of title
      const nameCssSize = nameEl ? parseFloat(window.getComputedStyle(nameEl).fontSize) : 17;
      // Computed font size of metrics
      const metricEl = el.querySelector('.tabular-nums') as HTMLElement;
      const metricCssSize = metricEl ? parseFloat(window.getComputedStyle(metricEl).fontSize) : 20;

      const hasBadge = text.includes('HEALTHY') || text.includes('DEGRADED') || text.includes('FAILING');
      const hasRps = text.includes('RPS') || /[\d.]+\s*RPS/i.test(text);
      const hasP95 = text.includes('ms') || /[\d.]+\s*ms/i.test(text);

      return {
        id: el.getAttribute('data-id') || '',
        name,
        box: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        hasBadge,
        hasRps,
        hasP95,
        nameFontSizePx: Math.round(nameCssSize * currentZoom * 10) / 10,
        metricFontSizePx: Math.round(metricCssSize * currentZoom * 10) / 10,
      };
    });
  }, zoom);

  console.log(`Total Rendered Service Nodes: ${nodesData.length}/13`);
  if (nodesData.length !== 13) {
    console.error(`FAIL: Expected 13 nodes, found ${nodesData.length}`);
  }

  // Check overlaps
  let overlaps = 0;
  for (let i = 0; i < nodesData.length; i++) {
    for (let j = i + 1; j < nodesData.length; j++) {
      const a = nodesData[i].box;
      const b = nodesData[j].box;
      // Overlap condition
      const isIntersecting = !(
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y
      );
      if (isIntersecting) {
        overlaps++;
        console.error(`OVERLAP DETECTED: [${nodesData[i].name}] overlaps with [${nodesData[j].name}]`);
      }
    }
  }

  if (overlaps === 0) {
    console.log(`Node Overlaps: 0 (PASS: All bounding boxes strictly disjoint)`);
  } else {
    console.error(`Node Overlaps: ${overlaps} (FAIL)`);
  }

  // Print node measurements
  console.log('\nNode Inspection & On-Screen Font Size Measurements:');
  let minNameFont = Infinity;
  let minMetricFont = Infinity;

  nodesData.forEach((n, idx) => {
    if (n.nameFontSizePx < minNameFont) minNameFont = n.nameFontSizePx;
    if (n.metricFontSizePx < minMetricFont) minMetricFont = n.metricFontSizePx;
    console.log(
      ` ${String(idx + 1).padStart(2)}. [${n.name.padEnd(28)}] | Pos: (${String(n.box.x).padStart(4)}, ${String(n.box.y).padStart(4)}) ${n.box.width}x${n.box.height} | Badge: ${n.hasBadge ? '✓' : '✗'} | RPS: ${n.hasRps ? '✓' : '✗'} | p95: ${n.hasP95 ? '✓' : '✗'} | Name font: ${n.nameFontSizePx}px | Metric font: ${n.metricFontSizePx}px`
    );
  });

  console.log(`\nSummary for ${width}x${height}:`);
  console.log(`- Minimum On-Screen Name Size:   ${minNameFont}px (Spec requirement >= 13px: ${minNameFont >= 13 ? 'PASS' : 'FAIL'})`);
  console.log(`- Minimum On-Screen Metric Size: ${minMetricFont}px (Spec requirement >= 12px: ${minMetricFont >= 12 ? 'PASS' : 'FAIL'})`);

  await browser.close();
  return { nodesCount: nodesData.length, overlaps, minNameFont, minMetricFont };
}

async function main() {
  await verifyResolution(1920, 1080);
  await verifyResolution(1366, 768);
}

main().catch(console.error);
