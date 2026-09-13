/**
 * Screenshots of the money screens, for `docs/design/after/commerce/`.
 *
 * Not part of the gate: the file name matches the suite's `_discover` ignore, so it runs only
 * with `E2E_DISCOVER=1 npx playwright test -c scripts/qa/e2e/playwright.config.ts \
 *   scripts/qa/e2e/specs/commerce-money-shots._discover.spec.ts --project=wide`.
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { go, login } from '../lib/session';

const OUT = path.resolve(__dirname, '../../../../docs/design/after/commerce');
const WIDTHS = [375, 1440] as const;
const CUSTOMER = 'Cty TNHH Thương mại Minh Long';

async function shoot(page: Page, name: string, width: number): Promise<void> {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: false });
}

for (const width of WIDTHS) {
  test.describe(`money shots ${width}`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 } });

    test('cash book, receivables, collection dialog, payables, cost history', async ({ page }) => {
      await login(page);

      await go(page, '/money/cashbook');
      await page.getByText('Số dư sổ sách').first().waitFor();
      await shoot(page, 'cash-book', width);

      await go(page, '/money/receivables');
      await page.getByText('Tổng phải thu').first().waitFor();
      await shoot(page, 'receivables', width);

      await page.getByRole('button', { name: `Thu nợ ${CUSTOMER}` }).first().click();
      await page.getByText('Tổng còn nợ').first().waitFor();
      await page.getByRole('textbox', { name: 'Số tiền thu' }).fill('20000000');
      await shoot(page, 'collection-dialog', width);
      await page.getByRole('button', { name: 'Huỷ', exact: true }).first().click();

      await go(page, '/money/payables');
      await page.getByText('Tổng phải trả').first().waitFor();
      await shoot(page, 'payables', width);

      await go(page, '/money/cost/product-1');
      await page.getByText('Cách tính bình quân gia quyền').first().waitFor();
      await shoot(page, 'cost-history', width);
    });
  });
}
