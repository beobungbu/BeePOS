/**
 * Screenshots of the auth and tenant screens, for `docs/design/after/auth/`.
 *
 * Not part of the gate: the file name matches the suite's `_discover` ignore, so it runs only
 * with `E2E_DISCOVER=1 npx playwright test -c scripts/qa/e2e/playwright.config.ts \
 *   scripts/qa/e2e/specs/auth-shots._discover.spec.ts --project=wide`.
 */
import { test, type Page } from '@playwright/test';
import path from 'node:path';
import { clearPersistedState, DEMO_EMAIL, DEMO_PASSWORD, DEMO_REGISTER, DEMO_STORE } from '../lib/session';

const OUT = path.resolve(__dirname, '../../../../docs/design/after/auth');
const WIDTHS = [375, 1440] as const;

async function shoot(page: Page, name: string, width: number): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: false });
}

async function signIn(page: Page): Promise<void> {
  await page.getByLabel('Email', { exact: true }).fill(DEMO_EMAIL);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.getByText('Chọn cửa hàng').first().waitFor();
  await page.getByText(DEMO_STORE).first().click();
  await page.getByText('Chọn quầy').first().waitFor();
}

for (const width of WIDTHS) {
  test.describe(`auth shots ${width}`, () => {
    test.use({ viewport: { width, height: width === 375 ? 812 : 900 } });

    test('login, register picker, lock, permissions', async ({ page }) => {
      await clearPersistedState(page);
      await page.goto('/login');
      await page.getByRole('button', { name: 'Đăng nhập' }).waitFor();
      await shoot(page, 'login', width);

      await signIn(page);
      await shoot(page, 'select-register', width);

      await page.getByText(DEMO_REGISTER, { exact: true }).first().click();
      await page.waitForURL('**/pos');
      await page.getByRole('button', { name: 'Tài khoản' }).click();
      await page.getByText('Khoá màn hình').click();
      await page.waitForURL('**/lock');
      await shoot(page, 'lock', width);

      // Back in, then the matrix: it is behind the staff area, which needs a session.
      await page.getByRole('button', { name: '1' }).click();
      await page.getByRole('button', { name: '0' }).click();
      await page.getByRole('button', { name: '0' }).click();
      await page.getByRole('button', { name: '0' }).click();
      await page.waitForURL('**/pos');
      await page.goto('/staff/permissions');
      await page.getByText('Ma trận quyền').first().waitFor();
      await shoot(page, 'permissions', width);
    });

    test('onboarding', async ({ page }) => {
      // A device with no chain: the wizard is the only screen that exists there.
      await page.addInitScript(() => {
        try {
          window.localStorage.clear();
          window.localStorage.setItem('beepos.e2e.cleared', '1');
          window.localStorage.setItem(
            'beepos.persist.org',
            JSON.stringify({
              v: 2,
              s: {
                organization: null,
                stores: [],
                staff: [],
                registers: [],
                accounts: [],
                staffActiveById: {},
                storeHoursById: {},
              },
            }),
          );
        } catch {
          // Storage blocked: the app falls back to memory, which still has the seeded chain.
        }
      });
      await page.goto('/onboarding');
      await page.getByRole('button', { name: 'Tiếp theo' }).waitFor();
      await shoot(page, 'onboarding', width);
    });
  });
}
