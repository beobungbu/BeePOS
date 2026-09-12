import { expect, type Page } from '@playwright/test';

/** Console/page errors collected for the whole journey; the journey fails if any remain. */
export function collectErrors(page: Page): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return { errors, warnings };
}

/** Client-side navigation (no reload, in-memory stores survive). */
export async function go(page: Page, path: string): Promise<void> {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await page.waitForURL(`**${path}`);
}

/** Marker that keeps the storage wipe to the first navigation of a browser context. */
const CLEARED_FLAG = 'beepos.e2e.cleared';

/**
 * Wipes the persisted stores (session, carts, orders, catalogue, settings) before the app's
 * first script runs, so a journey always starts from the seed data whatever a previous run
 * left behind. Registered as an init script rather than an `evaluate` because the app hydrates
 * from storage during boot; the flag keeps a deliberate in-journey reload from being wiped too.
 */
export async function clearPersistedState(page: Page): Promise<void> {
  await page.addInitScript((flag: string) => {
    try {
      if (window.localStorage.getItem(flag)) return;
      window.localStorage.clear();
      window.localStorage.setItem(flag, '1');
    } catch {
      // Storage blocked: the app falls back to memory, which is already clean.
    }
  }, CLEARED_FLAG);
}

/** Login with the README demo credentials and pick the first store. */
export async function login(page: Page, storeCode = 'HN01', pin = '1234'): Promise<void> {
  await clearPersistedState(page);
  await page.goto('/login');
  await page.getByLabel('Mã cửa hàng').fill(storeCode);
  await page.getByLabel('Mã PIN').fill(pin);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  // The phone select-store screen carries the phrase twice, in the header and in the prompt
  // under the greeting, so match the first occurrence instead of tripping strict mode.
  await page.getByText('Chọn cửa hàng').first().waitFor();
  await page.getByText('Tạp hoá Cầu Giấy').first().click();
  await page.waitForURL('**/pos');
  await expect(page.getByText('Tạp hoá Cầu Giấy').first()).toBeVisible();
}
