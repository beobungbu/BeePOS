import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { overlay } from '../lib/flows';

/**
 * The settings, promotions, notifications and org-switch flows of phase 7 (row G plus the
 * promotions and loyalty half of row B).
 *
 * Every assertion is written against what the shop owner reads rather than against a control,
 * so the same spec covers the desktop layout (list and edit pane side by side) and the phone
 * one (list here, editor on a pushed route).
 */

/** Visible labels this spec acts on, all in the default locale. */
const L = {
  // Promotions
  promotionsCreate: 'Tạo khuyến mãi',
  promotionName: 'Tên chương trình',
  promotionStart: 'Bắt đầu',
  promotionEnd: 'Kết thúc',
  promotionSave: 'Lưu',
  statusActive: 'Đang chạy',
  statusScheduled: 'Sắp chạy',
  // Loyalty
  loyaltySection: 'Tích điểm',
  loyaltyEarnPer: 'Cứ mỗi',
  loyaltySave: 'Lưu quy tắc',
  // Notifications
  notificationsTitle: 'Thông báo',
  markAllRead: 'Đánh dấu đã đọc tất cả',
  allRead: 'Đã đọc hết',
  // Org switch
  profile: 'Tài khoản',
  orgSection: 'Chuỗi của bạn',
  secondOrg: 'Chuỗi Minh Châu',
  switchOrgConfirm: 'Đổi chuỗi',
  // Store settings
  storeSettingsTitle: 'Cài đặt cửa hàng',
  receiptHeader: 'Tiêu đề hoá đơn',
  saveStoreSettings: 'Lưu cài đặt cửa hàng',
  followsChain: 'Đang theo chuỗi ở mọi mục',
} as const;

const DEMO_STORE_NAME = 'Tạp hoá Cầu Giấy';
const ACTIVE_ORG_KEY = 'beepos.persist.active-org';
const SECOND_ORG_ID = 'chuoi-demo-2';

/** Unread count off the notification screen's own header line ("3 chưa đọc"). */
async function unreadCount(page: Page): Promise<number> {
  const line = page.getByText(/\d+ chưa đọc|Đã đọc hết/).first();
  await line.waitFor();
  const text = (await line.textContent()) ?? '';
  const match = /(\d+) chưa đọc/.exec(text);
  return match ? Number(match[1]) : 0;
}

/**
 * Waits for the notification runner to finish its first pass.
 *
 * The rules re-run on boot and after every store write, debounced, so the list grows from the
 * stored rows to the recomputed ones a moment after the screen opens. Reading a count before
 * that has settled measures the wrong list.
 */
async function settledUnreadCount(page: Page): Promise<number> {
  let previous = -1;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const current = await unreadCount(page);
    if (current === previous) return current;
    previous = current;
    await page.waitForTimeout(600);
  }
  return previous;
}

test.describe('commerce settings, promotions and notifications', () => {
  test('a new promotion lands in the list with a status', async ({ page }, testInfo) => {
    const { errors } = collectErrors(page);
    const narrow = testInfo.project.name === 'narrow';
    const name = `KM E2E ${testInfo.project.name}`;

    await login(page);
    await go(page, '/promotions');

    // Desktop edits in the pane beside the table; the phone pushes the same form.
    if (narrow) {
      await page.getByRole('button', { name: L.promotionsCreate }).click();
      await page.waitForURL('**/promotions/new');
    }

    await page.getByRole('textbox', { name: L.promotionName }).fill(name);
    // A window that opens today and closes in a month, so the row reads as running.
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 86_400_000);
    await page.getByRole('textbox', { name: L.promotionStart }).fill(formatDay(start));
    await page.getByRole('textbox', { name: L.promotionEnd }).fill(formatDay(end));
    await page.getByRole('button', { name: L.promotionSave, exact: true }).click();

    if (narrow) {
      // The new programme keeps its own route after the first save, then the list is checked.
      await expect(page).not.toHaveURL(/promotions\/new$/);
      await go(page, '/promotions');
    }

    const row = page.getByRole('button', { name: new RegExp(`^${escapeText(name)}`) }).first();
    await expect(row).toBeVisible();
    const rowLabel = (await row.getAttribute('aria-label')) ?? '';
    expect(rowLabel.includes(L.statusActive) || rowLabel.includes(L.statusScheduled)).toBe(true);

    expect(errors).toEqual([]);
  });

  test('the loyalty earn rate is editable and its worked example follows it', async ({ page }) => {
    const { errors } = collectErrors(page);

    await login(page);
    await go(page, '/settings');
    await expect(page.getByText(L.loyaltySection).first()).toBeVisible();

    // Seed rule: one point per 10.000 đ, so a 250.000 đ order earns 25.
    await expect(page.getByText(/Đơn 250\.000 đ tích 25 điểm/)).toBeVisible();

    await page.getByRole('textbox', { name: L.loyaltyEarnPer }).fill('20000');
    await page.getByRole('button', { name: L.loyaltySave }).click();

    // 250.000 / 20.000 = 12,5, rounded down by the domain rule.
    await expect(page.getByText(/Đơn 250\.000 đ tích 12 điểm/)).toBeVisible();

    // The rule is chain state, so it survives leaving the screen and coming back.
    await go(page, '/pos');
    await go(page, '/settings');
    await expect(page.getByRole('textbox', { name: L.loyaltyEarnPer })).toHaveValue('20000');

    expect(errors).toEqual([]);
  });

  test('the notification centre marks one row read, then all of them', async ({ page }) => {
    const { errors } = collectErrors(page);

    await login(page);
    await go(page, '/notifications');

    const before = await settledUnreadCount(page);
    expect(before).toBeGreaterThan(0);

    // Reading a row marks it read and takes the reader to what it is about.
    const firstRow = page.getByRole('button', { name: /^Tồn thấp|^Hạn dùng|^Công nợ|^Đặt hàng|^Ca làm việc/ }).first();
    await firstRow.click();
    await go(page, '/notifications');
    await expect.poll(() => unreadCount(page)).toBe(before - 1);

    // The press is retried: a recompute landing in the same frame re-renders the row the
    // press was aimed at, and a lost press here would fail the assertion rather than the app.
    const markAll = page.getByRole('button', { name: L.markAllRead });
    await expect
      .poll(
        async () => {
          if (await markAll.isVisible().catch(() => false)) await markAll.click().catch(() => {});
          return page.getByText(L.allRead).first().isVisible().catch(() => false);
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    expect(errors).toEqual([]);
  });

  test('a store setting is saved against the branch and follows it back', async ({ page }) => {
    const { errors } = collectErrors(page);
    const header = 'CHUỖI TẠP HOÁ BEE · HN01 · E2E';

    await login(page);
    await go(page, '/stores');
    // By role, not by text: the header's store chip carries the branch name too, and the row
    // is what opens the branch (a `Text` with a button role at width, a `ListItem` on a phone).
    await page
      .getByRole('button', { name: new RegExp(`^${escapeText(DEMO_STORE_NAME)}`) })
      .first()
      .click();
    await page.waitForURL(/\/stores\/[^/]+$/);
    await expect(page.getByText(L.storeSettingsTitle).first()).toBeVisible();

    const field = page.getByRole('textbox', { name: L.receiptHeader });
    await field.fill(header);
    await page.getByRole('button', { name: L.saveStoreSettings }).click();

    // The badge counts what this branch overrides; with a header set it is no longer none.
    await expect(page.getByText(L.followsChain)).toHaveCount(0);
    await expect(page.getByText(/\d+ mục khác cấu hình chuỗi/)).toBeVisible();

    // Leaving and returning reads the branch's own value back, not the chain's.
    const url = page.url();
    await go(page, '/stores');
    await go(page, new URL(url).pathname);
    await expect(page.getByRole('textbox', { name: L.receiptHeader })).toHaveValue(header);

    expect(errors).toEqual([]);
  });

  test('switching chain re-points the stored data and returns to the sign-in flow', async ({ page }) => {
    const { errors } = collectErrors(page);

    await login(page);
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), ACTIVE_ORG_KEY))
      .not.toBe(SECOND_ORG_ID);

    await page.getByRole('button', { name: L.profile }).click();
    await expect(page.getByText(L.orgSection)).toBeVisible();
    // Both chains are offered with their store count; the second one is the switch.
    await expect(page.getByText(/4 cửa hàng/).first()).toBeVisible();
    await page.getByText(L.secondOrg).click();

    const dialog = overlay(page).last();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: L.switchOrgConfirm }).click();

    // Data keys now address the second chain, and the till is back at the sign-in form,
    // because a session belongs to the chain it was issued in.
    await page.waitForURL('**/login');
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), ACTIVE_ORG_KEY))
      .toBe(SECOND_ORG_ID);

    expect(errors).toEqual([]);
  });
});

/** `dd/mm/yyyy`, the format the promotion window fields take. */
function formatDay(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function escapeText(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
