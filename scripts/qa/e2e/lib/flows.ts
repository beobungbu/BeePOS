import { expect, type Locator, type Page } from '@playwright/test';
import { go } from './session';

/**
 * Helpers and visible labels shared by the phase-5 feature specs (multi-order, inventory,
 * customers, reports, settings, persistence). `lib/labels.ts` stays the journey spec's own
 * per-locale dictionary; everything here is Vietnamese, the default locale a fresh session
 * starts in, and is named after what the cashier reads on screen.
 */
export const V = {
  // POS
  newOrder: 'Mở đơn mới',
  switchTo: 'Chuyển sang',
  closePrefix: 'Đóng',
  closeOrder: 'Đóng đơn',
  viewCart: 'Xem giỏ hàng',
  checkout: 'Thanh toán',
  methodCash: 'Tiền mặt',
  amountReceived: 'Tiền khách đưa',
  finish: 'Hoàn tất',
  continueTo: 'Bán tiếp',
  openingCash: 'Tiền đầu ca',
  openShift: 'Mở ca',
  closeShift: 'Đóng ca',
  customerDefault: 'Khách lẻ',
  addCustomer: 'Thêm khách mới',
  customerName: 'Tên khách hàng',
  customerPhone: 'Số điện thoại',
  saveCustomer: 'Lưu khách hàng',
  orderDiscount: 'Giảm giá đơn',
  // Command palette
  commandPaletteTitle: 'Tìm nhanh',
  commandPalettePlaceholder: 'Tìm màn hình, sản phẩm, đơn hàng, khách hàng',
  // Customers screen
  customerSearch: 'Tìm theo tên hoặc số điện thoại',
  // Inventory
  supplier: 'Nhà cung cấp',
  addProduct: 'Thêm sản phẩm',
  searchProduct: 'Tìm sản phẩm theo tên hoặc SKU',
  receiveGoods: 'Nhận hàng',
  receiveConfirmTitle: 'Xác nhận nhận hàng?',
  generateCount: 'Tạo dòng kiểm kê',
  post: 'Ghi nhận',
  postConfirmTitle: 'Ghi nhận phiếu kiểm kê?',
  // Reports
  periodToday: 'Hôm nay',
  period30: '30 ngày',
  periodCustom: 'Tuỳ chọn',
  rangeFrom: 'Từ ngày',
  rangeTo: 'Đến ngày',
  datePlaceholder: '--/--/----',
  // Settings
  language: 'Ngôn ngữ',
  languageEn: 'Language',
  resetData: 'Đặt lại dữ liệu mẫu',
  resetConfirmTitle: 'Đặt lại dữ liệu mẫu?',
  resetConfirm: 'Đặt lại',
  resetDone: 'Đã nạp lại dữ liệu mẫu',
} as const;

/** Seed products the feature specs act on; both are in stock in every store. */
export const PRODUCT_A = 'Nước ngọt Coca-Cola 330ml';
export const PRODUCT_B = 'Nước ngọt Coca-Cola 500ml';

const esc = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Click a control by its exact visible name whatever its role (button, radio, tab, option). */
export function pick(scope: Page | Locator, name: string): Locator {
  return scope
    .locator('[role="button"],[role="radio"],[role="tab"],[role="menuitem"],[role="option"]')
    .filter({ hasText: new RegExp(`^${esc(name)}$`) })
    .first();
}

/** Digits of a formatted money string ("1.234.500 đ" -> 1234500). Empty text reads as 0. */
export function money(text: string | null): number {
  const digits = (text ?? '').replace(/\D/g, '');
  return digits.length > 0 ? Number(digits) : 0;
}

/**
 * Any open overlay. BeeUI's web `AlertDialog` lands on `role="dialog"` rather than
 * `role="alertdialog"`, so a confirmation has to be matched on both.
 */
export function overlay(page: Page): Locator {
  return page.locator('[role="alertdialog"],[role="dialog"]');
}

/** The open-order tabs, by the accessible name the strip gives its switch controls. */
export function orderTabs(page: Page): Locator {
  return page.getByRole('button', { name: new RegExp(`^${V.switchTo} `) });
}

/** Opens a shift so the sell screen is in its normal working state (no banner, cash tracked). */
export async function openShift(page: Page, openingCash = '500000'): Promise<void> {
  await go(page, '/pos/shift');
  const open = page.getByRole('button', { name: V.openShift, exact: true });
  const close = page.getByRole('button', { name: V.closeShift, exact: true }).first();
  if (await close.isVisible().catch(() => false)) return; // a shift is already open
  await page.getByRole('textbox', { name: V.openingCash }).fill(openingCash);
  await open.click();
  await expect(close).toBeVisible();
}

/**
 * Brings the cart on screen: on desktop it is the permanent right pane, on the phone it is
 * the pushed `/pos/cart` route behind the floating cart bar.
 */
export async function showCart(page: Page, narrow: boolean): Promise<void> {
  if (!narrow) return;
  await page.getByRole('button', { name: V.viewCart }).first().click();
  await page.waitForURL('**/pos/cart');
}

/** The sell-screen tile for a product, found by the accessible name the card composes. */
export function posTile(page: Page, productName: string): Locator {
  return page.getByRole('button', { name: new RegExp(`^${esc(productName)},`) }).first();
}

/**
 * Units on hand as the sell screen announces them: the tile's accessible name ends with
 * "Còn <n>", "Sắp hết <n>" or "Hết hàng" (`src/features/pos/lib/stock-label.ts`).
 */
export async function posStock(page: Page, productName: string): Promise<number> {
  const tile = posTile(page, productName);
  await tile.waitFor();
  const label = (await tile.getAttribute('aria-label')) ?? '';
  const match = /(?:Còn|Sắp hết)\s+(\d+)/.exec(label);
  if (match) return Number(match[1]);
  if (label.includes('Hết hàng')) return 0;
  throw new Error(`no stock state in tile label: ${label}`);
}

/**
 * Picks the partner a goods receipt is booked against.
 *
 * The field is a `Select` from tablet up and a searchable pushed dialog on the phone
 * (`src/features/suppliers/components/supplier-picker.tsx`), so the helper tries the combobox
 * first and falls back to the dialog. `label` is passed in because the journey runs in both
 * locales; every other spec takes the Vietnamese default.
 */
export async function pickSupplier(page: Page, supplierName: string, label: string = V.supplier): Promise<void> {
  const combo = page.getByRole('combobox', { name: label }).first();
  if (await combo.isVisible().catch(() => false)) {
    await combo.click();
    await page.getByRole('option', { name: supplierName }).first().click();
    return;
  }
  await page.getByRole('button', { name: label }).first().click();
  const dialog = overlay(page).last();
  await dialog.getByRole('searchbox').fill(supplierName);
  await dialog.getByText(supplierName, { exact: true }).first().click();
}

/** Pays the active order in full with cash and lands on its receipt. */
export async function payWithCash(page: Page, narrow: boolean, tendered = '500000'): Promise<void> {
  await showCart(page, narrow);
  await page.getByRole('button', { name: V.checkout }).first().click();
  await page.waitForURL('**/pos/checkout');
  await pick(page, V.methodCash).click();
  await page.getByRole('textbox', { name: V.amountReceived }).fill(tendered);
  await page.getByRole('button', { name: V.finish }).click();
  await page.waitForURL('**/pos/receipt/**');
}
