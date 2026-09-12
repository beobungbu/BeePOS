/**
 * The stock badge of `docs/design/design-direction.md` section 5: a word plus the number,
 * never a bare circled count. Neutral while stock is healthy, `warning` at or under the
 * minimum level, `destructive` at zero.
 */

import { Badge } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';

interface StockBadgeProps {
  quantity: number;
  /** Reorder threshold; omit when the caller has no minimum for this scope. */
  minLevel?: number;
}

export function StockBadge({ quantity, minLevel }: StockBadgeProps) {
  const t = useT();

  if (quantity <= 0) {
    return <Badge variant="destructive">{t('products.stock.out')}</Badge>;
  }
  if (minLevel !== undefined && minLevel > 0 && quantity <= minLevel) {
    return <Badge variant="warning">{`${t('products.stock.low')} · ${quantity}`}</Badge>;
  }
  // `outline` is the neutral pair: `secondary` is the near-black fill, far too loud for a
  // count that is only noise until it drops (direction doc section 5 wants a muted badge).
  return <Badge variant="outline">{`${t('products.stock.on')} ${quantity}`}</Badge>;
}
