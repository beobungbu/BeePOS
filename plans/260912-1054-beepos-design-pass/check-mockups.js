const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  for (const n of ['index','login','select-store','pos','checkout','orders','inventory']) {
    await p.goto('file:///Users/textsoft/workspace/BeePOS/docs/design/mockups/' + n + '.html');
    await p.waitForTimeout(300);
    const cb = await p.$('#map');
    if (cb) { await cb.check(); await p.waitForTimeout(200); }
    const tags = await p.$$eval('[data-beeui]', els => els.length);
    const broken = await p.$$eval('use', els => els.filter(e => {
      const href = e.getAttribute('href'); return !document.querySelector(href);
    }).map(e => e.getAttribute('href')));
    console.log(n, 'regions:', tags, 'brokenIcons:', [...new Set(broken)].join(',') || 'none');
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
