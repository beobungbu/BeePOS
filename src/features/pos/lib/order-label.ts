/**
 * The cashier-facing name of an open order ("Đơn 3"). Cart identity is `Cart.ordinal`, a
 * number, so the visible name is composed from the dictionary and stays translatable.
 * `useT()` has no interpolation, hence the small join helpers instead of template keys.
 */

import type { Cart } from '../../../domain/types';

type Translate = (key: string) => string;

export function orderLabel(t: Translate, ordinal: number): string {
  return `${t('pos.order.label')} ${ordinal}`;
}

/**
 * What the cashier calls this order: the name typed on the tab ("Chị Lan", "Bàn 3") when
 * there is one, otherwise "Đơn N". Every screen that names an order goes through here so a
 * renamed tab reads the same in the cart pane, the cart bar, checkout and the receipt.
 */
export function cartLabel(t: Translate, cart: Pick<Cart, 'ordinal' | 'label'>): string {
  return cart.label ?? orderLabel(t, cart.ordinal);
}

/** "Còn 2 đơn đang mở" / "2 orders still open"; the vi prefix is empty in `en`. */
export function openOrdersLabel(t: Translate, count: number): string {
  return [t('pos.order.openCountPrefix'), String(count), t('pos.order.openCountSuffix')]
    .filter((part) => part.length > 0)
    .join(' ');
}

/** "4 mặt hàng", "12 sản phẩm": a count followed by its dictionary noun. */
export function countLabel(t: Translate, count: number, nounKey: string): string {
  return `${count} ${t(nounKey)}`;
}
