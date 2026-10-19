import { chromium } from 'playwright';

function intersects(r1: any, r2: any, tol = 1) {
  return !(
    r2.left >= r1.right - tol ||
    r2.right <= r1.left + tol ||
    r2.top >= r1.bottom - tol ||
    r2.bottom <= r1.top + tol
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Seek to t=75
  await page.evaluate(() => {
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    if (slider) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(slider, 75);
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.react-flow__node')).map((n) => ({
      id: n.getAttribute('data-id') || '',
      rect: n.getBoundingClientRect(),
    }));

    const edgeLabels = Array.from(
      document.querySelectorAll('.react-flow__edge-textwrapper, .traffic-edge-label, [data-testid="edge-label"]')
    ).map((el, idx) => ({
      idx,
      text: el.textContent?.trim() || '',
      title: el.getAttribute('title') || '',
      rect: el.getBoundingClientRect(),
    }));

    return { nodes, edgeLabels };
  });

  console.log(`At t=75: Found ${data.edgeLabels.length} edge labels:`);
  data.edgeLabels.forEach((el) => {
    console.log(`\nLabel #${el.idx} ("${el.text}") title="${el.title}": left=${el.rect.left.toFixed(1)}, right=${el.rect.right.toFixed(1)}, top=${el.rect.top.toFixed(1)}, bottom=${el.rect.bottom.toFixed(1)}`);
    data.nodes.forEach((n) => {
      if (intersects(n.rect, el.rect, 1)) {
        console.log(`  -> INTERSECTS node [${n.id}]: left=${n.rect.left.toFixed(1)}, right=${n.rect.right.toFixed(1)}, top=${n.rect.top.toFixed(1)}, bottom=${n.rect.bottom.toFixed(1)}`);
      }
    });
  });

  await browser.close();
}

main().catch(console.error);
