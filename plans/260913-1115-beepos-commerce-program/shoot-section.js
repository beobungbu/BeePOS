const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1700, height: 1000 } });
  const file = process.argv[2], idx = process.argv.slice(3);
  await p.goto('file://' + file);
  await p.waitForTimeout(600);
  const blocks = await p.$$('.frames');
  for (const i of idx) {
    await blocks[Number(i)].screenshot({ path: `/tmp/sec-${i}.png` });
    console.log('sec', i);
  }
  await b.close();
})();
