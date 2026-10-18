import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleMessages: string[] = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleMessages.push(`[PAGE ERROR] ${err.toString()}`));

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log('Console output:');
  consoleMessages.forEach(m => console.log(m));
  console.log('\nRoot div inner HTML length:', html.length);
  const root = await page.$('#root');
  if (root) {
    const inner = await root.innerHTML();
    console.log('Root inner HTML length:', inner.length);
    console.log('Root inner HTML preview:', inner.slice(0, 300));
  } else {
    console.log('No #root element found!');
  }

  await browser.close();
}

main();
