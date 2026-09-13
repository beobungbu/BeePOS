import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import {
  PRODUCT_A,
  PRODUCT_B,
  V,
  money,
  overlay,
  openShift,
  payWithCash,
  pick,
  pickSupplier,
  posStock,
} from '../lib/flows';

/**
 * The commerce inventory flows of phase 7 (plan rows E and F): a purchase order received in
 * part, a second barcode that scans, a CSV import that refuses its bad row, a damaged return
 * that leaves stock alone, and an exchange that nets to one number.
 *
 * The functional tests run at the 1440 desktop frame and shoot it; a last test walks the same
 * screens at the 375 phone frame for the second half of the screenshot set. The viewport is
 * never resized inside a flow: the shell swaps its whole layout at the breakpoint, which
 * remounts the screen under it and empties any half filled form.
 */

const SHOT_DIR = 'docs/design/after/commerce';
const DESKTOP = { width: 1440, height: 900 } as const;
const PHONE = { width: 375, height: 812 } as const;

/** The seeded partner used for the purchase order; every active partner has one receipt. */
const SUPPLIER = 'Cty CP Acecook Việt Nam';
/** Coca-Cola 330ml is `product-1`; the milk range (`product-21`) is what carries lots. */
const PRODUCT_A_ROUTE = '/products/product-1';
const LOT_PRODUCT_ROUTE = '/products/product-21';
const ORDERED = 10;
const RECEIVED_NOW = 4;
/** A cost the catalogue does not already use, so the blended average has to move. */
const PO_UNIT_COST = 9999;
/** Well formed 13 digit codes from a range the seed catalogue does not use. */
const EXTRA_BARCODE = '4710000000017';
const EXTRA_BARCODE_PHONE = '4710000000024';

/** Visible vi labels this spec drives. */
const L = {
  addProduct: 'Thêm sản phẩm',
  ordered: 'Đặt',
  unitCost: 'Giá vốn',
  receiveNow: 'Nhận lần này',
  sendPo: 'Gửi nhà cung cấp',
  sendPoConfirm: 'Gửi đơn đặt cho nhà cung cấp?',
  receivePo: 'Tạo phiếu nhập cho hàng đã về',
  receivePoConfirm: 'Tạo phiếu nhập cho hàng đã về?',
  poDetail: /^Đơn đặt hàng nhà cung cấp PO/,
  statusPartial: 'Nhận một phần',
  latestCost: 'Giá nhập gần nhất',
  addBarcode: 'Thêm mã vạch',
  extraBarcode: 'Mã vạch phụ 1',
  saveProduct: 'Lưu',
  savedProduct: 'Đã lưu sản phẩm',
  pasteCsv: 'Dán nội dung CSV',
  checkCsv: 'Kiểm tra',
  importTwo: 'Nhập 2 dòng hợp lệ',
  importedToast: 'Đã nhập 2 dòng',
  errorChip: 'Lỗi 1',
  negativePrice: 'Giá bán âm',
  findOrder: 'Tìm đơn hàng',
  findOrderAction: 'Tìm đơn',
  damaged: 'Hàng hỏng',
  restock: 'Nhập lại kho',
  returnValue: 'Giá trị hàng trả',
  exchangeValue: 'Giá trị hàng đổi',
  exchangeAdd: 'Thêm',
  confirmReturn: 'Hoàn tất phiếu trả hàng?',
  returnDone: 'Đã ghi nhận phiếu trả hàng',
  writeOffLog: 'Sổ hàng hỏng',
  lotsSection: 'Lô hàng',
  refundAction: /^Hoàn .* tiền mặt$/,
  chargeAction: /^Thu thêm /,
} as const;

/** A 3 row file: two clean creates and one row priced below zero. */
const IMPORT_CSV = [
  'sku,name,category,unit,costPrice,salePrice,barcode,stock',
  'QA-001,Nước mắm Nam Ngư QA,Đồ uống,chai,20000,32000,,25',
  'QA-002,Dầu ăn Neptune QA,Đồ uống,chai,38000,52000,,12',
  'QA-003,Bánh quy Cosy QA,Đồ uống,gói,10000,-21000,,5',
].join('\n');

async function shot(page: Page, name: string, frame: '1440' | '375'): Promise<void> {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT_DIR}/${name}-${frame}.png` });
}

/** What a keyboard-wedge scanner does: the digits with no delay, then Enter. */
async function scan(page: Page, barcode: string): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.type(barcode, { delay: 0 });
  await page.keyboard.press('Enter');
}

/** The order code the receipt screen is showing. */
async function orderCodeOnReceipt(page: Page): Promise<string> {
  const body = (await page.locator('body').textContent()) ?? '';
  const match = /HD-[A-Z0-9]+-\d{8}-\d{3}/.exec(body);
  if (!match) throw new Error('no order code on the receipt screen');
  return match[0];
}

/** Rings up `qty` units of one product and returns the code of the order it created. */
async function sellOne(page: Page, productName: string, qty: number, narrow: boolean): Promise<string> {
  await go(page, '/pos');
  for (let i = 0; i < qty; i += 1) {
    await page.getByRole('button', { name: new RegExp(`^${productName},`) }).first().click();
  }
  await payWithCash(page, narrow, '1000000');
  const code = await orderCodeOnReceipt(page);
  await go(page, '/pos');
  return code;
}

/** A new purchase order for one product, filled but not sent. */
async function fillPurchaseOrder(page: Page): Promise<void> {
  await go(page, '/inventory/purchase-orders/new');
  await pickSupplier(page, SUPPLIER, 'Nhà cung cấp');
  await page.getByRole('button', { name: L.addProduct }).click();
  const picker = overlay(page).last();
  await picker.getByPlaceholder(V.searchProduct).fill(PRODUCT_A);
  await picker.getByText(PRODUCT_A, { exact: true }).first().click();
  await page.getByRole('textbox', { name: `${L.ordered} ${PRODUCT_A}` }).fill(String(ORDERED));
  await page.getByRole('textbox', { name: `${L.unitCost} ${PRODUCT_A}` }).fill(String(PO_UNIT_COST));
}

async function sendPurchaseOrder(page: Page): Promise<void> {
  await page.getByRole('button', { name: L.sendPo, exact: true }).click();
  const confirm = overlay(page).last();
  await expect(confirm).toContainText(L.sendPoConfirm);
  await confirm.getByRole('button', { name: L.sendPo, exact: true }).click();
  await expect(overlay(page)).toHaveCount(0);
}

/**
 * Opens the purchase order this run raised, which is the one appended last. The list is a
 * table from tablet up and a card list on the phone, so the row is found by the code it shows
 * rather than by a row shape only one of the two has.
 */
async function openLastPurchaseOrder(page: Page): Promise<void> {
  await go(page, '/inventory/purchase-orders');
  const tableRow = page.getByRole('button', { name: L.poDetail }).last();
  if (await tableRow.isVisible().catch(() => false)) {
    await tableRow.click();
  } else {
    // `PO-HN01-20260913-001`: branch, day, running number.
    await page.getByText(/^PO-[A-Z0-9]+-\d{8}-\d{3}$/).last().click();
  }
  await page.waitForURL('**/inventory/purchase-orders/**');
}

async function previewImport(page: Page): Promise<void> {
  await go(page, '/inventory/import');
  await page.getByRole('textbox', { name: L.pasteCsv }).fill(IMPORT_CSV);
  await page.getByRole('button', { name: L.checkCsv, exact: true }).click();
  await expect(page.getByText(L.errorChip).first()).toBeVisible();
}

/** Finds an order on the returns screen and picks one unit of `PRODUCT_A`. */
async function openReturnDraft(page: Page, code: string, disposition: string): Promise<Locator> {
  await go(page, '/pos/returns');
  await page.getByRole('textbox', { name: L.findOrder }).fill(code);
  await page.getByRole('button', { name: L.findOrderAction }).click();
  const row = page.getByRole('row').filter({ hasText: PRODUCT_A }).first();
  await row.getByRole('textbox').first().fill('1');
  await pick(row, disposition).click();
  return row;
}

test.describe('commerce inventory and returns', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'wide', 'editable table columns need the desktop layout');
    await page.setViewportSize(DESKTOP);
  });

  test('a purchase order received in part raises stock and moves the cost', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/pos');
    const before = await posStock(page, PRODUCT_A);

    await test.step('raise the order and send it', async () => {
      await fillPurchaseOrder(page);
      await shot(page, 'purchase-order', '1440');
      await sendPurchaseOrder(page);
    });

    await test.step('receive four of the ten', async () => {
      await openLastPurchaseOrder(page);
      const receiveField = page.getByRole('textbox', { name: `${L.receiveNow} ${PRODUCT_A}` });
      await expect(receiveField).toHaveValue(String(ORDERED));
      await receiveField.fill(String(RECEIVED_NOW));
      await shot(page, 'receive-partial', '1440');

      await page.getByRole('button', { name: L.receivePo, exact: true }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(L.receivePoConfirm);
      await confirm.getByRole('button', { name: L.receivePo, exact: true }).click();
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('the order is partly received, not received', async () => {
      await go(page, '/inventory/purchase-orders');
      await expect(page.getByText(L.statusPartial).first()).toBeVisible();
    });

    await test.step('the till sells the four new units', async () => {
      await go(page, '/pos');
      expect(await posStock(page, PRODUCT_A)).toBe(before + RECEIVED_NOW);
    });

    await test.step('the cost history carries the price it was received at', async () => {
      await go(page, PRODUCT_A_ROUTE);
      await expect(page.getByText(L.latestCost).first()).toBeVisible();
      await expect(page.getByText('9.999 đ').first()).toBeVisible();
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a second barcode on a product scans at the till', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await test.step('add the extra code on the product form', async () => {
      await go(page, PRODUCT_A_ROUTE);
      await page.getByRole('button', { name: L.addBarcode }).click();
      await page.getByRole('textbox', { name: L.extraBarcode }).fill(EXTRA_BARCODE);
      await shot(page, 'product-barcodes', '1440');
      await page.getByRole('button', { name: L.saveProduct, exact: true }).click();
      await expect(page.getByText(L.savedProduct).first()).toBeVisible();
    });

    await test.step('the wedge burst adds the product to the cart', async () => {
      await openShift(page);
      await go(page, '/pos');
      await scan(page, EXTRA_BARCODE);
      await expect(page.getByRole('button', { name: V.checkout }).first()).toBeVisible();
      await expect(page.getByText(PRODUCT_A).last()).toBeVisible();
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a CSV import previews three rows and imports the two that are sound', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await previewImport(page);
    await expect(page.getByText(L.negativePrice).first()).toBeVisible();
    await shot(page, 'csv-import', '1440');

    await page.getByRole('button', { name: L.importTwo }).click();
    await expect(page.getByText(L.importedToast).first()).toBeVisible();

    await test.step('the two sound rows are in the catalogue and the bad one is not', async () => {
      await go(page, '/products');
      await page.getByRole('searchbox').first().fill('QA-00');
      await expect(page.getByText('Nước mắm Nam Ngư QA').first()).toBeVisible();
      await expect(page.getByText('Bánh quy Cosy QA')).toHaveCount(0);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('a damaged return leaves stock alone and lands in the write-off log', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await openShift(page);

    const code = await sellOne(page, PRODUCT_A, 2, false);
    const afterSale = await posStock(page, PRODUCT_A);

    await test.step('return one unit as damaged', async () => {
      await openReturnDraft(page, code, L.damaged);
      await shot(page, 'return-exchange', '1440');

      await page.getByRole('button', { name: L.refundAction }).first().click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(L.confirmReturn);
      await confirm.getByRole('button', { name: L.refundAction }).click();
      await expect(page.getByText(L.returnDone).first()).toBeVisible();
    });

    await test.step('stock is untouched: damaged goods never go back on the shelf', async () => {
      await go(page, '/pos');
      expect(await posStock(page, PRODUCT_A)).toBe(afterSale);
    });

    await test.step('the write-off log explains where the unit went', async () => {
      await go(page, '/inventory/expiring');
      await expect(page.getByText(L.writeOffLog).first()).toBeVisible();
      await expect(page.getByRole('row').filter({ hasText: PRODUCT_A }).first()).toBeVisible();
      await shot(page, 'expiring', '1440');
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('an exchange nets the difference into one number', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await openShift(page);

    const code = await sellOne(page, PRODUCT_A, 2, false);
    const beforeB = await posStock(page, PRODUCT_B);

    await openReturnDraft(page, code, L.restock);
    await page.getByRole('button', { name: L.exchangeAdd, exact: true }).click();
    const picker = overlay(page).last();
    await picker.getByPlaceholder(V.searchProduct).fill(PRODUCT_B);
    await picker.getByText(PRODUCT_B, { exact: true }).first().click();

    await test.step('the two values and the net agree', async () => {
      const returnValue = money(await page.getByText(L.returnValue).first().locator('..').textContent());
      const exchangeValue = money(await page.getByText(L.exchangeValue).first().locator('..').textContent());
      expect(returnValue).toBeGreaterThan(0);
      expect(exchangeValue).toBeGreaterThan(returnValue);
      const action = page.getByRole('button', { name: L.chargeAction }).first();
      await expect(action).toBeVisible();
      expect(money(await action.textContent())).toBe(exchangeValue - returnValue);
    });

    await test.step('completing it moves both products the right way', async () => {
      await page.getByRole('button', { name: L.chargeAction }).first().click();
      const confirm = overlay(page).last();
      await confirm.getByRole('button', { name: L.chargeAction }).click();
      await expect(page.getByText(L.returnDone).first()).toBeVisible();

      await go(page, '/pos');
      expect(await posStock(page, PRODUCT_B)).toBe(beforeB - 1);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('the lots section of a tracked product lists its batches', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, LOT_PRODUCT_ROUTE);
    await expect(page.getByText(L.lotsSection).first()).toBeVisible();
    await shot(page, 'lots', '1440');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('the same screens at the phone frame', async ({ page }) => {
    const { errors } = collectErrors(page);
    await page.setViewportSize(PHONE);
    await login(page);
    await openShift(page);

    await fillPurchaseOrder(page);
    await shot(page, 'purchase-order', '375');
    await sendPurchaseOrder(page);

    await openLastPurchaseOrder(page);
    await expect(page.getByRole('textbox', { name: `${L.receiveNow} ${PRODUCT_A}` })).toBeVisible();
    await shot(page, 'receive-partial', '375');

    await previewImport(page);
    await shot(page, 'csv-import', '375');

    await go(page, PRODUCT_A_ROUTE);
    await page.getByRole('button', { name: L.addBarcode }).click();
    await page.getByRole('textbox', { name: L.extraBarcode }).fill(EXTRA_BARCODE_PHONE);
    await shot(page, 'product-barcodes', '375');
    // Saved rather than abandoned: the form guards unsaved changes, and the guard would block
    // the next navigation behind a dialog the rest of this pass knows nothing about.
    await page.getByRole('button', { name: L.saveProduct, exact: true }).click();
    await expect(page.getByText(L.savedProduct).first()).toBeVisible();

    await go(page, LOT_PRODUCT_ROUTE);
    await expect(page.getByText(L.lotsSection).first()).toBeVisible();
    await shot(page, 'lots', '375');

    const code = await sellOne(page, PRODUCT_A, 2, true);
    await openReturnDraft(page, code, L.damaged);
    await shot(page, 'return-exchange', '375');

    await go(page, '/inventory/expiring');
    await expect(page.getByText(L.writeOffLog).first()).toBeVisible();
    await shot(page, 'expiring', '375');

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
