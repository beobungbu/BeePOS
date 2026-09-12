const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 900, height: 1000 } });
  await p.goto('file:///Users/textsoft/workspace/BeePOS/docs/design/mockups/pos.html');
  await p.check('#map');
  await p.waitForTimeout(400);
  await p.locator('.frame--phone').screenshot({
    path: '/Users/textsoft/workspace/BeePOS/plans/260912-1054-beepos-design-pass/preview/pos-map.png' });
  await b.close();
})();
