import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ListGroup, ListGroupHeader, ListItem, Text } from '@beemvp/beeui-ui';
import type { Order } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { AppIcon } from '../../../components/icons';
import { formatDate, formatTime, isCancelled, paymentSummary } from '../lib/order-presentation';
import { OrderStatusBadge } from './order-status-badge';

/**
 * Phone rows, the three-line format of `docs/design/mockups/orders.html`: code plus status
 * badge, then time, customer and payment method as one caption, with the total and a chevron
 * trailing. Never a horizontally scrolling table under 768 pt.
 */
export function OrderListGroup({
  orders,
  customerLabel,
  showDayHeaders,
}: {
  orders: Order[];
  customerLabel: (order: Order) => string;
  /** Day headers only help when the active range spans more than one day. */
  showDayHeaders: boolean;
}) {
  const router = useRouter();
  const t = useT();

  const rowFor = (order: Order) => {
    const cancelled = isCancelled(order);
    const payment = paymentSummary(order, (method) => t(`orders.paymentMethod.${method}`));
    const meta = `${formatTime(order.createdAt)} · ${customerLabel(order)}`;

    return (
      <ListItem
        accessibilityLabel={`${order.code}. ${meta}. ${t(`orders.status.${order.status}`)}. ${formatVND(order.total)}`}
        description={
          <View className="gap-1">
            <Text className="text-caption text-muted-foreground" numberOfLines={1}>
              {meta}
            </Text>
            <View className="flex-row items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <Text className="min-w-0 shrink text-caption text-muted-foreground" numberOfLines={1}>
                {payment}
              </Text>
            </View>
          </View>
        }
        key={order.id}
        onPress={() => router.push(`/orders/${order.id}`)}
        title={
          <View className="flex-row items-center gap-3">
            <Text className="min-w-0 flex-1 text-label font-semibold text-foreground" numberOfLines={1}>
              {order.code}
            </Text>
            <Text
              className={`text-label font-bold ${cancelled ? 'text-muted-foreground line-through' : 'text-foreground'}`}
              numeric="tabular"
            >
              {formatVND(order.total)}
            </Text>
          </View>
        }
        trailing={<AppIcon name="chevron-right" size={20} tone="subtle-foreground" />}
      />
    );
  };

  if (!showDayHeaders) {
    return <ListGroup>{orders.map(rowFor)}</ListGroup>;
  }

  return (
    <View className="gap-3">
      {groupByDay(orders).map(([day, dayOrders]) => (
        <ListGroup key={day}>
          <ListGroupHeader title={formatDate(`${day}T00:00:00`)} />
          {dayOrders.map(rowFor)}
        </ListGroup>
      ))}
    </View>
  );
}

function groupByDay(orders: Order[]): Array<[string, Order[]]> {
  const groups = new Map<string, Order[]>();
  orders.forEach((order) => {
    const day = order.createdAt.slice(0, 10);
    const bucket = groups.get(day) ?? [];
    bucket.push(order);
    groups.set(day, bucket);
  });
  return Array.from(groups.entries());
}
