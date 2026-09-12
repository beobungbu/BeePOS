/** Pure catalog domain logic: barcode validation, SKU suggestion, margin math. No side effects. */

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
