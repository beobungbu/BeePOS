/**
 * Totals for an open order. The catalog owns tax rates, so every screen that prices a cart
 * (tab strip, cart bar, cart pane, checkout) needs the same join; it lives here once.
 */

import { calcCart, type CartTotals, type PricedCartLine } from '../../../domain/pos';
import type { Cart, Product } from '../../../domain/types';

export function pricedLinesOf(cart: Cart, products: Product[]): PricedCartLine[] {
  return cart.lines.map((line) => ({
    ...line,
    taxRate: products.find((product) => product.id === line.productId)?.taxRate ?? 0,
  }));
}

export function cartTotalsOf(cart: Cart, products: Product[]): CartTotals {
  return calcCart(pricedLinesOf(cart, products), cart.discount);
}

/** Units in the order ("12 sản phẩm"). */
export function cartUnitCount(cart: Cart): number {
  return cart.lines.reduce((count, line) => count + line.qty, 0);
}

/** Distinct lines in the order ("4 mặt hàng"). */
export function cartLineCount(cart: Cart): number {
  return cart.lines.length;
}
