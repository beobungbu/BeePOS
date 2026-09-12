import { expect, test } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import {
  PRODUCT_A,
  PRODUCT_B,
  V,
  openShift,
  overlay,
  orderTabs,
  payWithCash,
  posTile,
} from '../lib/flows';

/**
 * Three bills open at the till at once, which is the whole point of the order tab strip: the
 * cashier parks two customers, finishes the third, and the next bill has to be live the
 * instant the receipt is dismissed. Runs on both viewports: the strip is on the phone too,
 * only the cart moves from a pane to a pushed route.
 */
test.describe('multi-order till', () => {
  test('three open orders, pay one, the next is active, close an empty one', async ({ page }, testInfo) => {
    const narrow = testInfo.project.name === 'narrow';
    const { errors } = collectErrors(page);

    await login(page);
    await openShift(page);
    await go(page, '/pos');

    await test.step('a fresh till holds exactly one empty order', async () => {
      await expect(orderTabs(page)).toHaveCount(1);
      await expect(page.getByRole('button', { name: `${V.switchTo} Đơn 1` })).toBeVisible();
    });

    await test.step('open two more orders', async () => {
      await page.getByRole('button', { name: V.newOrder }).click();
      await expect(orderTabs(page)).toHaveCount(2);
      await page.getByRole('button', { name: V.newOrder }).click();
      await expect(orderTabs(page)).toHaveCount(3);
      // The order just opened is the one being served, so it carries the close control.
      await expect(page.getByRole('button', { name: `${V.closePrefix} Đơn 3` })).toBeVisible();
    });

    await test.step('ring up one product on the third order', async () => {
      await posTile(page, PRODUCT_A).click();
      // An order with lines drops the "Trống" caption for a line count and a running total.
      await expect(page.getByRole('button', { name: `${V.switchTo} Đơn 3` })).not.toContainText('Trống');
    });

    await test.step('the other two orders stay empty and switchable', async () => {
      await page.getByRole('button', { name: `${V.switchTo} Đơn 1` }).click();
      await expect(page.getByRole('button', { name: `${V.closePrefix} Đơn 1` })).toBeVisible();
      await posTile(page, PRODUCT_B).click();
      await page.getByRole('button', { name: `${V.switchTo} Đơn 3` }).click();
      await expect(page.getByRole('button', { name: `${V.closePrefix} Đơn 3` })).toBeVisible();
    });

    await test.step('pay the third order', async () => {
      await payWithCash(page, narrow);
      // The receipt names the order the till falls back to, which is the neighbour of the
      // one that just closed.
      await expect(page.getByRole('button', { name: new RegExp(`${V.continueTo} · Đơn 2`) })).toBeVisible();
      await page.getByRole('button', { name: new RegExp(V.continueTo) }).click();
      await page.waitForURL('**/pos');
    });

    await test.step('two orders left and the neighbour is active', async () => {
      await expect(orderTabs(page)).toHaveCount(2);
      await expect(page.getByRole('button', { name: `${V.switchTo} Đơn 3` })).toHaveCount(0);
      await expect(page.getByRole('button', { name: `${V.closePrefix} Đơn 2` })).toBeVisible();
    });

    await test.step('closing an empty order needs no confirmation', async () => {
      await page.getByRole('button', { name: `${V.closePrefix} Đơn 2` }).click();
      await expect(overlay(page)).toHaveCount(0);
      await expect(orderTabs(page)).toHaveCount(1);
      await expect(page.getByRole('button', { name: `${V.switchTo} Đơn 1` })).toBeVisible();
    });

    await test.step('closing the order that still has lines is confirmed by name', async () => {
      await page.getByRole('button', { name: `${V.closePrefix} Đơn 1` }).click();
      const confirm = overlay(page).last();
      await expect(confirm).toBeVisible();
      await expect(confirm).toContainText('Đơn 1');
      await confirm.getByRole('button', { name: V.closeOrder }).click();
      // Closing the last order leaves a fresh empty one behind rather than no till at all.
      await expect(orderTabs(page)).toHaveCount(1);
      await expect(page.getByRole('button', { name: `${V.switchTo} Đơn 1` })).toContainText('Trống');
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
