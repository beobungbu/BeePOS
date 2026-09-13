import { Badge } from '@beemvp/beeui-ui';
import type { OrderStatus } from '../../../domain/types';
import { useT } from '../../../i18n';
// Side-effect registration so `orders.status.*` resolves even when this badge is rendered
// from outside the orders feature (e.g. the customers detail screen's order history tab),
// without relying on the caller to have already loaded the orders screens.
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';

/**
 * Status is always a badge carrying a word, never a bare colour dot
 * (`docs/design/design-direction.md` section 8). Voided, cancelled and refunded share the
 * destructive tint because all three mean no money was kept; the word tells them apart.
 * The wholesale lifecycle is warning while the order is still owed goods or money, and
 * success once the goods are with the customer.
 */
const VARIANT_BY_STATUS: Record<OrderStatus, 'success' | 'warning' | 'destructive'> = {
  quote: 'warning',
  confirmed: 'warning',
  delivering: 'warning',
  completed: 'success',
  paid: 'success',
  partial_refund: 'warning',
  refunded: 'destructive',
  void: 'destructive',
  cancelled: 'destructive',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useT();
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(`orders.status.${status}`)}</Badge>;
}
