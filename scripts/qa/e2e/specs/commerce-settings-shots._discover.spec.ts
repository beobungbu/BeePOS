/**
 * Screenshots of the settings, promotions, reports and notification screens, for
 * `docs/design/after/commerce/`.
 *
 * Not part of the gate: the file name matches the suite's `_discover` ignore, so it runs only
 * with `E2E_DISCOVER=1 npx playwright test -c scripts/qa/e2e/playwright.config.ts \
 *   scripts/qa/e2e/specs/commerce-settings-shots._discover.spec.ts --project=wide`.
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { go, login } from '../lib/session';
import { pick } from '../lib/flows';

const OUT = path.resolve(__dirname, '../../../../docs/design/after/commerce');
const WIDTHS = [375, 1440] as const;
const DEMO_STORE_NAME = 'Tạp hoá Cầu Giấy';

async function shoot(page: Page, name: string, width: number): Promise<void> {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: false });
}

for (const width of WIDTHS) {
  test.describe(`settings and report shots ${width}`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 } });

    test('promotions, loyalty, the new report cuts, notifications, org switch, store settings', async ({
      page,
    }) => {
      await login(page);

      await go(page, '/promotions');
      await page.getByText('KM Tết sữa Vinamilk').first().waitFor();
      await shoot(page, 'promotions', width);

      await go(page, '/settings');
      await page.getByText('Hệ số tích điểm theo hạng').first().waitFor();
      // The loyalty block is the eighth section down, so the shot scrolls to it first.
      await page.getByText('Hệ số tích điểm theo hạng').first().scrollIntoViewIfNeeded();
      await shoot(page, 'loyalty', width);

      await go(page, '/reports/category');
      await page.getByText('Doanh thu theo danh mục').first().waitFor();
      // The cuts share one period, so widening it once here covers every shot below: the
      // seeded orders are spread over the last month and "Hôm nay" is an empty day.
      await pick(page, '30 ngày').click();
      await shoot(page, 'report-category', width);

      await go(page, '/reports/hours');
      await page.getByText('Doanh thu theo giờ').first().waitFor();
      await shoot(page, 'report-hour', width);

      await go(page, '/reports/products');
      await page.getByText('Lợi nhuận gộp theo sản phẩm').first().waitFor();
      await shoot(page, 'report-product-profit', width);

      await go(page, '/reports/inventory-valuation');
      await page.getByText('Giá trị tồn toàn chuỗi theo tuần').first().waitFor();
      await shoot(page, 'valuation-history', width);

      await go(page, '/reports/debt');
      await page.getByText('Khách hàng còn nợ').first().waitFor();
      await shoot(page, 'report-debt', width);

      await go(page, '/notifications');
      await page.getByText('Đánh dấu đã đọc tất cả').first().waitFor();
      // The runner recomputes the rules a moment after the screen opens.
      await page.waitForTimeout(1_200);
      await shoot(page, 'notifications', width);

      await page.getByRole('button', { name: 'Tài khoản' }).click();
      await page.getByText('Chuỗi của bạn').waitFor();
      await shoot(page, 'org-switch', width);
      await page.keyboard.press('Escape');

      await go(page, '/stores');
      await page
        .getByRole('button', { name: new RegExp(`^${DEMO_STORE_NAME}`) })
        .first()
        .click();
      await page.waitForURL(/\/stores\/[^/]+$/);
      await page.getByText('Cài đặt cửa hàng').first().scrollIntoViewIfNeeded();
      await shoot(page, 'store-settings', width);
    });
  });
}
