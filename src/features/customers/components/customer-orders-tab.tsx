import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { EmptyState, ListGroup, ListItem, Text } from '@beemvp/beeui-ui';
import type { Order } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { AppIcon } from '../../../components/icons';
import { formatDateTime, isCancelled, paymentSummary } from '../../orders/lib/order-presentation';
import { OrderStatusBadge } from '../../orders/components/order-status-badge';

/** This customer's order history, in the same row shape as the orders list on phone. */
export function CustomerOrdersTab({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const t = useT();

  if (orders.length === 0) {
    return <EmptyState description={t('customers.ordersTab.empty')} title={t('customers.empty.title')} />;
  }

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ListGroup>
      {sorted.map((order) => {
        const meta = `${formatDateTime(order.createdAt)} · ${paymentSummary(order, (method) => t(`orders.paymentMethod.${method}`))}`;

        return (
          <ListItem
            accessibilityLabel={`${order.code}. ${meta}. ${formatVND(order.total)}`}
            description={<Text variant="caption" className="text-muted-foreground">{meta}</Text>}
            key={order.id}
            onPress={() => router.push(`/orders/${order.id}`)}
            title={
              <View className="flex-row items-center gap-2">
                <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                  {order.code}
                </Text>
                <OrderStatusBadge status={order.status} />
              </View>
            }
            trailing={
              <View className="flex-row items-center gap-2">
                <Text
                  variant="label"
                  className={`font-bold ${isCancelled(order) ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                  numeric="tabular"
                >
                  {formatVND(order.total)}
                </Text>
                <AppIcon name="chevron-right" size={20} tone="subtle-foreground" />
              </View>
            }
          />
        );
      })}
    </ListGroup>
  );
}
