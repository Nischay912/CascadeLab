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

  // --- 1. INITIAL CLEAN ZERO LOSS ---
  console.log('\n--- 1. Initial State: ₹0 lost ---');
  await page.screenshot({
    path: path.join(artifactDir, '99_money_initial_load_zero.png'),
    fullPage: false,
  });

  // --- 2. PRE-INCIDENT NOMINAL ZERO LOSS (00:15) ---
  console.log('\n--- 2. Pre-Incident Nominal (00:15): ₹0 lost ---');
  await page.locator('button:has-text("Flash Sale Peak")').first().click();
  await page.waitForTimeout(800);
  await seekTo(15);
  await page.screenshot({
    path: path.join(artifactDir, '100_money_pre_incident_zero.png'),
    fullPage: false,
  });

  // --- 3. ACTIVE INCIDENT ACCUMULATING LOSS (01:19) ---
  console.log('\n--- 3. Active Incident Overload (01:19) ---');
  await seekTo(79); // 01:19
  await page.screenshot({
    path: path.join(artifactDir, '101_money_incident_active_accumulating.png'),
    fullPage: false,
  });

  // --- 4. POST-HEAL RECOVERY HOLDING STEADY (01:52) ---
  console.log('\n--- 4. Post-Heal Recovery (01:52): Holds Steady ---');
  await seekTo(112); // 01:52
  await page.screenshot({
    path: path.join(artifactDir, '102_money_post_heal_stopped.png'),
    fullPage: false,
  });

  // --- 5. RIDE-HAILING FLEET (01:19) ---
  console.log('\n--- 5. Ride-Hailing Fleet at 01:19 ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'ridehailing');
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Rainstorm Surge")').first().click();
  await page.waitForTimeout(800);
  await seekTo(79); // 01:19
  await page.screenshot({
    path: path.join(artifactDir, '103_money_ridehailing_active.png'),
    fullPage: false,
  });

  // --- 6. UPI / PAYMENTS SWITCH (01:19) ---
  console.log('\n--- 6. UPI / Payments Switch at 01:19 ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'payments');
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Salary Day")').first().click();
  await page.waitForTimeout(800);
  await seekTo(79); // 01:19
  await page.screenshot({
    path: path.join(artifactDir, '104_money_payments_active.png'),
    fullPage: false,
  });

  // --- 7. ESCAPE PANIC RESET (RESETS CLEANLY TO ₹0) ---
  console.log('\n--- 7. Escape Panic Reset: Cleanly Returns to ₹0 ---');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(artifactDir, '105_money_after_reset_zero.png'),
    fullPage: false,
  });

  console.log('All financial loss UI screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});
