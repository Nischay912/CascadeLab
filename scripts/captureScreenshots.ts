import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function capture() {
  const outDir = path.resolve(process.cwd(), 'docs/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // Capture at 1920x1080
  const page1080 = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  await page1080.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page1080.waitForTimeout(2000);
  const path1080 = path.join(outDir, 'step123-1920x1080.png');
  await page1080.screenshot({ path: path1080, fullPage: false });
  console.log(`Saved: ${path1080}`);
  await page1080.close();

  // Capture at 1366x768
  const page768 = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  await page768.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page768.waitForTimeout(2000);
  const path768 = path.join(outDir, 'step123-1366x768.png');
  await page768.screenshot({ path: path768, fullPage: false });
  console.log(`Saved: ${path768}`);
  await page768.close();

  await browser.close();
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
