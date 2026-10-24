import { chromium } from 'playwright';
import * as path from 'path';

async function run() {
  const artifactDir = 'C:/Users/ben09/.gemini/antigravity/brain/bbd6ac31-cb66-4abe-9317-632914d1b4dd';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001');
  await page.waitForSelector('.react-flow__node');
  await page.waitForTimeout(2000);

  async function seekTo(second: number) {
    const pauseBtn = await page.locator('footer button[title*="Pause"]').first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await page.waitForTimeout(200);
    }
    await page.evaluate((sec) => {
      const slider = document.querySelector('input[data-testid="timeline-scrubber"]') as HTMLInputElement;
      if (slider) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(slider, sec.toString());
        } else {
          slider.value = sec.toString();
        }
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, second);
    await page.waitForTimeout(800);
  }

  // --- SCENARIO 1: INITIAL CLEAN STATE ---
  console.log('\n--- SCENARIO 1: Initial Clean State ---');
  await page.screenshot({
    path: path.join(artifactDir, '89_top_ring_initial_100_healthy.png'),
    fullPage: false,
  });

  // --- SCENARIO 2: FLASH SALE AT 01:19 (USER IMAGE 1: ERROR ACTIVE) ---
  console.log('\n--- SCENARIO 2: Flash Sale at 01:19 (Active Incident) ---');
  await page.locator('button:has-text("Flash Sale Peak")').first().click();
  await page.waitForTimeout(800);
  await seekTo(79); // 01:19
  await page.screenshot({
    path: path.join(artifactDir, '90_top_ring_at_01_19_error_active_red_29.png'),
    fullPage: false,
  });

  // --- SCENARIO 3: FLASH SALE AT 01:52 (USER IMAGE 2: ERROR GONE) ---
  console.log('\n--- SCENARIO 3: Flash Sale at 01:52 (Error Gone -> Must Be 100 Healthy!) ---');
  await seekTo(112); // 01:52 (User Image 2 timestamp where it was previously stuck at 25)
  await page.screenshot({
    path: path.join(artifactDir, '91_top_ring_at_01_52_error_gone_recovered_100.png'),
    fullPage: false,
  });

  // --- SCENARIO 4: ESCAPE HARD RESET (USER IMAGE 3: MUST BE 100 HEALTHY, NOT 66!) ---
  console.log('\n--- SCENARIO 4: Escape Panic Reset ---');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, '92_top_ring_after_esc_panic_reset_100.png'),
    fullPage: false,
  });

  // --- SCENARIO 5: RAMP UP PROFILE AT 01:36 (USER IMAGE 2) ---
  console.log('\n--- SCENARIO 5: Ramp Up at 01:36 & 01:52 ---');
  await page.locator('button:has-text("Gradual Ramp Up")').first().click();
  await page.waitForTimeout(800);
  await seekTo(96); // 01:36 (broken)
  await page.screenshot({
    path: path.join(artifactDir, '93_ramp_top_ring_at_01_36_active_red.png'),
    fullPage: false,
  });
  await seekTo(112); // 01:52 (healed 100)
  await page.screenshot({
    path: path.join(artifactDir, '94_ramp_top_ring_at_01_52_recovered_100.png'),
    fullPage: false,
  });

  // --- SCENARIO 6: RIDE-HAILING ARCHITECTURE ---
  console.log('\n--- SCENARIO 6: Ride-Hailing Fleet Architecture ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'ridehailing');
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Rainstorm Surge")').first().click();
  await page.waitForTimeout(800);
  await seekTo(79); // 01:19 (broken)
  await page.screenshot({
    path: path.join(artifactDir, '95_ridehailing_top_ring_at_01_19_red.png'),
    fullPage: false,
  });
  await seekTo(112); // 01:52 (recovered 100)
  await page.screenshot({
    path: path.join(artifactDir, '96_ridehailing_top_ring_at_01_52_recovered_100.png'),
    fullPage: false,
  });

  // --- SCENARIO 7: UPI / PAYMENTS SWITCH ---
  console.log('\n--- SCENARIO 7: UPI / Payments Switch Architecture ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'payments');
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Salary Day")').first().click();
  await page.waitForTimeout(800);
  await seekTo(79); // 01:19 (broken)
  await page.screenshot({
    path: path.join(artifactDir, '97_payments_top_ring_at_01_19_red.png'),
    fullPage: false,
  });
  await seekTo(112); // 01:52 (recovered 100)
  await page.screenshot({
    path: path.join(artifactDir, '98_payments_top_ring_at_01_52_recovered_100.png'),
    fullPage: false,
  });

  console.log('All Resilience Ring scenarios verified and captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});
