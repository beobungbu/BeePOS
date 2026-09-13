import { expect, test, type Page } from '@playwright/test';
import {
  C,
  MINH_LONG,
  MINH_LONG_ID,
  WHOLESALE_PRODUCT_GROUP,
  WHOLESALE_PRODUCT_UNITS,
} from '../lib/labels';
import { money, overlay, pick, posTile, showCart } from '../lib/flows';
import { go, login } from '../lib/session';

/**
 * Phase 7, the sales and pricing half: the per-order wholesale switch, unit conversion, the
 * price-source label, on-account payment and the receivable it raises, a price rule taking
 * effect, and a wholesale order walking its lifecycle with a delivery note.
 *
 * Runs in Vietnamese, the locale a fresh session starts in, like every feature spec after the
 * journey.
 */

/** The cart pane is permanent from 1280 up; below it, the cart is the pushed `/pos/cart`. */
function isNarrow(width: number | undefined): boolean {
  return (width ?? 1280) < 1024;
}

/** Turns the per-order "Bán sỉ" switch on, wherever the cart currently is. */
async function turnOnWholesale(page: Page): Promise<void> {
  const toggle = page.locator(`[aria-label="${C.wholesale}"]`).first();
  await toggle.waitFor();
  await toggle.click();
  // The customer row only offers a wholesale buyer once the switch is on.
  await expect(page.getByText(C.attachCustomer).or(page.getByText(C.changeCustomer)).first()).toBeVisible();
}

/** Attaches a customer through the cart's customer row. */
async function attachCustomer(page: Page, name: string): Promise<void> {
  await page
    .getByText(C.attachCustomer)
    .or(page.getByText(C.changeCustomer))
    .first()
    .click();
  const dialog = overlay(page).last();
  await dialog.getByRole('searchbox').first().fill(name);
  await dialog.getByRole('button', { name, exact: true }).first().click();
  await expect(page.getByText(name).first()).toBeVisible();
}

/**
 * What the order comes to, read off the pay button the cart pane carries. The button is the
 * one place the figure is unambiguous: line totals repeat inside nested boxes, and the
 * checkout label is what the cashier is about to press anyway.
 */
async function cartTotal(page: Page): Promise<number> {
  const button = page.getByRole('button', { name: new RegExp(`^${C.checkout} ·`) }).first();
  await button.waitFor();
  const text = await button.innerText();
  const amounts = text.match(/[\d.]+\s*đ/g) ?? [];
  return amounts.length > 0 ? money(amounts[amounts.length - 1]) : 0;
}

/**
 * The unit control on the cart line, not the one on the tile: both carry the same segments,
 * and the cart pane is the last of them in document order.
 */
function cartUnitSegment(page: Page, label: string) {
  return page.locator('[role="radiogroup"]').last().getByRole('radio', { name: label, exact: true });
}

test.describe('commerce: wholesale sales and pricing', () => {
  test('prices a wholesale order by group, converts units and pays it on account', async ({
    page,
    viewport,
  }) => {
    const narrow = isNarrow(viewport?.width);
    await login(page);

    await showCart(page, narrow);
    await turnOnWholesale(page);
    await attachCustomer(page, MINH_LONG);

    // Back to the catalogue to add lines; on a wide screen the pane never left.
    if (narrow) await go(page, '/pos');

    // A SKU on the buyer's group price list wears the group label.
    await posTile(page, WHOLESALE_PRODUCT_GROUP).click();
    await showCart(page, narrow);
    await expect(page.getByText(new RegExp(C.groupPrice)).first()).toBeVisible();

    // A SKU with a negotiated price wears the contract label instead, and the unit selector
    // turns one can into a case.
    if (narrow) await go(page, '/pos');
    await posTile(page, WHOLESALE_PRODUCT_UNITS).click();
    await showCart(page, narrow);
    await expect(page.getByText(C.contractPrice).first()).toBeVisible();

    // The minimum wholesale quantity is a warning, not a blocker: the line stays in the cart.
    await expect(page.getByText(/^Tối thiểu 24/).first()).toBeVisible();

    const singleTotal = await cartTotal(page);
    expect(singleTotal).toBeGreaterThan(0);

    // The cart line's own unit control: a case is 24, so the conversion is written out in
    // full and the order total multiplies.
    await cartUnitSegment(page, 'thùng 24').click();
    await expect(page.getByText(/1 thùng x 24/).first()).toBeVisible();
    await expect.poll(async () => cartTotal(page)).toBeGreaterThan(singleTotal);

    // Pay on account: no money is tendered, so the button names the debt it creates.
    await page.getByRole('button', { name: new RegExp(C.checkout) }).first().click();
    await page.waitForURL('**/pos/checkout');
    await expect(page.getByText(C.vatInvoice).first()).toBeVisible();
    await pick(page, C.onAccount).click();
    await expect(page.getByText(C.creditLeft)).toBeVisible();

    const payButton = page.getByRole('button', { name: new RegExp(`^${C.onAccount} ·`) }).first();
    await expect(payButton).toBeEnabled();
    await payButton.click();

    // A wholesale order is not finished by being rung up, so the till lands on the order.
    await page.waitForURL('**/orders/**');
    const orderCode = await page.getByText(/^HD-/).first().innerText();
    expect(orderCode).toMatch(/^HD-/);

    // The receivable is on the buyer's debt tab, named by the order it came from.
    await go(page, `/customers/${MINH_LONG_ID}`);
    await pick(page, C.debtTab).click();
    await expect(page.getByText(orderCode).first()).toBeVisible();
  });

  test('adds a price rule and applies it at the till', async ({ page, viewport }) => {
    const narrow = isNarrow(viewport?.width);
    await login(page);

    await go(page, '/pricing');
    await expect(page.getByText(C.tabPriceLists).first()).toBeVisible();
    await page.getByText(C.listAgentA).first().click();
    await page.waitForURL('**/pricing/**');
    // The precedence list is printed beside the rules, where the question gets asked.
    await expect(page.getByText(C.precedence)).toBeVisible();

    await page.getByRole('button', { name: C.addRule }).first().click();
    const dialog = overlay(page).last();
    await dialog.getByRole('searchbox').first().fill(WHOLESALE_PRODUCT_GROUP);
    await dialog.getByRole('button', { name: WHOLESALE_PRODUCT_GROUP, exact: true }).first().click();
    await dialog.getByRole('textbox', { name: C.unitPrice }).fill('4000');
    await dialog.getByRole('button', { name: C.save, exact: true }).first().click();

    // The rule is in the table with the percentage computed for the reader.
    await expect(page.getByText('4.000 đ').first()).toBeVisible();

    // And it is the price the till quotes for a buyer on this list.
    await go(page, '/pos');
    await showCart(page, narrow);
    await turnOnWholesale(page);
    await attachCustomer(page, MINH_LONG);
    if (narrow) await go(page, '/pos');
    await posTile(page, WHOLESALE_PRODUCT_GROUP).click();
    await showCart(page, narrow);
    // The cart line quotes the new rule, per base unit, where the buyer reads it.
    await expect(page.getByText(/4\.000 đ\//).first()).toBeVisible();
  });

  test('walks a wholesale order through the stepper and delivers it', async ({ page }) => {
    await login(page);

    // `order-w1` and `order-w2` are the seeded quotes; the first is the one this spec moves.
    await go(page, '/orders/order-w1');
    await expect(page.getByText(C.deliveryNotes).first()).toBeVisible();

    // Quote to confirmed.
    await page.getByRole('button', { name: new RegExp(`^${C.advanceTo} `) }).first().click();
    await expect(page.getByText(C.statusConfirmed).first()).toBeVisible();

    // A delivery note is what takes the order to "đang giao".
    await page.getByRole('button', { name: C.createDeliveryNote }).first().click();
    const dialog = overlay(page).last();
    await dialog.getByRole('button', { name: C.createDeliveryNote }).first().click();
    await expect(page.getByText(C.statusDelivering).first()).toBeVisible();

    // Delivering the last outstanding unit completes the order on its own.
    await page.getByRole('button', { name: C.markDelivered }).first().click();
    await expect(page.getByText(C.statusCompleted).first()).toBeVisible();
  });
});
