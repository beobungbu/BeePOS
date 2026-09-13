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

/** The seeded owner, documented in the README. Every spec starts from this account. */
export const DEMO_EMAIL = 'owner@chuoi.vn';
export const DEMO_PASSWORD = 'BeePOS@2026';
/** The branch and the till the journeys expect to be standing at. */
export const DEMO_STORE = 'Tạp hoá Cầu Giấy';
export const DEMO_REGISTER = 'Quầy 1';

/**
 * Signs in with the README demo credentials, then picks the branch and the till.
 *
 * Three steps rather than one form: an account is not a shop, and a session with no register
 * books shifts and receipts to nowhere. The owner is assigned to four branches and every
 * branch has two tills, so both pickers always appear for this account.
 */
export async function login(
  page: Page,
  email = DEMO_EMAIL,
  password = DEMO_PASSWORD,
  store = DEMO_STORE,
  register = DEMO_REGISTER,
): Promise<void> {
  await clearPersistedState(page);
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  // The phone select-store screen carries the phrase twice, in the header and in the prompt
  // under the greeting, so match the first occurrence instead of tripping strict mode.
  await page.getByText('Chọn cửa hàng').first().waitFor();
  await page.getByText(store).first().click();
  await page.getByText('Chọn quầy').first().waitFor();
  await page.getByText(register, { exact: true }).first().click();
  await page.waitForURL('**/pos');
  await expect(page.getByText(store).first()).toBeVisible();
}

/** Locks the till from the avatar menu and waits for the PIN pad. */
export async function lockScreen(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Tài khoản' }).click();
  await page.getByText('Khoá màn hình').click();
  await page.waitForURL('**/lock');
}
