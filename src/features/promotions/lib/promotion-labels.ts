/**
 * How a promotion reads in a row: its type, its scope, its branches and its window.
 *
 * Kept out of the components because the same four sentences appear in the table, in the phone
 * list and in the form header, and three copies of "Giảm 10 %" is three places to get it wrong.
 */

import { formatVND } from '../../../domain/money';
import type { Promotion, Store } from '../../../domain/types';
import { promotionScope, promotionStores } from './promotion-status';

type Translate = (key: string) => string;

/** `Giảm 10 %`, `Giảm 5.000 đ`, `Mua 2 tặng 1`. */
export function promotionTypeLabel(promotion: Promotion, translate: Translate): string {
  if (promotion.type === 'percent') {
    return translate('promotions.summary.percent').replace('{value}', formatPercent(promotion.value));
  }
  if (promotion.type === 'amount') {
    return translate('promotions.summary.amount').replace('{value}', formatVND(promotion.value));
  }
  return translate('promotions.summary.buyXGetY')
    .replace('{buy}', String(promotion.buyQty ?? 0))
    .replace('{get}', String(promotion.getQty ?? 0));
}

/** Whole numbers keep no decimal: `10 %`, not `10,0 %`. */
export function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}

/** `Toàn bộ`, `3 sản phẩm`, `2 danh mục`. */
export function promotionScopeLabel(promotion: Promotion, translate: Translate): string {
  const scope = promotionScope(promotion);
  if (scope === 'products') {
    return translate('promotions.scope.productCount').replace(
      '{count}',
      String(promotion.productIds?.length ?? 0),
    );
  }
  if (scope === 'categories') {
    return translate('promotions.scope.categoryCount').replace(
      '{count}',
      String(promotion.categoryIds?.length ?? 0),
    );
  }
  return translate('promotions.scope.all');
}

/** Branch codes, or the word for every branch. */
export function promotionStoresLabel(
  promotion: Promotion,
  stores: readonly Store[],
  translate: Translate,
): string {
  const ids = promotionStores(promotion);
  if (!ids) return translate('promotions.storeFilter.all');
  const codes = ids.map((id) => stores.find((store) => store.id === id)?.code ?? id);
  return codes.join(', ');
}

/** `01/09 - 30/09`: the year is dropped, because a window that spans one is rare. */
export function promotionWindowLabel(promotion: Promotion): string {
  return `${shortDay(promotion.startsAt)} - ${shortDay(promotion.endsAt)}`;
}

function shortDay(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}
