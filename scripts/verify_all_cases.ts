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

  // Helper to pause simulation and seek timeline precisely
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

  // --- CASE 1: FLASH SALE PEAK ---
  console.log('\n--- CASE 1: Flash Sale Peak ---');
  await page.locator('button:has-text("Flash Sale Peak")').first().click();
  await page.waitForTimeout(800);

  // 1A. Seek to 79s (01:19 - User Image 1: MUST NOT BE HEALED! Actively failing before Green Dot!)
  await seekTo(79);
  await page.screenshot({
    path: path.join(artifactDir, '75_flash_sale_at_01_19_broken.png'),
    fullPage: false,
  });

  // 1B. Seek to 96s (01:36 - User Image 2 timestamp: actively failing before Green Dot!)
  await seekTo(96);
  await page.screenshot({
    path: path.join(artifactDir, '76_flash_sale_at_01_36_broken.png'),
    fullPage: false,
  });

  // 1C. Seek to 110s (01:50 - Exactly at the Green Dot: Fully Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '77_flash_sale_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  // 1D. Seek to 134s (02:14 - After Green Dot: 100% Healthy Green!)
  await seekTo(134);
  await page.screenshot({
    path: path.join(artifactDir, '78_flash_sale_at_02_14_healed.png'),
    fullPage: false,
  });

  // --- CASE 2: GRADUAL RAMP UP ---
  console.log('\n--- CASE 2: Gradual Ramp Up ---');
  await page.locator('button:has-text("Gradual Ramp Up")').first().click();
  await page.waitForTimeout(800);

  // 2A. Seek to 96s (01:36 - User Image 2: MUST NOT BE HEALED! Actively failing before Green Dot!)
  await seekTo(96);
  await page.screenshot({
    path: path.join(artifactDir, '79_ramp_at_01_36_broken.png'),
    fullPage: false,
  });

  // 2B. Seek to 110s (01:50 - Exactly at Green Dot: Fully Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '80_ramp_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  // --- CASE 3: DIURNAL WAVE ---
  console.log('\n--- CASE 3: Diurnal Wave ---');
  await page.locator('button:has-text("Diurnal Wave")').first().click();
  await page.waitForTimeout(800);

  // 3A. Seek to 79s (01:19: actively failing before Green Dot!)
  await seekTo(79);
  await page.screenshot({
    path: path.join(artifactDir, '81_diurnal_at_01_19_broken.png'),
    fullPage: false,
  });

  // 3B. Seek to 110s (01:50 - Green Dot: Fully Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '82_diurnal_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  // --- CASE 4: PROVIDER LAG 5X (FAULT) ---
  console.log('\n--- CASE 4: Provider Lag 5x Fault ---');
  await page.locator('button:has-text("Constant Baseline")').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Provider Lag")').first().click();
  await page.waitForTimeout(800);

  // 4A. Seek to 79s (01:19: active fault before Green Dot!)
  await seekTo(79);
  await page.screenshot({
    path: path.join(artifactDir, '83_fault_at_01_19_broken.png'),
    fullPage: false,
  });

  // 4B. Seek to 110s (01:50 - Green Dot: Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '84_fault_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  // --- CASE 5: RIDE-HAILING FLEET ARCHITECTURE ---
  console.log('\n--- CASE 5: Ride-Hailing Fleet Architecture ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'ridehailing');
  await page.waitForTimeout(1500);

  const ridesSurgeBtn = await page.locator('button:has-text("Rainstorm Surge")').first();
  await ridesSurgeBtn.click();
  await page.waitForTimeout(800);

  // 5A. Seek to 79s (01:19: active surge before Green Dot!)
  await seekTo(79);
  await page.screenshot({
    path: path.join(artifactDir, '85_ridehailing_at_01_19_broken.png'),
    fullPage: false,
  });

  // 5B. Seek to 110s (01:50 - Green Dot: Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '86_ridehailing_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  // --- CASE 6: UPI / PAYMENTS SWITCH ARCHITECTURE ---
  console.log('\n--- CASE 6: UPI / Payments Switch Architecture ---');
  await page.selectOption('select[title="Switch microservices architecture"]', 'payments');
  await page.waitForTimeout(1500);

  const paymentsSurgeBtn = await page.locator('button:has-text("Salary Day")').first();
  await paymentsSurgeBtn.click();
  await page.waitForTimeout(800);

  // 6A. Seek to 79s (01:19: active spike before Green Dot!)
  await seekTo(79);
  await page.screenshot({
    path: path.join(artifactDir, '87_payments_at_01_19_broken.png'),
    fullPage: false,
  });

  // 6B. Seek to 110s (01:50 - Green Dot: Healed!)
  await seekTo(110);
  await page.screenshot({
    path: path.join(artifactDir, '88_payments_at_01_50_green_dot_healed.png'),
    fullPage: false,
  });

  console.log('All verification screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error('Error in verification:', err);
  process.exit(1);
});
