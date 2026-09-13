/**
 * Selling units and barcode lookup. Pure: no store, no React.
 *
 * A product has one base unit (`Product.unit`, the thing stock is counted in) and any number
 * of larger ones (`Product.units`, "thùng 24", "lốc 6"). Everything downstream - stock, cost,
 * price rules, min order quantity - is expressed in base units, so the one job of this module
 * is to convert in and out of them without the callers having to remember which side they are
 * on.
 */

import type { Product, UnitConversion } from './types';

/** The conversion that stands for the base unit itself. */
export function baseUnitOf(product: Pick<Product, 'unit'>): UnitConversion {
  return { unit: product.unit, factor: 1 };
}

/**
 * Every unit the product may be sold in, base first, then the declared ones in the order the
 * catalogue lists them. A duplicate of the base unit is dropped rather than offered twice.
 */
export function unitOptions(product: Pick<Product, 'unit' | 'units'>): UnitConversion[] {
  const options = [baseUnitOf(product)];
  for (const conversion of product.units ?? []) {
    if (conversion.unit === product.unit) continue;
    if (options.some((option) => option.unit === conversion.unit)) continue;
    options.push(conversion);
  }
  return options;
}

/**
 * Base units per one `unit`. An unknown unit, or a factor that is not a positive finite
 * number, falls back to 1: a mis-typed unit must not silently multiply a stock movement.
 */
export function unitFactor(product: Pick<Product, 'unit' | 'units'>, unit?: string): number {
  if (!unit || unit === product.unit) return 1;
  const found = (product.units ?? []).find((conversion) => conversion.unit === unit);
  if (!found) return 1;
  return Number.isFinite(found.factor) && found.factor > 0 ? found.factor : 1;
}

/** Converts a quantity expressed in `unit` into base units. */
export function toBaseQty(
  product: Pick<Product, 'unit' | 'units'>,
  qty: number,
  unit?: string,
): number {
  if (!Number.isFinite(qty)) return 0;
  return qty * unitFactor(product, unit);
}

/** Converts a base-unit quantity into `unit`. The result may be fractional. */
export function fromBaseQty(
  product: Pick<Product, 'unit' | 'units'>,
  baseQty: number,
  unit?: string,
): number {
  if (!Number.isFinite(baseQty)) return 0;
  return baseQty / unitFactor(product, unit);
}

/** The price of one `unit` given a price per base unit. */
export function unitPriceFor(
  product: Pick<Product, 'unit' | 'units'>,
  basePrice: number,
  unit?: string,
): number {
  return basePrice * unitFactor(product, unit);
}

/**
 * Whether an order line clears the product's minimum order quantity. `baseQty` is in base
 * units, and a product without a minimum always passes.
 */
export function meetsMinOrderQty(
  product: Pick<Product, 'minOrderQty'>,
  baseQty: number,
): boolean {
  const minimum = product.minOrderQty;
  if (!minimum || minimum <= 0) return true;
  return baseQty >= minimum;
}

/** A scanned code resolved to the product and the unit whose packaging carries it. */
export interface BarcodeMatch {
  product: Product;
  /** The unit the code belongs to; the base unit for the product's own barcode. */
  unit: string;
  /** Base units in one scan of this code. */
  factor: number;
}

function normaliseCode(code: string): string {
  return code.trim();
}

/**
 * Finds the product a scanned code belongs to, searching the primary barcode, the extra
 * `barcodes` and the per-unit codes on `units`. A code on a case returns that case's unit and
 * factor, so one scan of a carton adds the whole carton.
 *
 * Returns the first match in catalogue order; an empty or blank code matches nothing.
 */
export function findByBarcode(
  products: readonly Product[],
  code: string,
): BarcodeMatch | undefined {
  const wanted = normaliseCode(code);
  if (!wanted) return undefined;

  for (const product of products) {
    if (product.barcode === wanted) {
      return { product, unit: product.unit, factor: 1 };
    }
    if ((product.barcodes ?? []).includes(wanted)) {
      return { product, unit: product.unit, factor: 1 };
    }
    const unitMatch = (product.units ?? []).find((conversion) => conversion.barcode === wanted);
    if (unitMatch) {
      return {
        product,
        unit: unitMatch.unit,
        factor: unitFactor(product, unitMatch.unit),
      };
    }
  }
  return undefined;
}

/** Every code that scans to a product, primary first. Used by the catalogue screens. */
export function barcodesOf(product: Product): string[] {
  const codes = [product.barcode, ...(product.barcodes ?? [])];
  for (const conversion of product.units ?? []) {
    if (conversion.barcode) codes.push(conversion.barcode);
  }
  return codes.filter((code, index) => Boolean(code) && codes.indexOf(code) === index);
}
