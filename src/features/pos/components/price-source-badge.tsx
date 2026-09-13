import { Badge } from '@beemvp/beeui-ui';
import type { PriceSourceBadge as PriceSourceBadgeValue } from '../lib/wholesale';

/**
 * The small label naming where a line's price came from, coloured by source per
 * `docs/design/specs/commerce.md` section A. The same colours are used in the price list
 * screen's `Áp dụng cho` column, so the two screens connect.
 *
 * Renders nothing for a line at the shelf price: "no label means the product's base price".
 */
export function PriceSourceBadge({ badge }: { badge: PriceSourceBadgeValue | undefined }) {
  if (!badge) return null;
  return <Badge variant={badge.variant}>{badge.label}</Badge>;
}
