// Renders the phase 6 mockups to PNG for review.
// Run from the repo root: node plans/260913-0903-beepos-chain-tenant/shoot-phase6.js
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DIR = path.resolve(__dirname, '../../docs/design/mockups');
const OUT = path.resolve(__dirname, 'preview');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['auth', 'chain-ops'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const name of pages) {
    const file = path.join(DIR, `${name}.html`);
    if (!fs.existsSync(file)) { console.log('skip', name); continue; }
    await page.goto(`file://${file}`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    const regions = await page.$$eval('[data-beeui]', (e) => e.length);
    const broken = await page.$$eval('use', (els) => [...new Set(els
      .filter((e) => !document.querySelector(e.getAttribute('href')))
      .map((e) => e.getAttribute('href')))]);
    console.log('shot', name, '· regions:', regions, '· brokenIcons:', broken.join(',') || 'none');
  }
  if (errors.length) console.log('PAGE ERRORS:', errors);
  await browser.close();
})();
