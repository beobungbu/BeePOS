// Renders each mockup page to a PNG so the design can be reviewed without a browser.
// Run from the repo root: node plans/260912-1054-beepos-design-pass/shoot-mockups.js [name...]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const DIR = path.resolve(__dirname, '../../docs/design/mockups');
const OUT = path.resolve(__dirname, 'preview');
const pages = process.argv.slice(2).length ? process.argv.slice(2)
  : ['index', 'login', 'select-store', 'pos', 'checkout', 'orders'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const name of pages) {
    const file = path.join(DIR, `${name}.html`);
    if (!fs.existsSync(file)) { console.log('skip', name); continue; }
    await page.goto(`file://${file}`);
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    console.log('shot', name);
  }
  if (errors.length) console.log('PAGE ERRORS:', errors);
  await browser.close();
})();
