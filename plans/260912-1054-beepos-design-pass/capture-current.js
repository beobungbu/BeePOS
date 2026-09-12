// One-off capture of the deployed BeePOS build for the design pass "before" record.
// Run from the repo root: node plans/260912-1054-beepos-design-pass/capture-current.js
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE = process.env.BEEPOS_BASEURL || 'https://beepos.beemvp.com';
const OUT = path.resolve(__dirname, '../../docs/design/current');

const VIEWPORTS = [
  { tag: 'phone', width: 375, height: 812 },
  { tag: 'tablet', width: 768, height: 1024 },
  { tag: 'desktop', width: 1440, height: 900 },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel('Mã cửa hàng').fill('HN01');
  await page.getByLabel('Mã PIN').fill('1234');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByText('Chọn cửa hàng').waitFor();
}

async function shot(page, name) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('saved', name);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let tokensDumped = false;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      locale: 'vi-VN',
      isMobile: vp.tag === 'phone',
      hasTouch: vp.tag === 'phone',
    });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await shot(page, `${vp.tag}-01-login`);

      if (!tokensDumped) {
        const vars = await page.evaluate(() => {
          const out = {};
          for (const sheet of Array.from(document.styleSheets)) {
            let rules;
            try { rules = sheet.cssRules; } catch { continue; }
            for (const rule of Array.from(rules || [])) {
              if (!rule.style) continue;
              for (const prop of Array.from(rule.style)) {
                if (prop.startsWith('--')) {
                  const key = `${rule.selectorText || '?'} ${prop}`;
                  out[key] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
          return out;
        });
        fs.writeFileSync(path.join(OUT, 'theme-vars.json'), JSON.stringify(vars, null, 2));
        tokensDumped = true;
      }

      await login(page);
      await shot(page, `${vp.tag}-02-select-store`);
      await page.getByText('Tạp hoá Cầu Giấy').first().click();
      await page.waitForURL('**/pos');
      await shot(page, `${vp.tag}-03-pos`);

      // add a few lines so the cart is not empty
      const tiles = page.locator('[role="button"], button');
      const count = Math.min(await tiles.count(), 30);
      for (let i = 0; i < count; i += 1) {
        const label = await tiles.nth(i).textContent({ timeout: 2000 }).catch(() => '');
        if (label && label.includes('đ') && label.length > 8) {
          await tiles.nth(i).click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(200);
        }
      }
      await shot(page, `${vp.tag}-04-pos-with-cart`);

      await page.goto(`${BASE}/orders`, { waitUntil: 'networkidle' }).catch(() => {});
      await shot(page, `${vp.tag}-05-orders`);
    } catch (err) {
      console.error(`${vp.tag} failed:`, err.message);
    }
    await ctx.close();
  }
  await browser.close();
})();
