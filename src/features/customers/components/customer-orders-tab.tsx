import { useRouter } from 'expo-router';
import { EmptyState, ListGroup, ListItem, Text, VStack } from '@beemvp/beeui-ui';
import type { Order } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { OrderStatusBadge } from '../../orders/components/order-status-badge';

export function CustomerOrdersTab({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const t = useT();

  if (orders.length === 0) {
    return <EmptyState description={t('customers.ordersTab.empty')} title={t('customers.ordersTab.empty')} />;
  }

  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ListGroup>
      {sorted.map((order) => (
        <ListItem
          description={new Date(order.createdAt).toLocaleString('vi-VN')}
          key={order.id}
          onPress={() => router.push(`/orders/${order.id}`)}
          title={order.code}
          trailing={
            <VStack className="items-end gap-1">
              <Text className="font-medium">{formatVND(order.total)}</Text>
              <OrderStatusBadge status={order.status} />
            </VStack>
          }
        />
      ))}
    </ListGroup>
  );
}
