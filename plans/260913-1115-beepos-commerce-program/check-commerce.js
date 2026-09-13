const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1700, height: 1000 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  for (const n of ['index','commerce-sales','commerce-ops']) {
    await p.goto('file:///Users/textsoft/workspace/BeePOS/docs/design/mockups/' + n + '.html');
    await p.waitForTimeout(400);
    const cb = await p.$('#map'); if (cb) { await cb.check(); await p.waitForTimeout(200); }
    const tags = await p.$$eval('[data-beeui]', e => e.length);
    const broken = await p.$$eval('use', els => [...new Set(els.filter(e => !document.querySelector(e.getAttribute('href'))).map(e => e.getAttribute('href')))]);
    console.log(n, 'regions:', tags, 'brokenIcons:', broken.join(',') || 'none');
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
