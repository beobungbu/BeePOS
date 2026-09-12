import { expect, test, type Page } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { ean13 } from '../../../../src/data/seed/prng';

/**
 * The POS features added in phase 5 W-A: the keyboard-wedge scanner, customer quick-add,
 * naming an order, the discount presets and the printable receipt. One journey, wide only:
 * every one of these is a till interaction that needs the desktop cart pane on screen, and
 * the shared journey already covers the phone shell.
 */

// Barcode of seed product 3 ("Nước ngọt Coca-Cola 1.5L"): the catalogue builds every barcode
// as ean13(893000000000 + sequence), the same source the journey spec uses.
const KNOWN_BARCODE = ean13(String(893_000_000_000 + 3).slice(0, 12));
const KNOWN_PRODUCT = 'Nước ngọt Coca-Cola 1.5L';
// A well formed EAN-13 from a range the seed catalogue does not use.
const UNKNOWN_BARCODE = ean13('471000000001');

const SHOT_DIR = 'docs/design/after/features';

/** Visible vi labels this spec drives, kept here so lib/labels.ts stays the journey's own. */
const L = {
  orderTab: 'Chuyển sang Đơn 1',
  renameTitle: 'Đặt tên đơn',
  renameField: 'Tên đơn',
  renameSave: 'Lưu tên',
  orderName: 'Chị Lan',
  customerDefault: 'Khách lẻ',
  addCustomer: 'Thêm khách mới',
  customerName: 'Tên khách hàng',
  customerPhone: 'Số điện thoại',
  saveCustomer: 'Lưu khách hàng',
  phoneError: 'Số điện thoại phải có 9 đến 11 chữ số',
  orderDiscount: 'Giảm giá đơn',
  apply: 'Áp dụng',
  discountRow: 'Giảm giá',
  print: 'In hoá đơn',
  scanFailed: 'Không tìm thấy sản phẩm với mã vạch này',
};

const NEW_CUSTOMER = { name: 'Chị Lan Quán Nước', phone: '0987000111' };

/**
 * Dialogs and toasts fade, so a screenshot taken the instant an assertion passes catches the
 * animation. This waits for the toasts to expire and the transition to finish.
 */
async function settle(page: Page, ms = 1200): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * What a keyboard-wedge scanner does: the digits far faster than a person types, then Enter.
 * The app only accepts the burst while no text field has focus, so the caret is parked first.
 */
async function scan(page: Page, barcode: string): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.type(barcode, { delay: 0 });
  await page.keyboard.press('Enter');
}

test.describe('pos features', () => {
  // Playwright requires the fixtures argument to be a destructuring pattern, even here.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'wide', 'desktop cart pane only');
  });

  test('scan, quick-add a customer, name an order, preset discount, print', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);

    await test.step('wedge scan: an unknown code names itself in a toast', async () => {
      await go(page, '/pos');
      await scan(page, UNKNOWN_BARCODE);
      await expect(page.getByText(L.scanFailed).first()).toBeVisible();
      await expect(page.getByText(UNKNOWN_BARCODE).first()).toBeVisible();
      await settle(page, 400);
      await page.screenshot({ path: `${SHOT_DIR}/barcode-toast-1280.png` });
    });

    await test.step('wedge scan: a known code adds one unit', async () => {
      await scan(page, KNOWN_BARCODE);
      await expect(page.getByText(KNOWN_PRODUCT).first()).toBeVisible();
      // The cart pane holds the line, not just the catalogue tile it came from.
      await expect(page.getByRole('button', { name: 'Tăng số lượng' }).first()).toBeVisible();
    });

    await test.step('customer quick-add validates and attaches', async () => {
      await page.getByRole('button', { name: new RegExp(L.customerDefault) }).first().click();
      const dialog = page.getByRole('dialog').last();
      await dialog.getByRole('button', { name: L.addCustomer }).click();
      await dialog.getByRole('textbox', { name: L.customerName }).fill(NEW_CUSTOMER.name);
      await dialog.getByRole('textbox', { name: L.customerPhone }).fill('123');
      await dialog.getByRole('button', { name: L.saveCustomer }).click();
      await expect(dialog.getByText(L.phoneError)).toBeVisible();

      await dialog.getByRole('textbox', { name: L.customerPhone }).fill(NEW_CUSTOMER.phone);
      await settle(page);
      await page.screenshot({ path: `${SHOT_DIR}/customer-quick-add-1280.png` });
      await dialog.getByRole('button', { name: L.saveCustomer }).click();
      await expect(page.getByText(`${NEW_CUSTOMER.name} · ${NEW_CUSTOMER.phone}`)).toBeVisible();
    });

    await test.step('double click names the order', async () => {
      await page.getByRole('button', { name: L.orderTab }).dblclick();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog.getByText(L.renameTitle)).toBeVisible();
      await dialog.getByRole('textbox', { name: L.renameField }).fill(L.orderName);
      await dialog.getByRole('button', { name: L.renameSave }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);

      // The name replaces "Đơn 1" on the tab and in the cart pane header.
      await expect(page.getByRole('button', { name: `Chuyển sang ${L.orderName}` })).toBeVisible();
      await settle(page);
      await page.screenshot({ path: `${SHOT_DIR}/order-tab-renamed-1280.png` });
    });

    await test.step('order discount preset applies 10 percent', async () => {
      await page.getByRole('button', { name: L.orderDiscount }).click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog.getByRole('button', { name: '5%' })).toBeVisible();
      await settle(page);
      await page.screenshot({ path: `${SHOT_DIR}/order-discount-presets-1280.png` });

      await dialog.getByRole('button', { name: '10%' }).click();
      await expect(dialog.getByRole('textbox').first()).toHaveValue('10');
      await dialog.getByRole('button', { name: L.apply }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByText(L.discountRow).first()).toBeVisible();
    });

    await test.step('receipt offers a print control and prints the receipt alone', async () => {
      await go(page, '/pos/receipt/order-1');
      const print = page.getByRole('button', { name: L.print });
      await expect(print).toBeVisible();

      // The print stylesheet is what decides what leaves the browser, so the shot is taken
      // in print media rather than of the screen.
      await page.emulateMedia({ media: 'print' });
      await page.screenshot({ path: `${SHOT_DIR}/receipt-print-1280.png` });
      await page.emulateMedia({ media: 'screen' });
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
