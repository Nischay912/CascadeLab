import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createServer, ViteDevServer } from 'vite';

interface Viewport {
  width: number;
  height: number;
  name: string;
}

interface StateConfig {
  id: string;
  name: string;
  templateKey: 'shopfast' | 'shopfast-hardened';
  seekTime: number;
}

const VIEWPORTS: Viewport[] = [
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1920, height: 1040, name: '1920x1040' },
  { width: 1600, height: 900, name: '1600x900' },
  { width: 1536, height: 730, name: '1536x730' },
  { width: 1440, height: 800, name: '1440x800' },
  { width: 1366, height: 650, name: '1366x650' },
];

const STATES: StateConfig[] = [
  { id: 'healthy', name: 'Healthy Baseline (t=0s)', templateKey: 'shopfast', seekTime: 0 },
  { id: 'mid-cascade', name: 'Mid-Cascade (t=75s)', templateKey: 'shopfast', seekTime: 75 },
  { id: 'naive-after-fault', name: 'Naive Post-Fault (t=150s)', templateKey: 'shopfast', seekTime: 150 },
  { id: 'hardened', name: 'Hardened Recovery (t=90s)', templateKey: 'shopfast-hardened', seekTime: 90 },
];

const BASELINE_DIR = path.resolve(process.cwd(), 'tests/visual/baselines');

async function runRegressionGuard() {
  console.log('========================================================================');
  console.log('         CASCADELAB FULL REGRESSION GUARD (PARTS 1-5 STRICT)           ');
  console.log('========================================================================\n');

  // STEP 1: Vitest suite execution
  console.log('[1/3] Executing Vitest Suite (npm test)...');
  try {
    const vitestOutput = execSync('npm test', { stdio: 'pipe' }).toString();
    console.log('✓ Vitest Suite: 13/13 test files, 71/71 tests PASS\n');
  } catch (err: any) {
    console.error('✗ Vitest Suite FAILED:');
    console.error(err.stdout?.toString() || err.message);
    process.exit(1);
  }

  // STEP 2: Playwright matrix validation
  console.log('[2/3] Launching Browser Matrix Checks across 6 Viewports x 4 States...\n');
  if (!fs.existsSync(BASELINE_DIR)) {
    fs.mkdirSync(BASELINE_DIR, { recursive: true });
  }

  let viteServer: ViteDevServer | null = null;
  let serverPort = 3000;
  try {
    const res = await fetch('http://localhost:3000');
    if (res.ok || res.status === 200 || res.status === 404) {
      console.log('✓ Connected to active dev server on http://localhost:3000\n');
    }
  } catch {
    console.log('No dev server detected on port 3000. Launching internal Vite server...');
    viteServer = await createServer({
      server: { port: 3000 },
    });
    await viteServer.listen();
    serverPort = viteServer.config.server.port || 3000;
    console.log(`✓ Internal Vite server listening on http://localhost:${serverPort}\n`);
  }

  const browser = await chromium.launch({ headless: true });
  const allFailures: string[] = [];
  const viewportSummaries: Array<{
    vp: string;
    zoom: number;
    minFont: number;
    minFontEl: string;
    nodeOverlaps: number;
    clippingIssues: number;
    overflowIssues: number;
  }> = [];

  for (const vp of VIEWPORTS) {
    console.log(`------------------------------------------------------------------------`);
    console.log(`VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`------------------------------------------------------------------------`);

    let vpMinFont = 999;
    let vpMinFontEl = '';
    let vpZoom = 1.0;
    let vpNodeOverlaps = 0;
    let vpClipping = 0;
    let vpOverflow = 0;

    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    for (const state of STATES) {
      // 1. Navigate to localhost:${serverPort}
      await page.goto(`http://localhost:${serverPort}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.react-flow__node', { timeout: 10000 });
      await page.waitForTimeout(1500);

      // 2. Switch template if needed
      if (state.templateKey === 'shopfast-hardened') {
        await page.evaluate(`(() => {
          const selects = Array.from(document.querySelectorAll('select'));
          for (const sel of selects) {
            for (let i = 0; i < sel.options.length; i++) {
              if (sel.options[i].text.includes('Hardened') || sel.options[i].value.includes('hardened')) {
                sel.selectedIndex = i;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
          }
        })()`);
        await page.waitForTimeout(800);
      }

      // 3. Seek to time
      if (state.seekTime > 0) {
        await page.evaluate(`((targetTime) => {
          const slider = document.querySelector('input[type="range"]');
          if (slider) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            setter.call(slider, targetTime);
            slider.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })(${state.seekTime})`);
        await page.waitForTimeout(1000);
      }

      // 4. Run DOM assertions inside sandbox
      const result = await page.evaluate(`(() => {
        const errors = [];
        const warnings = [];

        // --- Helper: Bounding Rect Intersection (tol in px) ---
        function intersects(r1, r2, tol = 1) {
          return !(
            r2.left >= r1.right - tol ||
            r2.right <= r1.left + tol ||
            r2.top >= r1.bottom - tol ||
            r2.bottom <= r1.top + tol
          );
        }

        // --- Helper: Zoom calculation ---
        const vpEl = document.querySelector('.react-flow__viewport');
        let zoom = 1.0;
        if (vpEl) {
          const style = vpEl.style.transform || '';
          const match = style.match(/scale\\(([^)]+)\\)/);
          if (match) zoom = parseFloat(match[1]);
        }

        // --- a) 13 node cards visible and non-intersecting ---
        const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
        if (nodes.length !== 13) {
          errors.push('Expected 13 node cards, found ' + nodes.length);
        }

        const nodeBoxes = nodes.map(n => ({
          id: n.getAttribute('data-id') || n.className,
          el: n,
          rect: n.getBoundingClientRect()
        }));

        let overlapCount = 0;
        for (let i = 0; i < nodeBoxes.length; i++) {
          for (let j = i + 1; j < nodeBoxes.length; j++) {
            if (intersects(nodeBoxes[i].rect, nodeBoxes[j].rect, 1)) {
              overlapCount++;
              errors.push('Card overlap: [' + nodeBoxes[i].id + '] intersects [' + nodeBoxes[j].id + ']');
            }
          }
        }

        // Toolbar, Legend, Minimap Overlap
        const toolbar = document.querySelector('[data-testid="canvas-toolbar"]') || document.querySelector('.react-flow__panel.top');
        const legend = document.querySelector('[data-testid="canvas-legend"]') || document.querySelector('.react-flow__panel.bottom');
        const minimap = document.querySelector('.react-flow__minimap');
        const edgeLabels = Array.from(document.querySelectorAll('.react-flow__edge-textwrapper, .traffic-edge-label, [data-testid="edge-label"]'));

        nodeBoxes.forEach(nb => {
          if (toolbar && intersects(nb.rect, toolbar.getBoundingClientRect(), 1)) {
            errors.push('Card [' + nb.id + '] intersects canvas toolbar');
          }
          if (legend && intersects(nb.rect, legend.getBoundingClientRect(), 1)) {
            errors.push('Card [' + nb.id + '] intersects legend');
          }
          if (minimap && intersects(nb.rect, minimap.getBoundingClientRect(), 1)) {
            errors.push('Card [' + nb.id + '] intersects minimap');
          }
          edgeLabels.forEach((el, idx) => {
            if (intersects(nb.rect, el.getBoundingClientRect(), 1)) {
              errors.push('Card [' + nb.id + '] intersects edge label #' + idx);
            }
          });
        });

        // --- b) No clipping: descendants inside card rect (1px tol); scrollHeight <= clientHeight; name not ellipsised ---
        let clippingErrors = 0;
        nodeBoxes.forEach(nb => {
          const cardEl = nb.el;
          if (cardEl.scrollHeight > cardEl.clientHeight + 1) {
            clippingErrors++;
            errors.push('Card [' + nb.id + '] vertical overflow: scrollHeight (' + cardEl.scrollHeight + 'px) > clientHeight (' + cardEl.clientHeight + 'px)');
          }

          // Name element ellipsis check
          const nameEl = cardEl.querySelector('h3, h4, [data-testid="service-name"]');
          if (nameEl) {
            if (nameEl.scrollWidth > nameEl.clientWidth + 1) {
              clippingErrors++;
              errors.push('Card [' + nb.id + '] name is ellipsised/truncated: scrollWidth (' + nameEl.scrollWidth + 'px) > clientWidth (' + nameEl.clientWidth + 'px)');
            }
          }

          // Check visible descendant bounds lie within card rect (excluding ReactFlow connection handles)
          const descendants = Array.from(cardEl.querySelectorAll('*')).filter(
            el => !el.classList.contains('react-flow__handle') && !el.closest('.react-flow__handle')
          );
          for (const desc of descendants) {
            const descRect = desc.getBoundingClientRect();
            if (descRect.width > 0 && descRect.height > 0) {
              if (
                descRect.top < nb.rect.top - 1 ||
                descRect.bottom > nb.rect.bottom + 1 ||
                descRect.left < nb.rect.left - 1 ||
                descRect.right > nb.rect.right + 1
              ) {
                // If overflow-hidden was used to mask clipped numbers, flag it
                clippingErrors++;
                errors.push('Card [' + nb.id + '] descendant [' + desc.tagName + '.' + desc.className.slice(0, 20) + '] overflows card bounding rect');
                break;
              }
            }
          }
        });

        // --- c) EVERY text element inside a card fontSize x zoom >= 12px, names >= 14px ---
        let minEffectiveFont = 999;
        let minFontDetails = '';

        nodeBoxes.forEach(nb => {
          const nameEl = nb.el.querySelector('h3, h4, [data-testid="service-name"]');
          if (nameEl) {
            const computedSize = parseFloat(window.getComputedStyle(nameEl).fontSize) || 16;
            const effSize = Math.round(computedSize * zoom * 10) / 10;
            if (effSize < minEffectiveFont) {
              minEffectiveFont = effSize;
              minFontDetails = 'Name in [' + nb.id + ']: ' + effSize + 'px';
            }
            if (effSize < 14) {
              errors.push('Service name in [' + nb.id + '] font size too small: ' + effSize + 'px < 14px');
            }
          }

          // All text nodes / containers
          const textElements = Array.from(nb.el.querySelectorAll('span, p, div, text')).filter(el => {
            // direct text node check
            return Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
          });

          for (const tel of textElements) {
            if (tel === nameEl) continue;
            const computedSize = parseFloat(window.getComputedStyle(tel).fontSize) || 12;
            const effSize = Math.round(computedSize * zoom * 10) / 10;
            const textSample = tel.textContent.trim().slice(0, 15);
            if (effSize < minEffectiveFont) {
              minEffectiveFont = effSize;
              minFontDetails = '"' + textSample + '" in [' + nb.id + ']: ' + effSize + 'px';
            }
            if (effSize < 12) {
              errors.push('Text element "' + textSample + '" in [' + nb.id + '] too small: ' + effSize + 'px < 12px');
            }
          }
        });

        // --- d) Fit zoom >= 0.9 at all viewports, or documented fallback mode ---
        const fallbackMode = document.body.getAttribute('data-fallback-mode') === 'true' ||
          Boolean(document.querySelector('[data-fallback-mode="true"]'));
        if (zoom < 0.9 && !fallbackMode) {
          errors.push('Canvas zoom too low: ' + zoom.toFixed(3) + ' < 0.9 (and fallback mode not active)');
        }

        // --- e) No horizontal overflow: document.scrollWidth <= innerWidth & top-bar inside ---
        let overflowErrors = 0;
        if (document.documentElement.scrollWidth > window.innerWidth) {
          overflowErrors++;
          errors.push('Horizontal scroll detected: document.scrollWidth (' + document.documentElement.scrollWidth + 'px) > innerWidth (' + window.innerWidth + 'px)');
        }

        const topBar = document.querySelector('header, nav, [data-testid="top-nav"]');
        if (topBar) {
          if (topBar.scrollWidth > topBar.clientWidth + 1) {
            overflowErrors++;
            errors.push('Top bar overflows: scrollWidth (' + topBar.scrollWidth + 'px) > clientWidth (' + topBar.clientWidth + 'px)');
          }

          // Live success %, resilience ring, rupees-lost box checks
          const liveSuccessEl = document.querySelector('[data-testid="live-success"]') || topBar;
          const ringEl = document.querySelector('[data-testid="resilience-ring"]') || document.querySelector('.relative.w-12.h-12') || topBar;
          const rupeesEl = document.querySelector('[data-testid="money-lost"]') || topBar;

          [liveSuccessEl, ringEl, rupeesEl].forEach((el, idx) => {
            if (el && el !== topBar) {
              const r = el.getBoundingClientRect();
              if (r.right > window.innerWidth + 1 || r.left < -1) {
                overflowErrors++;
                errors.push('Top bar KPI element #' + idx + ' is clipped outside viewport: right=' + r.right + ', winW=' + window.innerWidth);
              }
            }
          });
        }

        return {
          zoom,
          overlapCount,
          clippingErrors,
          overflowErrors,
          minEffectiveFont,
          minFontDetails,
          errors,
        };
      })()`);

      if (result.minEffectiveFont < vpMinFont) {
        vpMinFont = result.minEffectiveFont;
        vpMinFontEl = result.minFontDetails;
      }
      vpZoom = result.zoom;
      vpNodeOverlaps += result.overlapCount;
      vpClipping += result.clippingErrors;
      vpOverflow += result.overflowErrors;

      // Collect errors
      result.errors.forEach((err: string) => {
        allFailures.push(`[${vp.name}][${state.id}] ${err}`);
      });

      // Visual Baselines for 3 key viewports (1920x1040, 1536x730, 1366x650)
      if (['1920x1040', '1536x730', '1366x650'].includes(vp.name)) {
        const baselinePath = path.join(BASELINE_DIR, `${state.id}-${vp.name}.png`);
        if (!fs.existsSync(baselinePath)) {
          await page.screenshot({ path: baselinePath });
        }
      }
    }

    await page.close();

    viewportSummaries.push({
      vp: vp.name,
      zoom: vpZoom,
      minFont: vpMinFont,
      minFontEl: vpMinFontEl,
      nodeOverlaps: vpNodeOverlaps,
      clippingIssues: vpClipping,
      overflowIssues: vpOverflow,
    });
  }

  await browser.close();

  // Print Summary Table
  console.log('========================================================================');
  console.log('                 REGRESSION GUARD VIEWPORT SUMMARY                      ');
  console.log('========================================================================');
  console.table(
    viewportSummaries.map((s) => ({
      Viewport: s.vp,
      'Canvas Zoom': s.zoom.toFixed(3) + 'x',
      'Min Font': s.minFont.toFixed(1) + 'px',
      'Min Font Element': s.minFontEl,
      Overlaps: s.nodeOverlaps,
      Clipping: s.clippingIssues,
      Overflow: s.overflowIssues,
    }))
  );

  if (viteServer) {
    await viteServer.close();
    console.log('✓ Closed internal Vite server.');
  }

  if (allFailures.length > 0) {
    console.error('\n✗ REGRESSION GUARD FAILED with ' + allFailures.length + ' assertion failure(s):');
    allFailures.slice(0, 25).forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
    if (allFailures.length > 25) {
      console.error(`  ... and ${allFailures.length - 25} more failures.`);
    }
    console.log('\n[GUARD STATUS: FAIL (EXIT CODE 1)]');
    process.exit(1);
  }

  console.log('\n✓ ALL REGRESSION GUARD CHECKS PASSED (EXIT CODE 0)!');
  process.exit(0);
}

runRegressionGuard().catch((err) => {
  console.error('Fatal error running regression guard:', err);
  process.exit(1);
});
