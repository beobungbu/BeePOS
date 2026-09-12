/**
 * The words the product tile's stock pill shows. Kept out of the pill component so the tile's
 * accessibility label can announce the same stock state without duplicating the thresholds.
 */
export function stockLabel(t: (key: string) => string, onHand: number, minLevel: number): string {
  if (onHand <= 0) return t('pos.stockOut');
  if (onHand <= minLevel) return `${t('pos.stockLow')} ${onHand}`;
  return `${t('pos.stockOnHand')} ${onHand}`;
}
