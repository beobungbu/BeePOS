/**
 * Totals for an open order. The catalog owns tax rates, so every screen that prices a cart
 * (tab strip, cart bar, cart pane, checkout) needs the same join; it lives here once.
 */

import { calcCart, type CartTotals, type PricedCartLine } from '../../../domain/pos';
import type { Cart, Product } from '../../../domain/types';

/**
 * Indexed rather than scanned per line: the tab strip prices every open order on every render
 * and the catalogue can hold a thousand products, so a `find` per line turned one keystroke
 * into `tabs x lines x products` comparisons.
 */
export function pricedLinesOf(cart: Cart, products: Product[]): PricedCartLine[] {
  if (cart.lines.length === 0) return [];
  const taxRateById = new Map(products.map((product) => [product.id, product.taxRate]));
  return cart.lines.map((line) => ({
    ...line,
    taxRate: taxRateById.get(line.productId) ?? 0,
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
