import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import {
  PRODUCT_A,
  V,
  money,
  openShift,
  overlay,
  pick,
  pickSupplier,
  posTile,
} from '../lib/flows';
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
 *  4. a goods receipt taken on credit      -> payables up by the bill
 *  5. a retail sale paid in cash           -> the drawer and the cash book up by it
 *  6. a cash-in at the till                -> the drawer and the cash book up by it
 *  7. the seeded supplier bills            -> the payables opening balance
 *
 * The one seed constant used as an anchor is Minh Long's opening balance (52.400.000 đ,
 * `reports/w-t-foundation-report.md` section 5): everything else is derived from it and from
 * what the screens themselves report before each step.
 *
 * Steps 4 to 6 are the wave-3 half. Before it, confirming a goods receipt wrote no ledger
 * entry at all, and a cash sale and a till movement went to `cash-movement-store` while the
 * money area read `ledger-store.cashBook`, so the Z report and the cash book were two private
 * ledgers (`reports/w-e-e2e-perf-report.md` 5.1 and 5.2). Both now go through one helper, and
 * the last step asks the Z report and the cash book the same question.
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
  receiptAmount: 'Số tiền phiếu nhập',
  onCredit: 'Ghi nợ',
  zAction: 'Báo cáo Z',
  zCashSales: 'Bán tiền mặt',
  zCashIn: 'Thu khác',
  zExpected: 'Dự kiến',
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
/** Units of the seeded SKU the goods receipt takes in; its value is read off the screen. */
const RECEIVED_QTY = 10;
/** The partner with 30 day terms (`src/data/seed/suppliers.ts`), so the bill carries a due date. */
const SUPPLIER_ON_TERMS = 'Cty CP Phân phối Miền Bắc';

/** Digits of the figure beside a stat-strip label. */
async function stat(page: Page, label: string): Promise<number> {
  const node = page.getByText(label, { exact: true }).first();
  await node.waitFor();
  return money(await node.locator('xpath=..').textContent());
}

/**
 * One figure off the Z roll, which is a single monospaced block rather than label and value
 * nodes: the line that starts with the label, minus everything that is not a digit.
 */
function zFigure(sheet: string, label: string): number {
  const line = sheet.split('\n').find((row) => row.trim().startsWith(label));
  // The amount is flush right, and the label itself can carry a count ("Thu khác (1)"), so
  // only the trailing figure is read rather than every digit on the row.
  return money(/[\d.]+\s*đ\s*$/.exec(line ?? '')?.[0] ?? '');
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

    let billed = 0;
    await test.step('a goods receipt taken on credit raises what the chain owes the partner', async () => {
      const payableBefore = await payables(page);

      await go(page, '/inventory/receipts/new');
      await pickSupplier(page, SUPPLIER_ON_TERMS);
      await page.getByRole('button', { name: V.addProduct }).click();
      const picker = overlay(page).last();
      await picker.getByPlaceholder(V.searchProduct).fill(PRODUCT_A);
      await picker.getByText(PRODUCT_A, { exact: true }).first().click();
      const row = page.getByRole('row').filter({ hasText: PRODUCT_A });
      await row.getByRole('textbox').first().fill(String(RECEIVED_QTY));

      // The choice the screen offers: money now, or a bill on the partner's terms.
      await pick(page, M.onCredit).click();
      billed = money(
        await page.getByText(M.receiptAmount, { exact: true }).first().locator('xpath=..').textContent(),
      );
      expect(billed, 'the receipt is worth something to owe').toBeGreaterThan(0);

      await page.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(V.receiveConfirmTitle);
      await confirm.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      await expect(overlay(page)).toHaveCount(0);

      await expect.poll(() => payables(page), { timeout: 10_000 }).toBe(payableBefore + billed);
    });

    let cashSale = 0;
    await test.step('a retail sale in cash reaches the drawer and the branch cash book', async () => {
      const bookBefore = await cashBookClosing(page);
      await go(page, '/pos/shift');
      const drawerBefore = await stat(page, M.expectedCash);

      await go(page, '/pos');
      await posTile(page, PRODUCT_A).click();
      await page.getByRole('button', { name: new RegExp(`^${C.checkout} ·`) }).first().click();
      await page.waitForURL('**/pos/checkout');
      await pick(page, V.methodCash).click();
      await page.getByRole('textbox', { name: V.amountReceived }).fill('500000');
      const finish = page.getByRole('button', { name: new RegExp(`^${V.finish} ·`) }).first();
      cashSale = money(await finish.innerText());
      await finish.click();
      await page.waitForURL('**/pos/receipt/**');

      // The same money in both places: the till expects it in the drawer and the branch cash
      // book has the row.
      await go(page, '/pos/shift');
      expect(await stat(page, M.expectedCash)).toBe(drawerBefore + cashSale);
      expect(await cashBookClosing(page)).toBe(bookBefore + cashSale);
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
      // Every drawer movement of the session, whichever screen made it: the collection and the
      // supplier payment were settled in cash, the sale was paid in notes and the cash-in was
      // handed over the counter. The receipt was taken on credit, so it moved no cash.
      expect(await cashBookClosing(page)).toBe(
        openingCashBook + COLLECTED - PAID_TO_SUPPLIER + cashSale + CASH_IN,
      );
    });

    await test.step('the Z report of the shift and the cash book agree about the till', async () => {
      await go(page, '/pos/shift/z');
      const sheet = (await page.getByTestId('z-report-sheet').textContent()) ?? '';

      // The two used to be separate ledgers: the roll counted the till's own movements and the
      // cash book counted everything except them. They are now the same events read two ways.
      expect(zFigure(sheet, M.zCashSales)).toBe(cashSale);
      expect(zFigure(sheet, M.zCashIn)).toBe(CASH_IN);

      await go(page, '/pos/shift');
      expect(await stat(page, M.expectedCash)).toBe(zFigure(sheet, M.zExpected));
    });

    await test.step('the three ledgers still agree when read again from scratch', async () => {
      expect(await receivables(page)).toBe(openingReceivable + invoiced - COLLECTED);
      expect(await payables(page)).toBe(openingPayable - PAID_TO_SUPPLIER + billed);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
