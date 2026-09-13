import { expect, test } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { PRODUCT_A, PRODUCT_B, V, overlay, pickSupplier, posStock } from '../lib/flows';

/**
 * The two stock operations that move real numbers: a goods receipt raises what the till can
 * sell, a stock count with a variance overwrites it. Both are proved on the sell screen,
 * which is where a cashier would notice the difference, and both run on either viewport
 * (the receipt and count editors are the same form on a phone).
 */
/**
 * A receipt is booked against a supplier record now, not a typed-in name, so the spec picks a
 * seeded partner. The seed gives every active partner exactly one receipt, which is why the
 * list step below takes the last row with this name rather than the first: the new receipt is
 * appended, so the last one carrying the name is the one this test just wrote.
 */
const SUPPLIER = 'Cty CP Acecook Việt Nam';
const RECEIVED_A = 5;
const RECEIVED_B = 3;
const SHORT_BY = 2;

test.describe('inventory operations', () => {
  test('goods receipt raises stock, a counted variance corrects it', async ({ page }) => {
    const { errors } = collectErrors(page);

    await login(page);
    await go(page, '/pos');
    const beforeA = await posStock(page, PRODUCT_A);
    const beforeB = await posStock(page, PRODUCT_B);

    await test.step('create a receipt with two lines and receive it', async () => {
      await go(page, '/inventory/receipts/new');
      await pickSupplier(page, SUPPLIER);

      for (const [product, qty] of [
        [PRODUCT_A, RECEIVED_A],
        [PRODUCT_B, RECEIVED_B],
      ] as const) {
        await page.getByRole('button', { name: V.addProduct }).click();
        const picker = overlay(page).last();
        await picker.getByPlaceholder(V.searchProduct).fill(product);
        await picker.getByText(product, { exact: true }).first().click();
        // The picker seeds the line with one unit at cost price; the qty field is the first
        // of the row's two inputs (qty, then unit cost).
        const row = page.getByRole('row').filter({ hasText: product });
        await row.getByRole('textbox').first().fill(String(qty));
      }

      await expect(page.getByRole('row').filter({ hasText: PRODUCT_A })).toHaveCount(1);
      await expect(page.getByRole('row').filter({ hasText: PRODUCT_B })).toHaveCount(1);
      await page.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(V.receiveConfirmTitle);
      await confirm.getByRole('button', { name: V.receiveGoods, exact: true }).click();
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('the receipt is listed as received', async () => {
      await go(page, '/inventory/receipts');
      // The list is a table on desktop and a card list on the phone, so the status is read
      // off the receipt itself rather than off a row shape that only one viewport has.
      await page.getByText(SUPPLIER).last().click();
      await page.waitForURL('**/inventory/receipts/**');
      await expect(page.getByText('Đã nhận hàng').first()).toBeVisible();
      await expect(page.getByRole('row').filter({ hasText: PRODUCT_A })).toHaveCount(1);
    });

    let afterReceiptA = 0;
    await test.step('the till sees the new stock', async () => {
      await go(page, '/pos');
      afterReceiptA = await posStock(page, PRODUCT_A);
      expect(afterReceiptA).toBe(beforeA + RECEIVED_A);
      expect(await posStock(page, PRODUCT_B)).toBe(beforeB + RECEIVED_B);
    });

    await test.step('count the shelf short and post the count', async () => {
      await go(page, '/inventory/counts/new');
      await page.getByRole('button', { name: V.generateCount }).click();
      const row = page.getByRole('row').filter({ hasText: PRODUCT_A });
      await expect(row).toHaveCount(1);
      await row.getByRole('textbox').first().fill(String(afterReceiptA - SHORT_BY));
      // The variance column is the reason to run a count at all, so it is asserted here.
      await expect(row).toContainText(`-${SHORT_BY}`);

      await page.getByRole('button', { name: V.post, exact: true }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(V.postConfirmTitle);
      await confirm.getByRole('button', { name: V.post, exact: true }).click();
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('the counted quantity is what the till now sells', async () => {
      await go(page, '/pos');
      expect(await posStock(page, PRODUCT_A)).toBe(afterReceiptA - SHORT_BY);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
