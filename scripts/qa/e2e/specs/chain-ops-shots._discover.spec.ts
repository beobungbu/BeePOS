/**
 * Screenshots of the chain operations screens, for `docs/design/after/chain-ops/`, plus the
 * toolbar measurements the density rule is checked against.
 *
 * Not part of the gate: the file name matches the suite's `_discover` ignore, so it runs only
 * with `E2E_DISCOVER=1 npx playwright test -c scripts/qa/e2e/playwright.config.ts \
 *   scripts/qa/e2e/specs/chain-ops-shots._discover.spec.ts --project=wide`.
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { go, login } from '../lib/session';

const OUT = path.resolve(__dirname, '../../../../docs/design/after/chain-ops');
const WIDTHS = [375, 1440] as const;

async function shoot(page: Page, name: string, width: number): Promise<void> {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: false });
}

for (const width of WIDTHS) {
  test.describe(`chain ops shots ${width}`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 } });

    test('suppliers, store prices, cash, Z report, audit', async ({ page }) => {
      const narrow = width < 768;
      await login(page);

      await go(page, '/inventory/suppliers');
      await page.getByText('Nhà cung cấp').first().waitFor();
      await shoot(page, 'suppliers', width);

      await go(page, '/products/product-1');
      await page.getByText('Giá theo cửa hàng').first().waitFor();
      // The section is the last one on the form, so the shot has to reach it.
      await page.getByText('Giá theo cửa hàng').first().scrollIntoViewIfNeeded();
      await shoot(page, 'store-prices', width);

      // A shift with money in it, so the cash sheet and the Z report have figures to show.
      await go(page, '/pos/shift');
      await page.getByRole('textbox', { name: 'Tiền đầu ca' }).fill('1500000');
      await page.getByRole('button', { name: 'Mở ca', exact: true }).click();
      await page.getByRole('button', { name: 'Thu / chi tiền' }).first().waitFor();

      // The "shift opened" toast covers the header on a phone; let it retire before the shot.
      await page.waitForTimeout(4500);
      await page.getByRole('button', { name: 'Thu / chi tiền' }).first().click();
      if (narrow) await page.waitForURL('**/pos/shift/cash');
      await page.getByRole('textbox', { name: 'Số tiền' }).fill('2000000');
      await shoot(page, 'cash-movement', width);
      await page.getByRole('button', { name: /^Ghi nhận/ }).last().click();
      if (narrow) await page.waitForURL('**/pos/shift');

      await go(page, '/pos/shift/z');
      await page.getByTestId('z-report-sheet').waitFor();
      await shoot(page, 'z-report', width);

      await go(page, '/settings/audit');
      await page.getByText('Nhật ký thao tác').first().waitFor();
      await shoot(page, 'audit', width);
    });
  });
}

/**
 * The toolbar band and the first data row on the screens this phase added or changed, so the
 * "never wraps, never clips at 1280 and up" rule has numbers behind it rather than a claim.
 */
test.describe('chain ops toolbar measurements', () => {
  for (const width of [1280, 1440, 1920] as const) {
    test(`toolbar at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await login(page);

      for (const route of ['/inventory', '/inventory/suppliers', '/settings/audit']) {
        await go(page, route);
        await page.waitForTimeout(500);
        const filters = page.getByRole('button', { name: /^Bộ lọc/ });
        const collapsed = (await filters.count()) > 0;
        const band = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('div')].filter((el) => {
            const r = el.getBoundingClientRect();
            return r.top >= 40 && r.top <= 60 && r.height >= 48 && r.height <= 80 && r.width > 600;
          });
          const first = rows[0]?.getBoundingClientRect();
          return first ? { top: Math.round(first.top), height: Math.round(first.height) } : null;
        });
        console.log(`MEASURE ${width} ${route} collapsed=${collapsed} band=${JSON.stringify(band)}`);
      }
    });
  }
});
