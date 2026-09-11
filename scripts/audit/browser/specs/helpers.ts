import type { Page } from '@playwright/test';

/**
 * Logs into BeePOS (HN01 / PIN 1234, matching README's demo credentials), resolves
 * the owner account's mandatory store picker, then client-side-navigates to the
 * hidden /audit harness route via pushState + popstate.
 *
 * Full-page navigation (page.goto) is avoided for the last hop because BeePOS has no
 * backend: session state is an in-memory zustand store that resets on reload, so a
 * hard navigation to /audit after login would bounce back to /login. See
 * src/data/session-store.ts and the README's "All data is seeded fresh on every
 * reload" note.
 */
export async function gotoAuditHarness(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Mã cửa hàng').fill('HN01');
  await page.getByLabel('Mã PIN').fill('1234');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  // HN01 always resolves to the seed owner (staff-1, access to all 4 stores), so the
  // store picker always appears; pick the first store.
  await page.getByText('Chọn cửa hàng').waitFor();
  await page.getByText('Tạp hoá Cầu Giấy').first().click();

  await page.waitForURL('**/pos');
  await page.evaluate(() => {
    window.history.pushState({}, '', '/audit');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('[data-testid="audit-harness-root"]').waitFor();
}
