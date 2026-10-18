import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.react-flow__node');

  const range = await page.$('input[type="range"]');
  const box = await range!.boundingBox();
  // Click at 50% width (t = 90s)
  await page.mouse.click(box!.x + box!.width * 0.5, box!.y + box!.height / 2);
  await page.waitForTimeout(1000);

  const status = await page.evaluate(`(() => {
    const slider = document.querySelector('input[type="range"]');
    const nodes = Array.from(document.querySelectorAll('.react-flow__node')).map(n => {
      const title = n.querySelector('h4')?.textContent;
      const badge = n.querySelector('.font-mono.font-bold')?.textContent;
      return { title, badge };
    });
    return {
      sliderVal: slider ? slider.value : null,
      nodes: nodes.slice(0, 5)
    };
  })()`);
  console.log('Status at 50% seek:', status);

  await browser.close();
}

main();
