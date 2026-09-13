/**
 * Pure catalog domain logic: barcode validation, SKU suggestion, margin math and the
 * per-store price rule. No side effects.
 */
import type { StorePrice } from './types';

/** Validates an EAN-13 barcode's checksum digit. Returns false for anything not 13 digits. */
export function isValidEan13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checkDigit = digits[12];
  const sum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 3), 0);
  const expected = (10 - (sum % 10)) % 10;
  return expected === checkDigit;
}

/**
 * Suggests the next SKU for a category prefix, given the SKUs already in use.
 * Follows the `PREFIX-NNN` convention used by the seed catalog (e.g. `DU-031`).
 */
export function nextSku(existingSkus: readonly string[], prefix: string): string {
  const normalizedPrefix = prefix.trim().toUpperCase();
  const pattern = new RegExp(`^${normalizedPrefix}-(\\d+)$`);
  let maxCounter = 0;
  for (const sku of existingSkus) {
    const match = pattern.exec(sku.trim().toUpperCase());
    if (match) maxCounter = Math.max(maxCounter, Number(match[1]));
  }
  return `${normalizedPrefix}-${String(maxCounter + 1).padStart(3, '0')}`;
}

/**
 * The tile and cart-line caption of `docs/design/design-direction.md` section 5: the variant
 * and the unit as one line (`330ml · chai`). A product with no variant of its own falls back
 * to the unit alone, so the caption is never empty and never leads with a separator.
 */
export function variantAndUnit(variantLabel: string | undefined, unit: string): string {
  const variant = variantLabel?.trim();
  const unitText = unit.trim();
  if (!variant) return unitText;
  if (!unitText) return variant;
  return `${variant} · ${unitText}`;
}

/**
 * Gross margin as a percentage of the sale price, rounded to one decimal.
 * Returns 0 when the sale price is not positive (avoids division by zero/negative).
 */
export function marginPercent(costPrice: number, salePrice: number): number {
  if (!Number.isFinite(costPrice) || !Number.isFinite(salePrice) || salePrice <= 0) return 0;
  return Math.round(((salePrice - costPrice) / salePrice) * 1000) / 10;
}

/* ---------------------------------------------------------------------------------------
 * Per-store prices.
 *
 * A chain sells the same SKU at different prices in different branches (rent, delivery,
 * local competition). The catalogue keeps the chain price on the product, and a `StorePrice`
 * row overrides it for one store. The rule below is the only place that decides which of the
 * two a screen is allowed to show: the sell screen, the cart, the product detail table and
 * the receipt all go through it, so a branch can never be quoted one price and charged
 * another.
 * ------------------------------------------------------------------------------------ */

/** Enough of a product to be priced; keeps the rule usable from a cart line or a table row. */
export interface PricedProduct {
  id: string;
  salePrice: number;
}

/**
 * Overrides, either as the raw rows or as the index below. The sell screen re-prices every
 * visible tile on every render, so scanning the rows per tile would cost `tiles x overrides`
 * per frame; the index is what it passes instead. Both forms answer the same question, which
 * is why they share one function rather than two rules that can drift apart.
 */
export type StorePriceLookup = readonly StorePrice[] | ReadonlyMap<string, number>;

/** Index key. Store first, because a lookup is always "this store, that product". */
export function storePriceKey(storeId: string, productId: string): string {
  return `${storeId}|${productId}`;
}

/** Indexes override rows for repeated lookups. */
export function indexStorePrices(prices: readonly StorePrice[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const price of prices) index.set(storePriceKey(price.storeId, price.productId), price.salePrice);
  return index;
}

/**
 * The price this store actually sells the product at: its own override when there is one,
 * the chain price otherwise.
 *
 * A non-finite or negative override is ignored rather than trusted; a corrupted persisted
 * slice must not be able to sell goods for a negative amount. Zero is honoured, because a
 * giveaway line is a real thing a shop rings up.
 */
export function effectivePrice(
  product: PricedProduct,
  storeId: string | undefined,
  overrides: StorePriceLookup,
): number {
  if (!storeId) return product.salePrice;
  const override = Array.isArray(overrides)
    ? overrides.find((price) => price.storeId === storeId && price.productId === product.id)?.salePrice
    : (overrides as ReadonlyMap<string, number>).get(storePriceKey(storeId, product.id));
  if (override === undefined || !Number.isFinite(override) || override < 0) return product.salePrice;
  return override;
}

/** True when this store quotes its own price for the product rather than the chain's. */
export function hasStoreOverride(
  product: PricedProduct,
  storeId: string,
  overrides: readonly StorePrice[],
): boolean {
  return overrides.some((price) => price.storeId === storeId && price.productId === product.id);
}
