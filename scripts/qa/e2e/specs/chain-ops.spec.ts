import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { V, money, openShift, overlay, pick, pickSupplier, posTile } from '../lib/flows';

/**
 * Phase 6 wave 2: the five chain operations, each proved by the number it is supposed to move
 * rather than by the control that moves it.
 *
 * 1. a supplier created here is the one a goods receipt books against;
 * 2. a store price typed on the product detail is the price the sell screen quotes;
 * 3. a cash-in raises the drawer the shift expects at close;
 * 4. the Z report renders and balances;
 * 5. the audit log filters, and holds the lines the steps above wrote.
 *
 * Both viewports where the screen exists at both. The cash sheet is a dialog on desktop and a
 * pushed route on the phone, so the helper below takes whichever is on screen.
 */

const NEW_SUPPLIER = 'NCC Chuỗi E2E';
const NEW_SUPPLIER_PHONE = '024 9999 1234';
/** `Nước ngọt Coca-Cola 330ml`, the first seeded SKU, priced 9.000 đ by the chain. */
const PRICED_PRODUCT = 'Nước ngọt Coca-Cola 330ml';
const PRICED_PRODUCT_ID = 'product-1';
const STORE_PRICE = 11500;
const CASH_IN = 300000;
/** `src/data/seed/audit.ts` writes three `orderVoid` lines. */
const SEEDED_VOIDS = 3;

const VI = {
  suppliersTitle: 'Nhà cung cấp',
  addSupplier: 'Thêm nhà cung cấp',
  supplierName: 'Tên nhà cung cấp',
  supplierPhone: 'Số điện thoại',
  saveSupplier: 'Lưu nhà cung cấp',
  storePriceInput: 'Giá riêng tại Tạp hoá Cầu Giấy',
  setStorePrice: 'Đặt giá riêng',
  cashAction: 'Thu / chi tiền',
  cashAmount: 'Số tiền',
  cashIn: 'Thu vào',
  cashRecord: 'Ghi nhận',
  expectedCash: 'Dự kiến trong két',
  zReport: 'Báo cáo Z',
  auditFilterAction: 'Thao tác',
  auditVoid: 'Huỷ đơn',
  auditCashIn: 'Thu tiền',
} as const;

/**
 * Digits of the money value in the shift's "Dự kiến trong két" stat. The label and the figure
 * are two nodes inside one card, so the read goes up one level from the label; matching the
 * card directly would take the innermost box, which holds the label and no digits.
 */
async function expectedCash(page: Page): Promise<number> {
  const label = page.getByText(VI.expectedCash, { exact: true }).first();
  await label.waitFor();
  return money(await label.locator('xpath=..').textContent());
}

test.describe('chain operations', () => {
  test('a new supplier is bookable on a goods receipt', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await test.step('create the supplier from the list screen', async () => {
      await go(page, '/inventory/suppliers');
      await expect(page.getByText(VI.suppliersTitle).first()).toBeVisible();
      await page.getByRole('button', { name: VI.addSupplier }).first().click();
      await page.waitForURL('**/inventory/suppliers/new');
      await page.getByRole('textbox', { name: VI.supplierName }).fill(NEW_SUPPLIER);
      await page.getByRole('textbox', { name: VI.supplierPhone }).fill(NEW_SUPPLIER_PHONE);
      await page.getByRole('button', { name: VI.saveSupplier }).click();
      await page.waitForURL('**/inventory/suppliers');
      await expect(page.getByText(NEW_SUPPLIER).first()).toBeVisible();
    });

    await test.step('the receipt form offers it and books against it', async () => {
      await go(page, '/inventory/receipts/new');
      await pickSupplier(page, NEW_SUPPLIER);
      await page.getByRole('button', { name: V.addProduct }).click();
      const picker = overlay(page).last();
      await picker.getByPlaceholder(V.searchProduct).fill(PRICED_PRODUCT);
      await picker.getByText(PRICED_PRODUCT, { exact: true }).first().click();
      await page.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(V.receiveConfirmTitle);
      await confirm.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('the purchase history on the supplier shows the receipt', async () => {
      await go(page, '/inventory/suppliers');
      await page.getByText(NEW_SUPPLIER).first().click();
      await page.waitForURL('**/inventory/suppliers/**');
      await expect(page.getByText('Lịch sử nhập hàng').first()).toBeVisible();
      await expect(page.getByText(/receipt-/).first()).toBeVisible();
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a store price is what the sell screen quotes', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await go(page, '/pos');
    const before = (await posTile(page, PRICED_PRODUCT).getAttribute('aria-label')) ?? '';
    const chainPrice = money(before);

    await test.step('set a branch price on the product detail', async () => {
      // Straight to the record: the catalogue is a table on desktop and a card list on the
      // phone, and this test is about the price, not about how a row is opened.
      await go(page, `/products/${PRICED_PRODUCT_ID}`);
      const input = page.getByRole('textbox', { name: VI.storePriceInput }).first();
      await input.scrollIntoViewIfNeeded();
      await input.fill(String(STORE_PRICE));
      await page.getByRole('button', { name: VI.setStorePrice }).first().click();
    });

    await test.step('the tile quotes the branch price, not the chain price', async () => {
      await go(page, '/pos');
      await expect
        .poll(async () => money((await posTile(page, PRICED_PRODUCT).getAttribute('aria-label')) ?? ''), {
          timeout: 10_000,
        })
        .not.toBe(chainPrice);
      const after = money((await posTile(page, PRICED_PRODUCT).getAttribute('aria-label')) ?? '');
      // The label is "<name>, <price>, <stock>", and the name carries no digits of its own
      // except the variant, so the price is the first money value in it.
      expect(String(after)).toContain(String(STORE_PRICE));
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a cash-in raises the cash the shift expects, and the Z report opens', async ({ page }, testInfo) => {
    const { errors } = collectErrors(page);
    const narrow = testInfo.project.name === 'narrow';
    await login(page);
    await openShift(page, '1500000');

    await go(page, '/pos/shift');
    const before = await expectedCash(page);

    await test.step('record a cash-in', async () => {
      await page.getByRole('button', { name: VI.cashAction }).first().click();
      if (narrow) {
        await page.waitForURL('**/pos/shift/cash');
      } else {
        await expect(overlay(page).last()).toContainText(VI.cashAmount);
      }
      // The form opens on "Thu vào"; pressing it again is harmless and makes the branch explicit.
      await pick(page, VI.cashIn).click();
      await page.getByRole('textbox', { name: VI.cashAmount }).fill(String(CASH_IN));
      await page.getByRole('button', { name: new RegExp(`^${VI.cashRecord}`) }).last().click();
      if (narrow) await page.waitForURL('**/pos/shift');
    });

    await test.step('the drawer the shift expects is higher by exactly that amount', async () => {
      await expect.poll(() => expectedCash(page), { timeout: 10_000 }).toBe(before + CASH_IN);
      await expect(page.getByText('+300.000 đ').first()).toBeVisible();
    });

    await test.step('the Z report renders and its drawer block balances', async () => {
      await page.getByRole('button', { name: VI.zReport }).first().click();
      await page.waitForURL('**/pos/shift/z');
      const sheet = (await page.getByTestId('z-report-sheet').textContent()) ?? '';
      expect(sheet).toContain('BÁO CÁO CUỐI NGÀY (Z)');
      expect(sheet).toContain('+300.000 đ');
      expect(sheet).toContain('1.500.000 đ');
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('the audit log lists what was done and filters it', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await go(page, '/settings/audit');
    await expect(page.getByText(VI.auditVoid).first()).toBeVisible();
    const total = money(await page.getByText(/\d+ sự kiện/).first().textContent());
    expect(total).toBeGreaterThan(0);

    await test.step('filtering by action narrows the log', async () => {
      const combo = page.getByRole('combobox', { name: VI.auditFilterAction }).first();
      if (!(await combo.isVisible().catch(() => false))) {
        await page.getByRole('button', { name: /^Bộ lọc/ }).first().click();
      }
      await page.getByRole('combobox', { name: VI.auditFilterAction }).first().click();
      await page.getByRole('option', { name: VI.auditVoid }).first().click();
      // The seed holds exactly three voided orders, so the filter has a number to land on
      // rather than only "fewer than before".
      await expect
        .poll(async () => money(await page.getByText(/\d+ sự kiện/).first().textContent()), {
          timeout: 10_000,
        })
        .toBe(SEEDED_VOIDS);
      expect(SEEDED_VOIDS).toBeLessThan(total);
      // Every summary left on screen is a void. Counted on the rows: BeeUI keeps a closed
      // `Select`'s options in the DOM, so a page-wide text match would also find the option
      // labels of the filter itself.
      await expect(page.getByText(/^Huỷ đơn \d/)).toHaveCount(SEEDED_VOIDS);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
