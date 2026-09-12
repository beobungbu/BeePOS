import { expect, test } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { PRODUCT_A, PRODUCT_B, V, openShift, orderTabs, overlay, payWithCash, posTile } from '../lib/flows';

/**
 * What the shop loses when the browser reloads, which after phase 5 is nothing: parked orders,
 * the finished sale and the session all come back from storage. The other half of the promise
 * is the way out, "Đặt lại dữ liệu mẫu", which has to put the seed back rather than merely
 * empty the screen.
 */
test.describe('persistence', () => {
  test('a reload keeps the open order and the sale, a reset puts the seed back', async ({ page }, testInfo) => {
    const narrow = testInfo.project.name === 'narrow';
    const { errors } = collectErrors(page);

    await login(page);
    await openShift(page);
    await go(page, '/pos');

    let orderCode = '';
    await test.step('finish one sale and park another', async () => {
      await posTile(page, PRODUCT_A).click();
      await payWithCash(page, narrow);
      orderCode = (await page.getByText(/HD-HN01-\d{8}-\d{3}/).first().textContent()) ?? '';
      expect(orderCode).toMatch(/HD-HN01-\d{8}-\d{3}/);
      await page.getByRole('button', { name: new RegExp(V.continueTo) }).click();
      await page.waitForURL('**/pos');
      await posTile(page, PRODUCT_B).click();
      await expect(posTile(page, PRODUCT_B)).toHaveAttribute('aria-label', /Trong giỏ 1/);
    });

    await test.step('reload: the parked order is still on the till', async () => {
      await page.reload();
      await expect(posTile(page, PRODUCT_B)).toHaveAttribute('aria-label', /Trong giỏ 1/);
      await expect(orderTabs(page).first()).not.toContainText('Trống');
    });

    await test.step('reload: the finished sale is still in the order list', async () => {
      await go(page, '/orders');
      await expect(page.getByText(orderCode).first()).toBeVisible();
    });

    await test.step('reset the demo data', async () => {
      await go(page, '/settings');
      const reset = page.getByRole('button', { name: V.resetData });
      await reset.scrollIntoViewIfNeeded();
      await reset.click();
      const confirm = overlay(page).last();
      await expect(confirm).toContainText(V.resetConfirmTitle);
      await confirm.getByRole('button', { name: V.resetConfirm, exact: true }).click();
      await expect(page.getByText(V.resetDone).first()).toBeVisible();
    });

    await test.step('the seed is back: no parked lines and no sale of ours', async () => {
      await go(page, '/pos');
      await expect(posTile(page, PRODUCT_B)).not.toHaveAttribute('aria-label', /Trong giỏ/);
      await expect(orderTabs(page)).toHaveCount(1);
      await expect(orderTabs(page).first()).toContainText('Trống');
      await go(page, '/orders');
      await expect(page.getByText(orderCode)).toHaveCount(0);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
