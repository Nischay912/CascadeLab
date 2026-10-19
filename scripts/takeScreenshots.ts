import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artDir = 'C:/Users/ben09/.gemini/antigravity/brain/bbd6ac31-cb66-4abe-9317-632914d1b4dd';

  // 1. 1536x864 with Sidebar OPEN and CLOSED
  const page = await browser.newPage({ viewport: { width: 1536, height: 864 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Measure when sidebar is OPEN (default)
  const openInfo = await page.evaluate(() => {
    const toolbar = document.querySelector('[data-testid="canvas-toolbar"]');
    const shareBtn = document.querySelector('button[title*="Share architecture"]');
    const tRect = toolbar?.getBoundingClientRect();
    const sRect = shareBtn?.getBoundingClientRect();
    return {
      toolbarWidth: tRect?.width,
      toolbarRight: tRect?.right,
      shareRight: sRect?.right,
      shareText: shareBtn?.textContent?.trim(),
      fitsInside: sRect && tRect ? sRect.right <= tRect.right : false,
      marginRight: sRect && tRect ? tRect.right - sRect.right : 0
    };
  });
  console.log('Sidebar OPEN (1536x864):', JSON.stringify(openInfo, null, 2));
  await page.screenshot({ path: `${artDir}/sidebar_open_1536.png` });

  // Collapse sidebar
  const collapseBtn = await page.$('button[title*="Collapse Controls"], button[title*="Collapse"]');
  if (collapseBtn) {
    await collapseBtn.click();
    await page.waitForTimeout(600);
  }

  // Measure when sidebar is CLOSED
  const closedInfo = await page.evaluate(() => {
    const toolbar = document.querySelector('[data-testid="canvas-toolbar"]');
    const shareBtn = document.querySelector('button[title*="Share architecture"]');
    const tRect = toolbar?.getBoundingClientRect();
    const sRect = shareBtn?.getBoundingClientRect();
    return {
      toolbarWidth: tRect?.width,
      toolbarRight: tRect?.right,
      shareRight: sRect?.right,
      shareText: shareBtn?.textContent?.trim(),
      fitsInside: sRect && tRect ? sRect.right <= tRect.right : false,
      marginRight: sRect && tRect ? tRect.right - sRect.right : 0
    };
  });
  console.log('Sidebar CLOSED (1536x864):', JSON.stringify(closedInfo, null, 2));
  await page.screenshot({ path: `${artDir}/sidebar_closed_1536.png` });

  // 2. 1366x768 with sidebar OPEN
  const page1366 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page1366.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page1366.waitForTimeout(1000);
  const info1366 = await page1366.evaluate(() => {
    const toolbar = document.querySelector('[data-testid="canvas-toolbar"]');
    const shareBtn = document.querySelector('button[title*="Share architecture"]');
    const tRect = toolbar?.getBoundingClientRect();
    const sRect = shareBtn?.getBoundingClientRect();
    return {
      toolbarWidth: tRect?.width,
      toolbarRight: tRect?.right,
      shareRight: sRect?.right,
      shareText: shareBtn?.textContent?.trim(),
      fitsInside: sRect && tRect ? sRect.right <= tRect.right : false,
      marginRight: sRect && tRect ? tRect.right - sRect.right : 0
    };
  });
  console.log('Sidebar OPEN (1366x768):', JSON.stringify(info1366, null, 2));
  await page1366.screenshot({ path: `${artDir}/sidebar_open_1366.png` });

  await browser.close();
  console.log('Screenshots complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
