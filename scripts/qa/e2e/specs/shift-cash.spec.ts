import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { money, openShift } from '../lib/flows';

/**
 * A cash movement recorded the way a cashier records one, at both widths, asserted on the
 * drawer rather than on a toast.
 *
 * `commerce-reconciliation.spec.ts` already covers a cash-in, but only on the desktop project,
 * and on desktop the cash sheet is a dialog over the shift screen. The phone gets a pushed
 * `/pos/shift/cash` route instead, and that route was where P7-04 lived: the submit sat behind
 * the software keyboard, the movement was never written, and the till reconciled at the end of
 * the day as if no cash had been paid in (`reports/w-n-native-report.md`). A suite that only
 * ever opened the dialog could not see it, so this file drives whichever shape the viewport
 * gets and checks the same four figures either way:
 *
 *   Thu khác, the transaction count, the expected drawer, and the row on the sheet.
 *
 * The web keyboard is not the native one, so this does not reproduce the native cause; what it
 * pins is the phone route's submit path, which had no coverage at all.
 */

const V = {
  cashAction: 'Thu / chi tiền',
  cashAmount: 'Số tiền',
  cashIn: 'Thu vào',
  cashOut: 'Chi ra',
  record: /^Ghi nhận/,
  reasonDeposit: 'Nộp tiền',
  expectedCash: 'Dự kiến trong két',
  cashInStat: 'Thu khác',
  cashOutStat: 'Chi khác',
  countSuffix: 'giao dịch thu chi trong ca này',
  listEmpty: 'Chưa có giao dịch thu chi nào trong ca này',
} as const;

const PAID_IN = 750_000;
const TAKEN_OUT = 250_000;

/** Digits of the figure under a stat-strip label. */
async function stat(page: Page, label: string): Promise<number> {
  const node = page.getByText(label, { exact: true }).first();
  await node.waitFor();
  return money(await node.locator('xpath=..').textContent());
}

/** How many movements the shift screen says this shift has. */
async function movementCount(page: Page): Promise<number> {
  const line = page.getByText(new RegExp(`\\d+ ${V.countSuffix}`)).first();
  await line.waitFor();
  return money(await line.textContent());
}

/**
 * Books one movement from the shift screen, through whichever shape this viewport gets: the
 * dialog on desktop, the pushed route on a phone. The same form is behind both, which is the
 * point: a cashier who learned it on one has not learned it twice.
 */
async function recordMovement(page: Page, direction: 'in' | 'out', amount: number): Promise<void> {
  await page.getByRole('button', { name: V.cashAction }).first().click();

  // The phone pushes a route; the desktop opens a dialog over the shift screen.
  const pushed = await page
    .waitForURL('**/pos/shift/cash', { timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  const form = pushed ? page : page.locator('[role="dialog"]').last();
  await expect(form.getByText(V.cashAmount).first()).toBeVisible();

  if (direction === 'out') await form.getByText(V.cashOut, { exact: true }).first().click();
  await form.getByRole('textbox', { name: V.cashAmount }).fill(String(amount));
  await form.getByRole('button', { name: V.record }).last().click();

  // Either way the cashier ends up back on the shift screen, looking at the drawer.
  await page.waitForURL('**/pos/shift');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
}

test.describe('shift cash movements', () => {
  test('a cash-in and a cash-out move the drawer the shift expects', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await openShift(page);
    await go(page, '/pos/shift');

    const openingDrawer = await stat(page, V.expectedCash);
    const openingCount = await movementCount(page);
    expect(openingDrawer).toBeGreaterThan(0);

    await test.step('a cash-in raises the drawer and is listed', async () => {
      await recordMovement(page, 'in', PAID_IN);

      await expect.poll(() => stat(page, V.cashInStat), { timeout: 10_000 }).toBe(PAID_IN);
      expect(await stat(page, V.expectedCash)).toBe(openingDrawer + PAID_IN);
      expect(await movementCount(page)).toBe(openingCount + 1);
      // The sheet is what a drawer is reconciled from, so the row has to be on it.
      await expect(page.getByText(V.listEmpty)).toHaveCount(0);
      await expect(page.getByText(V.reasonDeposit).first()).toBeVisible();
    });

    await test.step('a cash-out lowers it again, and the two are counted apart', async () => {
      await recordMovement(page, 'out', TAKEN_OUT);

      await expect.poll(() => stat(page, V.cashOutStat), { timeout: 10_000 }).toBe(TAKEN_OUT);
      expect(await stat(page, V.cashInStat)).toBe(PAID_IN);
      expect(await stat(page, V.expectedCash)).toBe(openingDrawer + PAID_IN - TAKEN_OUT);
      expect(await movementCount(page)).toBe(openingCount + 2);
    });

    await test.step('the Z report prints the same two figures', async () => {
      await go(page, '/pos/shift/z');
      const sheet = page.getByTestId('z-report-sheet');
      await sheet.waitFor();
      const text = (await sheet.textContent()) ?? '';
      // Grouped digits, as the roll prints them.
      expect(text).toContain(PAID_IN.toLocaleString('vi-VN'));
      expect(text).toContain(TAKEN_OUT.toLocaleString('vi-VN'));
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
