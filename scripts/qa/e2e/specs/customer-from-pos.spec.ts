import { expect, test } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { V, overlay, showCart } from '../lib/flows';

/**
 * A customer created at the till has to be a real record, not a label on one bill: the
 * quick-add form is the fastest way a shop adds a regular, and the customers screen is where
 * the owner expects to find them afterwards. Both viewports, because the phone reaches the
 * same dialog through the pushed cart route.
 */
const NEW_CUSTOMER = { name: 'Cô Bảy Tạp Hoá', phone: '0777001122' };

test.describe('customer from the till', () => {
  test('quick-add at the till, then find the customer in the directory', async ({ page }, testInfo) => {
    const narrow = testInfo.project.name === 'narrow';
    const { errors } = collectErrors(page);

    await login(page);
    await go(page, '/pos');
    await showCart(page, narrow);

    await test.step('quick-add from the cart', async () => {
      await page.getByRole('button', { name: new RegExp(V.customerDefault) }).first().click();
      const dialog = overlay(page).last();
      await dialog.getByRole('button', { name: V.addCustomer }).click();
      await dialog.getByRole('textbox', { name: V.customerName }).fill(NEW_CUSTOMER.name);
      await dialog.getByRole('textbox', { name: V.customerPhone }).fill(NEW_CUSTOMER.phone);
      await dialog.getByRole('button', { name: V.saveCustomer }).click();
      await expect(overlay(page)).toHaveCount(0);
      // The new customer is attached to the order it was created from.
      await expect(page.getByText(`${NEW_CUSTOMER.name} · ${NEW_CUSTOMER.phone}`)).toBeVisible();
    });

    await test.step('the directory lists the new customer', async () => {
      await go(page, '/customers');
      await page.getByPlaceholder(V.customerSearch).first().fill(NEW_CUSTOMER.name);
      await expect(page.getByText(NEW_CUSTOMER.name).first()).toBeVisible();
      await page.getByText(NEW_CUSTOMER.name).first().click();
      await page.waitForURL('**/customers/**');
      await expect(page.getByText(NEW_CUSTOMER.phone).first()).toBeVisible();
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
