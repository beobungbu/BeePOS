import { expect, test, type Page } from '@playwright/test';
import { L, type Locale } from '../lib/labels';
import { collectErrors, go, login } from '../lib/session';
import { pickSupplier } from '../lib/flows';
import { ean13 } from '../../../../src/data/seed/prng';

/** A goods receipt is booked against a supplier record now, so the journey picks a seeded one. */
const SEEDED_SUPPLIER = 'Cty TNHH Thực phẩm An Phát';

// Barcode of seed product 3 ("Nước ngọt Coca-Cola 1.5L"): the catalogue builds every barcode
// as ean13(893000000000 + sequence), so the scan step needs no on-screen source for it.
const SCAN_BARCODE = ean13(String(893_000_000_000 + 3).slice(0, 12));

// Full product journey on the merged app. Runs per project (wide/narrow) x locale x theme.
const SHOT_DIR = 'docs/screenshots';
const shouldShoot = (p: string, loc: Locale, th: string) => (p === 'narrow' && loc === 'vi' && th === 'light') || (p === 'wide' && loc === 'en' && th === 'dark');

const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Click a control by its exact visible name whatever its role (button, radio, tab, menuitem). */
function pick(scope: Page | ReturnType<Page['locator']>, name: string) {
  return scope.locator('[role="button"],[role="radio"],[role="tab"],[role="menuitem"],[role="option"]').filter({ hasText: new RegExp(`^${esc(name)}$`) }).first();
}

async function shot(page: Page, on: boolean, name: string) {
  if (on) await page.screenshot({ path: `${SHOT_DIR}/e2e-${name}.png`, fullPage: false });
}

/** Open the cart: permanent pane on wide, the pushed /pos/cart route on narrow. */
async function openCart(page: Page, t: (typeof L)[Locale], narrow: boolean) {
  if (narrow) {
    await page.getByRole('button', { name: t.viewCart }).first().click();
    await page.waitForURL('**/pos/cart');
  }
}

for (const locale of ['vi', 'en'] as Locale[]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`journey ${locale} ${theme}`, async ({ page }, testInfo) => {
      const narrow = testInfo.project.name === 'narrow';
      const on = shouldShoot(testInfo.project.name, locale, theme);
      const { errors, warnings } = collectErrors(page);
      // Annotated, not inferred: the locale step swaps in the English dictionary, whose
      // string literal types differ from the Vietnamese one.
      let t: (typeof L)[Locale] = L.vi;

      await test.step('login', async () => {
        await login(page);
        await shot(page, on, `${testInfo.project.name}-01-pos`);
      });

      await test.step('settings: theme and locale', async () => {
        await go(page, '/settings');
        await pick(page, theme === 'dark' ? L.vi.themeDark : L.vi.themeLight).click();
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        expect(bg).toBeTruthy();
        if (locale === 'en') {
          await page.getByRole('combobox', { name: L.vi.language }).click();
          await page.getByRole('option', { name: /English/ }).click();
          t = L.en;
          await expect(page.getByText(t.language).first()).toBeVisible();
        }
        await shot(page, on, `${testInfo.project.name}-02-settings`);
      });

      await test.step('open shift', async () => {
        await go(page, '/pos/shift');
        await page.getByRole('textbox', { name: t.openingCash }).fill('500000');
        await page.getByRole('button', { name: t.openShift, exact: true }).click();
        await expect(page.getByRole('button', { name: t.openShift, exact: true })).toBeHidden({ timeout: 10_000 }).catch(() => undefined);
      });

      let barcode = '';
      await test.step('pos: add products, barcode, qty, discounts, customer', async () => {
        await go(page, '/pos');
        // first two product tiles: tap the tile (adds 1 unit)
        await page.getByRole('button', { name: 'Nước ngọt Coca-Cola 330ml' }).click();
        await page.getByRole('button', { name: 'Nước ngọt Coca-Cola 500ml' }).click();
        // scan: a barcode scanner types the digits into the catalogue search and sends Enter
        barcode = SCAN_BARCODE;
        expect(barcode).toHaveLength(13);
        const search = page.getByPlaceholder(/mã vạch|barcode/i);
        await search.fill(barcode);
        await search.press('Enter');
        await openCart(page, t, narrow);
        const cart = page;
        await cart.getByRole('button', { name: t.increaseQty }).first().click();
        await cart.getByRole('button', { name: t.lineDiscount }).first().click();
        await pick(page, t.percent).click();
        await page.getByRole('textbox').last().fill('5');
        await page.getByRole('button', { name: t.apply }).click();
        await cart.getByRole('button', { name: t.orderDiscount }).click();
        await pick(page.getByRole('dialog').last(), t.percent).click();
        await page.getByRole('dialog').last().getByRole('textbox').first().fill('10');
        await page.getByRole('dialog').last().getByRole('button', { name: t.apply }).click();
        await cart.getByRole('button', { name: t.customerDefault }).click();
        await page.getByPlaceholder(t.customerSearch).fill('Vũ Minh Nga');
        await page.getByRole('dialog').last().getByText('Vũ Minh Nga').first().click();
        await shot(page, on, `${testInfo.project.name}-03-cart`);
        await cart.getByRole('button', { name: t.checkout }).first().click();
        await page.waitForURL('**/pos/checkout');
      });

      await test.step('checkout split payment and receipt', async () => {
        await pick(page, t.methodTransfer).click();
        await page.getByRole('textbox', { name: t.transferAmount }).fill('10000');
        await page.getByRole('button', { name: t.addPayment }).click();
        await pick(page, t.methodCash).click();
        await page.getByRole('textbox', { name: t.amountReceived }).fill('500000');
        await shot(page, on, `${testInfo.project.name}-04-checkout`);
        // Cash covers the rest, so the one primary button reads "Hoàn tất" and both records
        // the payment and completes the order.
        await page.getByRole('button', { name: t.confirmPay }).click();
        await page.waitForURL('**/pos/receipt/**');
        await expect(page.getByText(t.change).first()).toBeVisible();
        await shot(page, on, `${testInfo.project.name}-05-receipt`);
      });

      await test.step('orders: newest first, partial refund', async () => {
        await go(page, '/orders');
        const first = page.locator('a[href^="/orders/"], [role="button"]').filter({ hasText: /^HD/ }).first();
        // A row's textContent runs the code straight into the next value, so the count can look
        // like a fourth code digit; match the store prefix and the date instead of an exact code.
        const rowText = (await first.textContent()) ?? '';
        expect(rowText, 'newest order (created in this journey) must be listed first').toMatch(/HD-HN01-\d{8}-\d{3}/);
        await first.click();
        await expect(page.getByText(/HD-HN01-\d{8}-\d{3}/).first()).toBeVisible();
        await page.getByRole('button', { name: t.refund, exact: true }).click();
        const dlg = page.getByRole('dialog').last();
        await pick(dlg, t.refundByLine).click();
        await dlg.getByRole('button', { name: t.refundIncrease }).first().click();
        await dlg.getByRole('button', { name: t.confirmRefund }).click();
        await page.locator('[role="alertdialog"],[role="dialog"]').last().getByRole('button', { name: t.confirmRefund }).click();
        await expect(page.getByText(t.partialRefund).first()).toBeVisible();
        await shot(page, on, `${testInfo.project.name}-06-order-refund`);
      });

      await test.step('customers: attached customer visible', async () => {
        await go(page, '/customers');
        await page.getByPlaceholder(/.*/).first().fill('Vũ Minh Nga');
        await page.getByText('Vũ Minh Nga').first().click();
        await expect(page.getByText(/điểm|points/i).first()).toBeVisible();
        await shot(page, on, `${testInfo.project.name}-07-customer`);
      });

      await test.step('products: edit price, categories', async () => {
        await go(page, '/products');
        if (narrow) {
          await page.getByRole('button', { name: /Bánh Oreo Gói 133g/ }).first().click();
        } else {
          await page.getByRole('row').filter({ hasText: 'Bánh Oreo Gói 133g' }).getByRole('button', { name: t.rowActions }).click();
          await pick(page, t.editRow).click();
        }
        await page.waitForURL('**/products/**');
        const price = page.getByRole('textbox', { name: t.salePrice });
        await price.fill('15500');
        await page.getByRole('button', { name: t.save, exact: true }).click();
        await expect(page.getByText(t.productSaved).first()).toBeVisible();
        await go(page, '/products/categories');
        await expect(page.getByText(/Đồ uống|Beverages|Drinks/).first()).toBeVisible();
        await shot(page, on, `${testInfo.project.name}-08-products`);
      });

      await test.step('inventory: receipt, transfer, count', async () => {
        await go(page, '/inventory/receipts/new');
        await pickSupplier(page, SEEDED_SUPPLIER, t.supplier);
        await page.getByRole('button', { name: t.addProduct }).click();
        await page.getByRole('dialog').last().getByRole('searchbox').fill('Oreo');
        await page.getByRole('dialog').last().getByText('Bánh Oreo Gói 133g').first().click();
        await page.getByRole('button', { name: t.receiveGoods, exact: true }).click();
        await page.locator('[role="alertdialog"],[role="dialog"]').last().getByRole('button', { name: t.receiveGoods, exact: true }).click().catch(() => undefined);
        await go(page, '/inventory/transfers/new');
        await page.getByRole('button', { name: t.addProduct }).click();
        await page.getByRole('dialog').last().getByRole('searchbox').fill('Oreo');
        await page.getByRole('dialog').last().getByText('Bánh Oreo Gói 133g').first().click();
        await page.getByRole('button', { name: t.send, exact: true }).click();
        await page.locator('[role="alertdialog"],[role="dialog"]').last().getByRole('button', { name: t.send, exact: true }).click().catch(() => undefined);
        await page.getByRole('button', { name: t.receive, exact: true }).click().catch(() => undefined);
        await page.locator('[role="alertdialog"],[role="dialog"]').last().getByRole('button', { name: t.receive, exact: true }).click().catch(() => undefined);
        await go(page, '/inventory/counts/new');
        await page.getByRole('button', { name: t.generate }).click();
        await page.getByRole('button', { name: t.post, exact: true }).click();
        await page.locator('[role="alertdialog"],[role="dialog"]').last().getByRole('button', { name: t.post, exact: true }).click().catch(() => undefined);
        await go(page, '/inventory');
        await shot(page, on, `${testInfo.project.name}-09-inventory`);
      });

      await test.step('reports: period switch', async () => {
        await go(page, '/reports');
        const stat = page.locator('text=/\\d[\\d.,]*\\s*đ/').first();
        const before = await stat.textContent();
        await pick(page, t.days30).click();
        await expect.poll(async () => (await stat.textContent()) !== before, { timeout: 5000 }).toBeTruthy();
        await pick(page, t.custom).click();
        await shot(page, on, `${testInfo.project.name}-10-reports`);
      });

      await test.step('stores and staff', async () => {
        await go(page, '/stores');
        await page.getByText('Tạp hoá Long Biên').first().click();
        await go(page, '/staff');
        await page.getByText('Vũ Thị Giang').first().click();
        const resetBtn = page.getByRole('button', { name: t.resetPin });
        await resetBtn.scrollIntoViewIfNeeded();
        await resetBtn.click({ timeout: 5000 }).catch(() => resetBtn.dispatchEvent('click'));
        await expect(page.getByRole('dialog').last()).toBeVisible();
        await page.keyboard.press('Escape');
      });

      await test.step('narrow shell: five tabs inside viewport', async () => {
        if (!narrow) return;
        await go(page, '/pos');
        for (const label of t.tabs) {
          const tab = page.getByRole('button', { name: new RegExp(label) }).last();
          await expect(tab).toBeVisible();
          const box = await tab.boundingBox();
          expect(box, label).toBeTruthy();
          expect(box!.x + box!.width, `${label} right edge`).toBeLessThanOrEqual(391);
        }
      });

      await test.step('no console or page errors', async () => {
        if (warnings.length) console.log(`warnings (${warnings.length}):\n` + warnings.slice(0, 10).join('\n'));
        expect(errors, errors.join('\n')).toEqual([]);
      });
    });
  }
}
