import { chromium } from 'playwright';

async function run() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  await p.goto('http://localhost:3000');
  await p.waitForTimeout(2000);
  const info = await p.evaluate(`(() => {
    const rf = document.querySelector('.react-flow');
    const nodes = Array.from(document.querySelectorAll('.react-flow__node')).map(n => {
      const rect = n.getBoundingClientRect();
      return { id: n.getAttribute('data-id'), rect: { w: rect.width, h: rect.height, x: rect.left, y: rect.top } };
    });
    const vp = document.querySelector('.react-flow__viewport');
    return {
      rfRect: rf ? rf.getBoundingClientRect() : null,
      transform: vp ? window.getComputedStyle(vp).transform : null,
      nodesSample: nodes.slice(0, 3)
    };
  })()`);
  console.log(JSON.stringify(info, null, 2));
  await b.close();
}

run();
