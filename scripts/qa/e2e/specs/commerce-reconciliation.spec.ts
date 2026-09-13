import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { money, openShift, overlay, pick, posTile } from '../lib/flows';
import { C, MINH_LONG, WHOLESALE_PRODUCT_GROUP } from '../lib/labels';

/**
 * The program's money acceptance in one flow: "cash book, receivables and payables reconcile
 * to orders, receipts and returns".
 *
 * Five documents are raised in one session and every figure they move is asserted as a
 * difference computed here, not as a number read off a mockup:
 *
 *  1. a wholesale order paid `Ghi nợ`      -> receivables up by the invoice
 *  2. a part collection in cash            -> receivables down, cash book up
 *  3. a supplier payment in cash           -> payables down, cash book down
 *  4. a cash-in at the till                -> the shift's expected drawer up
 *  5. the seeded supplier bills            -> the payables opening balance
 *
 * The one seed constant used as an anchor is Minh Long's opening balance (52.400.000 đ,
 * `reports/w-t-foundation-report.md` section 5): everything else is derived from it and from
 * what the screens themselves report before each step.
 *
 * There is deliberately **no** "supplier receipt on credit" step: confirming a goods receipt
 * writes no ledger entry (nothing in `src/features/inventory/**` calls `useLedgerStore`), so
 * the only supplier invoices in the app are the seeded ones. That is recorded as a gap in
 * `docs/qa/e2e-coverage-260913.md` rather than faked here.
 */

const M = {
  receivablesTotal: 'Tổng phải thu',
  payablesTotal: 'Tổng phải trả',
  cashClosing: 'Số dư sổ sách',
  collectPrefix: 'Thu nợ',
  balanceOwed: 'Tổng còn nợ',
  amountCollect: 'Số tiền thu',
  confirmCollect: /^Ghi nhận thu/,
  payPrefix: 'Thanh toán',
  amountPay: 'Số tiền trả',
  confirmPay: /^Ghi nhận trả/,
  cashAction: 'Thu / chi tiền',
  cashAmount: 'Số tiền',
  cashIn: 'Thu vào',
  cashRecord: 'Ghi nhận',
  expectedCash: 'Dự kiến trong két',
} as const;

/** Minh Long owes this before anything in this file happens (`src/data/seed/money.ts`). */
const MINH_LONG_OWES = 52_400_000;
const COLLECTED = 6_000_000;
const PAID_TO_SUPPLIER = 4_000_000;
const CASH_IN = 250_000;

/** Digits of the figure beside a stat-strip label. */
async function stat(page: Page, label: string): Promise<number> {
  const node = page.getByText(label, { exact: true }).first();
  await node.waitFor();
  return money(await node.locator('xpath=..').textContent());
}

/** What one money screen currently reports, read fresh so nothing is carried across a step. */
async function receivables(page: Page): Promise<number> {
  await go(page, '/money/receivables');
  return stat(page, M.receivablesTotal);
}

async function payables(page: Page): Promise<number> {
  await go(page, '/money/payables');
  return stat(page, M.payablesTotal);
}

async function cashBookClosing(page: Page): Promise<number> {
  await go(page, '/money/cashbook');
  return stat(page, M.cashClosing);
}

test.describe('money reconciliation', () => {
  // Playwright requires the fixtures argument to be a destructuring pattern, even here.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'wide', 'the cart pane and the money tables need the desktop layout');
  });

  test('an on-account sale, a collection, a supplier payment and a cash-in all reconcile', async ({
    page,
  }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await openShift(page);

    const openingReceivable = await receivables(page);
    const openingPayable = await payables(page);
    const openingCashBook = await cashBookClosing(page);
    expect(openingReceivable, 'the seeded ledger has customers owing').toBeGreaterThan(MINH_LONG_OWES);
    expect(openingPayable, 'and suppliers owed').toBeGreaterThan(PAID_TO_SUPPLIER);

    let invoiced = 0;
    await test.step('a wholesale order on account raises a receivable and no cash', async () => {
      await go(page, '/pos');
      await page.locator(`[aria-label="${C.wholesale}"]`).first().click();
      await page.getByText(C.attachCustomer).or(page.getByText(C.changeCustomer)).first().click();
      const picker = overlay(page).last();
      await picker.getByRole('searchbox').first().fill(MINH_LONG);
      await picker.getByRole('button', { name: MINH_LONG, exact: true }).first().click();

      await posTile(page, WHOLESALE_PRODUCT_GROUP).click();
      await page.getByRole('button', { name: new RegExp(`^${C.checkout} ·`) }).first().click();
      await page.waitForURL('**/pos/checkout');
      await pick(page, C.onAccount).click();

      // The button names the debt it is about to create, which is the invoice this order books.
      const payButton = page.getByRole('button', { name: new RegExp(`^${C.onAccount} ·`) }).first();
      invoiced = money(await payButton.innerText());
      expect(invoiced).toBeGreaterThan(0);
      await payButton.click();
      await page.waitForURL('**/orders/**');

      expect(await receivables(page)).toBe(openingReceivable + invoiced);
    });

    await test.step('a part collection moves the buyer and the chain by the same amount', async () => {
      await go(page, '/money/receivables');
      await page.getByRole('button', { name: `${M.collectPrefix} ${MINH_LONG}` }).first().click();
      const dialog = overlay(page).last();

      // The anchor: the seeded balance plus the order just rung up, before a dong is collected.
      expect(money(await dialog.getByText(M.balanceOwed).locator('xpath=..').textContent())).toBe(
        MINH_LONG_OWES + invoiced,
      );

      await dialog.getByRole('textbox', { name: M.amountCollect }).fill(String(COLLECTED));
      await dialog.getByRole('button', { name: M.confirmCollect }).click();
      await expect(overlay(page)).toHaveCount(0);

      await expect
        .poll(() => stat(page, M.receivablesTotal), { timeout: 10_000 })
        .toBe(openingReceivable + invoiced - COLLECTED);
    });

    await test.step('a supplier payment lowers the payables by exactly what was paid', async () => {
      await go(page, '/money/payables');
      await page.getByRole('button', { name: new RegExp(`^${M.payPrefix} `) }).first().click();
      const dialog = overlay(page).last();
      await dialog.getByRole('textbox', { name: M.amountPay }).fill(String(PAID_TO_SUPPLIER));
      await dialog.getByRole('button', { name: M.confirmPay }).click();
      await expect(overlay(page)).toHaveCount(0);

      await expect
        .poll(() => stat(page, M.payablesTotal), { timeout: 10_000 })
        .toBe(openingPayable - PAID_TO_SUPPLIER);
    });

    await test.step('a cash-in raises the drawer the shift expects', async () => {
      await go(page, '/pos/shift');
      const before = await stat(page, M.expectedCash);
      await page.getByRole('button', { name: M.cashAction }).first().click();
      await expect(overlay(page).last()).toContainText(M.cashAmount);
      await pick(page, M.cashIn).click();
      await page.getByRole('textbox', { name: M.cashAmount }).fill(String(CASH_IN));
      await page.getByRole('button', { name: new RegExp(`^${M.cashRecord}`) }).last().click();
      await expect.poll(() => stat(page, M.expectedCash), { timeout: 10_000 }).toBe(before + CASH_IN);
    });

    await test.step('the cash book balance is the opening plus what came in, less what went out', async () => {
      // The collection was settled in cash (no bank account picked) and so was the supplier
      // payment, so one is a drawer inflow and the other a drawer outflow.
      //
      // The cash-in is deliberately **not** in this figure. A till cash movement is written to
      // `cash-movement-store` (the phase-6 shift ledger) and the money area reads
      // `ledger-store.cashBook`, so the two never meet: the same is true of a cash sale rung up
      // after the seed. When those are joined up this expectation becomes
      // `+ CASH_IN` and this comment is the note that says so; it is filed as a gap in
      // `docs/qa/e2e-coverage-260913.md`.
      expect(await cashBookClosing(page)).toBe(openingCashBook + COLLECTED - PAID_TO_SUPPLIER);
    });

    await test.step('the three ledgers still agree when read again from scratch', async () => {
      expect(await receivables(page)).toBe(openingReceivable + invoiced - COLLECTED);
      expect(await payables(page)).toBe(openingPayable - PAID_TO_SUPPLIER);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
