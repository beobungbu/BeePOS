import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { money, overlay } from '../lib/flows';

/**
 * The money area: collecting part of a customer's debt, paying a supplier, banking cash out of
 * the till, and the cost history behind a product's margin.
 *
 * Every assertion is a difference rather than an absolute figure where the seed is anchored to
 * a fixed instant but the test runs on the real clock: the balance after a 20.000.000 đ
 * collection is exact, while "how much is overdue" moves as invoices cross their due dates, so
 * that one is only ever asserted to have fallen.
 */

/** Visible labels of the money screens, kept in step with `src/i18n/money.vi.ts`. */
const M = {
  // Receivables
  receivablesTotal: 'Tổng phải thu',
  receivablesOverdue: 'Quá hạn',
  collectPrefix: 'Thu nợ',
  balanceOwed: 'Tổng còn nợ',
  amountCollect: 'Số tiền thu',
  confirmCollect: /^Ghi nhận thu/,
  balanceAfterCollect: 'Còn nợ sau khi thu',
  cancel: 'Huỷ',
  // Payables
  payablesTotal: 'Tổng phải trả',
  payPrefix: 'Thanh toán',
  amountPay: 'Số tiền trả',
  confirmPay: /^Ghi nhận trả/,
  // Cash book
  cashClosing: 'Số dư sổ sách',
  depositAction: 'Nộp ngân hàng',
  depositAmount: 'Số tiền nộp',
  depositAccount: 'Tài khoản nhận',
  confirmDeposit: /^Ghi nhận nộp/,
  // Cost history
  costAverageAfter: 'BQ sau',
  costFormula: 'Cách tính bình quân gia quyền',
  costSnapshot: 'Giá vốn chốt khi bán',
} as const;

const CUSTOMER = 'Cty TNHH Thương mại Minh Long';
const COLLECTED = 20_000_000;
const MINH_LONG_OWES = 52_400_000;
const DEPOSITED = 1_000_000;
const PAID = 5_000_000;

/**
 * Digits of the figure under a stat strip label. The label and the value are two nodes inside
 * one column, so the read goes up one level from the label; the label itself carries no digits.
 */
async function stat(page: Page, label: string): Promise<number> {
  const node = page.getByText(label, { exact: true }).first();
  await node.waitFor();
  return money(await node.locator('xpath=..').textContent());
}

/** Picks an option from a BeeUI `Select` by the accessible name of its trigger. */
async function pickOption(page: Page, triggerName: string, optionPattern: RegExp): Promise<void> {
  await page.getByRole('combobox', { name: triggerName }).first().click();
  await page.getByRole('option', { name: optionPattern }).first().click();
}

test.describe('money: collections, supplier payments, cash book and cost', () => {
  test('a partial collection lowers the balance and what is overdue', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/money/receivables');

    const totalBefore = await stat(page, M.receivablesTotal);
    const overdueBefore = await stat(page, M.receivablesOverdue);
    expect(totalBefore).toBeGreaterThan(MINH_LONG_OWES);

    await test.step('the dialog opens on the seeded wholesale account', async () => {
      await page.getByRole('button', { name: `${M.collectPrefix} ${CUSTOMER}` }).first().click();
      const dialog = overlay(page).last();
      await expect(dialog).toContainText(CUSTOMER);
      // The seed is built so this account owes exactly what the commerce mockups show.
      expect(money(await dialog.getByText(M.balanceOwed).locator('xpath=..').textContent())).toBe(
        MINH_LONG_OWES,
      );
    });

    await test.step('the allocation preview states the balance after the collection', async () => {
      const dialog = overlay(page).last();
      await dialog.getByRole('textbox', { name: M.amountCollect }).fill(String(COLLECTED));
      expect(
        money(await dialog.getByText(M.balanceAfterCollect).locator('xpath=..').textContent()),
      ).toBe(MINH_LONG_OWES - COLLECTED);
      await dialog.getByRole('button', { name: M.confirmCollect }).click();
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('the ledger moved by exactly what was collected', async () => {
      await expect
        .poll(async () => stat(page, M.receivablesTotal), { timeout: 10_000 })
        .toBe(totalBefore - COLLECTED);
      // Oldest first, so the money lands on invoices that are already past due.
      expect(await stat(page, M.receivablesOverdue)).toBeLessThan(overdueBefore);
    });

    await test.step('reopening the account shows the new balance', async () => {
      await page.getByRole('button', { name: `${M.collectPrefix} ${CUSTOMER}` }).first().click();
      const dialog = overlay(page).last();
      expect(money(await dialog.getByText(M.balanceOwed).locator('xpath=..').textContent())).toBe(
        MINH_LONG_OWES - COLLECTED,
      );
      await dialog.getByRole('button', { name: M.cancel }).click();
    });

    expect(errors).toEqual([]);
  });

  test('a supplier payment lowers the payables total', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/money/payables');

    const before = await stat(page, M.payablesTotal);
    expect(before).toBeGreaterThan(PAID);

    await page.getByRole('button', { name: new RegExp(`^${M.payPrefix} `) }).first().click();
    const dialog = overlay(page).last();
    await dialog.getByRole('textbox', { name: M.amountPay }).fill(String(PAID));
    await dialog.getByRole('button', { name: M.confirmPay }).click();
    await expect(overlay(page)).toHaveCount(0);

    await expect.poll(async () => stat(page, M.payablesTotal), { timeout: 10_000 }).toBe(before - PAID);

    expect(errors).toEqual([]);
  });

  test('banking cash moves the cash book balance', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/money/cashbook');

    const before = await stat(page, M.cashClosing);

    await page.getByRole('button', { name: M.depositAction, exact: true }).first().click();
    const dialog = overlay(page).last();
    await dialog.getByRole('textbox', { name: M.depositAmount }).fill(String(DEPOSITED));
    await pickOption(page, M.depositAccount, /Vietcombank/);
    await dialog.getByRole('button', { name: M.confirmDeposit }).click();
    await expect(overlay(page)).toHaveCount(0);

    // A deposit is the one banked row that belongs in the cash book: the notes left the till.
    await expect.poll(async () => stat(page, M.cashClosing), { timeout: 10_000 }).toBe(before - DEPOSITED);

    expect(errors).toEqual([]);
  });

  test('the cost history shows the weighted average and the formula behind it', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    // The component is rendered on its own route here. The product detail gains the same one as
    // its "Giá vốn" tab when the catalogue screens pick it up; this asserts the component, not
    // the tab strip that will host it.
    await go(page, '/money/cost/product-1');

    await expect(page.getByText(M.costFormula).first()).toBeVisible();
    await expect(page.getByText(M.costAverageAfter).first()).toBeVisible();
    await expect(page.getByText(M.costSnapshot).first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
