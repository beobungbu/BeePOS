import { Timeline, TimelineItem } from '@beemvp/beeui-ui';
import type { Order } from '../../../domain/types';
import type { Refund } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { formatDateTime } from '../../../lib/datetime';

/**
 * Order history, oldest first: creation, the payments that settled it, every refund, and the
 * void if it was cancelled. Shared by the detail screen and the desktop preview pane.
 */
export function OrderTimeline({
  order,
  refunds,
  cashierName,
}: {
  order: Order;
  refunds: Refund[];
  cashierName: string;
}) {
  const t = useT();

  const events = [
    {
      key: 'created',
      status: 'default' as const,
      title: t('orders.detail.eventCreated'),
      description: cashierName,
      at: order.createdAt,
    },
    ...(order.status !== 'void'
      ? order.payments.map((payment, index) => ({
          key: `payment-${index}`,
          status: 'success' as const,
          title: `${t('orders.detail.eventPaid')} ${t(`orders.paymentMethod.${payment.method}`).toLocaleLowerCase('vi')}`,
          description: formatVND(payment.amount),
          at: order.createdAt,
        }))
      : []),
    ...refunds.map((refund) => ({
      key: refund.id,
      status: 'destructive' as const,
      title: t('orders.detail.eventRefund'),
      description: refund.reason ? `${formatVND(refund.amount)} · ${refund.reason}` : formatVND(refund.amount),
      at: refund.createdAt,
    })),
    ...(order.status === 'void'
      ? [{ key: 'void', status: 'destructive' as const, title: t('orders.detail.eventVoid'), description: undefined, at: order.createdAt }]
      : []),
  ].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <Timeline>
      {events.map((event) => (
        <TimelineItem
          description={event.description}
          key={event.key}
          meta={formatDateTime(event.at)}
          status={event.status}
          title={event.title}
        />
      ))}
    </Timeline>
  );
}
