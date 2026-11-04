const { chromium } = require('playwright');
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');
const { slides } = require('./build_presentation_deck.cjs');

async function generatePowerPoint() {
  console.log('================================================================');
  console.log('CascadeLab — Automated PowerPoint Deck Generator (.pptx)');
  console.log('Project Management & Entrepreneurship (PME) • Alternative Assessment');
  console.log('Team (Dept. of ISE): Nischay Kumar, Suchith N, Uday Kumar, Sthambaj');
  console.log('================================================================\n');

  const slidesImgDir = path.resolve(__dirname, '../presentation/ppt_slides');
  if (!fs.existsSync(slidesImgDir)) {
    fs.mkdirSync(slidesImgDir, { recursive: true });
  }

  // 1. Launch Playwright headless browser at 2x Retina Resolution
  console.log('[1/4] Launching headless browser for ultra-HD 16:9 slide rendering...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2 // 3840 x 2160 ultra-HD master rendering
  });
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve(__dirname, '../presentation/index.html').replace(/\\/g, '/');
  console.log(`[2/4] Loading presentation deck: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // Activate full-bleed ppt-mode (hides web buttons, removes borders, full 16:9 canvas)
  await page.evaluate(() => {
    document.body.classList.add('ppt-mode');
  });
  await page.waitForTimeout(200);

  const totalSlides = slides.length;
  console.log(`[3/4] Capturing ${totalSlides} pixel-perfect master slides...`);
  const slideImagePaths = [];

  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx) => {
      goToSlide(idx);
    }, i);
    await page.waitForTimeout(350); // allow SVG animations & KaTeX math to settle

    const slideNum = (i + 1).toString().padStart(2, '0');
    const outImgPath = path.join(slidesImgDir, `slide_${slideNum}.png`);
    await page.screenshot({ path: outImgPath, fullPage: false });
    slideImagePaths.push(outImgPath);
    console.log(`  ✓ Rendered Slide ${slideNum}/${totalSlides}: "${slides[i].title}"`);
  }

  await browser.close();
  console.log('  All master slide graphics rendered successfully!\n');

  // 2. Build the PowerPoint (.pptx) Deck
  console.log('[4/4] Assembling PowerPoint (.pptx) with embedded Presenter Notes...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 16:9 Widescreen (10" x 5.625")
  pptx.title = 'CascadeLab — Distributed Systems Resilience Digital Twin';
  pptx.subject = 'Project Management & Entrepreneurship (PME) Alternative Assessment Technique (AAT)';
  pptx.author = 'Nischay Kumar, Suchith N, Uday Kumar, Sthambaj';
  pptx.company = 'Department of Information Science & Engineering (ISE)';
  pptx.revision = '2.0';

  for (let i = 0; i < totalSlides; i++) {
    const s = slides[i];
    const pptxSlide = pptx.addSlide();
    pptxSlide.title = s.title;

    // Full-bleed edge-to-edge slide visual
    pptxSlide.addImage({
      path: slideImagePaths[i],
      x: 0,
      y: 0,
      w: '100%',
      h: '100%'
    });

    // Clean plain-text glance summary
    const cleanGlance = s.glanceSummary ? s.glanceSummary.replace(/<[^>]+>/g, '').trim() : '';

    // Comprehensive Presenter Notes for PowerPoint Presenter View (Alt+F5)
    const notesText = [
      `================================================================`,
      `SLIDE ${(i + 1).toString().padStart(2, '0')}: ${s.title.toUpperCase()}`,
      `SUBTITLE: ${s.subtitle}`,
      `PME RUBRIC: ${s.pmeCategory}`,
      `LIVE PLATFORM: https://cascade-lab.vercel.app/`,
      `================================================================`,
      ``,
      `[2-SECOND GLANCE SUMMARY]:`,
      cleanGlance,
      ``,
      `[SPEAKER SCRIPT & VERBAL PITCH]:`,
      s.speakerNotes,
      ``,
      `[TEAM ROSTER & ATTRIBUTION]:`,
      `• Department of Information Science & Engineering (ISE)`,
      `• Nischay Kumar — Full-Stack Systems & Simulation Architect`,
      `• Suchith N — Frontend & AI Graphics Lead`,
      `• Uday Kumar — Chaos & Static Intelligence Lead`,
      `• Sthambaj — AIOps & Business Modeling Lead`,
      `================================================================`
    ].join('\n');

    pptxSlide.addNotes(notesText);
  }

  // Save the deck to both the project root and presentation/ directory
  const rootPptxPath = path.resolve(__dirname, '../CascadeLab_PME_AAT_Presentation.pptx');
  const presentationPptxPath = path.resolve(__dirname, '../presentation/CascadeLab_PME_AAT_Presentation.pptx');

  await pptx.writeFile({ fileName: rootPptxPath });
  fs.copyFileSync(rootPptxPath, presentationPptxPath);

  const stats = fs.statSync(rootPptxPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n================================================================');
  console.log('✓ SUCCESS: Professional PowerPoint (.pptx) generated!');
  console.log(`  File Location 1: ${rootPptxPath}`);
  console.log(`  File Location 2: ${presentationPptxPath}`);
  console.log(`  Deck Size: ${sizeMB} MB (${totalSlides} widescreen 16:9 slides)`);
  console.log('  Features:');
  console.log('    • 100% 1:1 Pixel-Perfect Visuals from "npm run presentation"');
  console.log('    • Native PowerPoint Presenter Notes on every slide for easy speaking');
  console.log('    • 16:9 Widescreen Layout matching all modern projectors and displays');
  console.log('    • Slide titles and metadata embedded for PowerPoint navigation');
  console.log('================================================================\n');
}

generatePowerPoint().catch(err => {
  console.error('Fatal PowerPoint Generation Error:', err);
  process.exit(1);
});
