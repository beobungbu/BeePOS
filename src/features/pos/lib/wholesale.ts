/**
 * What a wholesale line says about itself: where its price came from, how the unit converts,
 * and whether it clears the product's minimum order quantity.
 *
 * Pure and locale-free in the same way the domain is: every visible word arrives through the
 * `t` the caller already holds, so these helpers can be asserted without a renderer.
 */

import { formatVND } from '../../../domain/money';
import { meetsMinOrderQty, unitFactor } from '../../../domain/units';
import type { CartLine, CustomerGroup, PriceSource, Product } from '../../../domain/types';

type Translate = (key: string) => string;

/** Badge colour per source, matching the `Áp dụng cho` column of the price list screen. */
export type PriceSourceVariant = 'warning' | 'success' | 'info' | 'primary' | 'outline';

const VARIANT_BY_SOURCE: Record<PriceSource, PriceSourceVariant | undefined> = {
  customer: 'warning',
  tier: 'success',
  group: 'info',
  group_discount: 'info',
  promotion: 'primary',
  manual: 'outline',
  // The shelf price is the default, so it carries no badge: a label on every line would stop
  // the eye finding the lines that are priced differently, which is the whole point of it.
  store: undefined,
  list: undefined,
};

export interface PriceSourceBadge {
  label: string;
  variant: PriceSourceVariant;
}

/**
 * The badge a line wears, or `undefined` when the line is at the shelf price.
 *
 * `group` reads "Giá sỉ nhóm Đại lý A" (a flat row on the group's list) and `group_discount`
 * reads "Sỉ nhóm Đại lý A -5%" (the group's blanket percentage), because only the second is
 * derived from the shelf price and the seller is asked about that difference constantly.
 */
export function priceSourceBadge(
  t: Translate,
  source: PriceSource | undefined,
  context: { group?: CustomerGroup; minQty?: number; promotionName?: string } = {},
): PriceSourceBadge | undefined {
  if (!source) return undefined;
  const variant = VARIANT_BY_SOURCE[source];
  if (!variant) return undefined;

  const word = t(`pos.wholesale.source.${source}`);
  if (source === 'tier') {
    const qty = context.minQty && context.minQty > 1 ? ` ${context.minQty}+` : '';
    return { label: `${word}${qty}`, variant };
  }
  if (source === 'group') {
    return { label: context.group ? `${word} ${context.group.name}` : word, variant };
  }
  if (source === 'group_discount') {
    if (!context.group) return { label: word, variant };
    return { label: `${word} ${context.group.name} -${context.group.discountPercent}%`, variant };
  }
  if (source === 'promotion') {
    return { label: context.promotionName ?? word, variant };
  }
  return { label: word, variant };
}

/** Base units the line amounts to: 10 cases of 24 is 240. */
export function baseQtyOf(line: Pick<CartLine, 'qty' | 'unitFactor'>): number {
  const factor = line.unitFactor && line.unitFactor > 0 ? line.unitFactor : 1;
  return line.qty * factor;
}

/**
 * The conversion written out in full, as the mockup insists: `10 thùng x 24 lon = 240 lon`.
 * A line in the base unit has nothing to convert, so it reads `3 túi`.
 */
export function unitConversionText(product: Product | undefined, line: CartLine): string {
  const baseUnit = product?.unit ?? '';
  const unit = line.unit ?? baseUnit;
  const factor = line.unitFactor && line.unitFactor > 1 ? line.unitFactor : 1;
  if (factor <= 1) return `${line.qty} ${unit}`.trim();
  return `${line.qty} ${unit} x ${factor} ${baseUnit} = ${line.qty * factor} ${baseUnit}`;
}

/** `7.500 đ/lon`: the price a buyer reconciles against, always per base unit. */
export function basePriceText(product: Product | undefined, line: CartLine): string {
  const factor = line.unitFactor && line.unitFactor > 0 ? line.unitFactor : 1;
  const perBase = factor > 1 ? Math.round(line.unitPrice / factor) : line.unitPrice;
  return `${formatVND(perBase)}/${product?.unit ?? ''}`.trim();
}

/**
 * The non-blocking minimum-order warning, or `undefined` when the line clears it. Retail
 * ignores minimums entirely, so the caller only asks for wholesale orders.
 */
export function minOrderWarning(
  t: Translate,
  product: Product | undefined,
  line: Pick<CartLine, 'qty' | 'unitFactor'>,
): string | undefined {
  if (!product?.minOrderQty || product.minOrderQty <= 0) return undefined;
  if (meetsMinOrderQty(product, baseQtyOf(line))) return undefined;
  return [
    t('pos.wholesale.minOrderPrefix'),
    String(product.minOrderQty),
    product.unit,
    t('pos.wholesale.minOrderSuffix'),
  ].join(' ');
}

/** The same warning for a tile, which has no line yet and is always asked about one unit. */
export function tileMinOrderText(t: Translate, product: Product, unit: string | undefined): string | undefined {
  if (!product.minOrderQty || product.minOrderQty <= 0) return undefined;
  if (meetsMinOrderQty(product, unitFactor(product, unit))) return undefined;
  return `${t('pos.wholesale.minOrderPrefix')} ${product.minOrderQty} ${product.unit}`;
}

/** `thùng 24`, and the base unit by its own name. What the unit selector prints on a segment. */
export function unitSegmentLabel(unit: string, factor: number): string {
  return factor > 1 ? `${unit} ${factor}` : unit;
}
