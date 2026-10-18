import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/ben09/.gemini/antigravity/brain/bbd6ac31-cb66-4abe-9317-632914d1b4dd';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1366x768', width: 1366, height: 768 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForSelector('.react-flow__node');
    await page.waitForTimeout(2500);

    // 1. Healthy Baseline (00:00)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `healthy-${vp.name}.png`) });
    console.log(`Saved healthy-${vp.name}.png`);

    // 2. Mid-Cascade (01:15 = 75s)
    await page.evaluate(`(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, 75);
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `mid-cascade-${vp.name}.png`) });
    console.log(`Saved mid-cascade-${vp.name}.png`);

    // 3. Metastable Lockup (02:30 = 150s) with Root-cause analysis open
    await page.evaluate(`(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, 150);
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Click Root-cause tab button if present
      const buttons = Array.from(document.querySelectorAll('button'));
      const rcBtn = buttons.find((b) => b.textContent && b.textContent.includes('Root-cause'));
      if (rcBtn) rcBtn.click();
    })()`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `metastable-${vp.name}.png`) });
    console.log(`Saved metastable-${vp.name}.png`);

    // 4. Hardened Reference Recovery (02:30 = 150s)
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
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(slider, 150);
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `hardened-${vp.name}.png`) });
    console.log(`Saved hardened-${vp.name}.png`);

    await page.close();
  }

  await browser.close();
  console.log('All 8 screenshots successfully re-captured!');
}

capture().catch(console.error);
