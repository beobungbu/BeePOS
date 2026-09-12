/**
 * The cashier-facing name of an open order ("Đơn 3"). Cart identity is `Cart.ordinal`, a
 * number, so the visible name is composed from the dictionary and stays translatable.
 * `useT()` has no interpolation, hence the small join helpers instead of template keys.
 */

type Translate = (key: string) => string;

export function orderLabel(t: Translate, ordinal: number): string {
  return `${t('pos.order.label')} ${ordinal}`;
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
