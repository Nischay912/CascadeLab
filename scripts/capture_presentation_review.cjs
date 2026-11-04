const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const outDir = path.resolve(__dirname, '../presentation/review_screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve(__dirname, '../presentation/index.html').replace(/\\/g, '/');
  console.log('Loading presentation deck:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const totalSlides = await page.evaluate(() => totalSlides);
  console.log(`Found ${totalSlides} slides to capture.`);

  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx) => {
      goToSlide(idx);
    }, i);
    await page.waitForTimeout(400);

    const slideNum = (i + 1).toString().padStart(2, '0');
    const outPath = path.join(outDir, `slide_${slideNum}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Captured slide ${slideNum} -> ${outPath}`);
  }

  await browser.close();
  console.log('All slides captured successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
