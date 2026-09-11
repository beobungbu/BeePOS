import { useRouter } from 'expo-router';
import { ListGroup, ListGroupHeader, ListItem, Pagination, PaginationItem, Text, VStack } from '@beemvp/beeui-ui';
import type { Order, Staff, Store } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { OrderStatusBadge } from './order-status-badge';

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

export function OrderListGroup({
  orders,
  stores,
  cashiers,
  customerLabel,
  page,
  pageCount,
  onPageChange,
}: {
  orders: Order[];
  stores: Store[];
  cashiers: Staff[];
  customerLabel: (order: Order) => string;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const router = useRouter();
  const storeName = (id: string) => stores.find((store) => store.id === id)?.name ?? id;
  const cashierName = (id: string) => cashiers.find((member) => member.id === id)?.name ?? id;

  return (
    <VStack className="gap-3">
      {groupByDay(orders).map(([day, dayOrders]) => (
        <ListGroup key={day}>
          <ListGroupHeader title={new Date(`${day}T00:00:00`).toLocaleDateString('vi-VN')} />
          {dayOrders.map((order) => (
            <ListItem
              description={`${storeName(order.storeId)} · ${cashierName(order.cashierId)} · ${customerLabel(order)}`}
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
      ))}
      {pageCount > 1 && (
        <Pagination onPageChange={onPageChange} page={page} pageCount={pageCount}>
          <PaginationItem type="previous" />
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <PaginationItem key={pageNumber} page={pageNumber} />
          ))}
          <PaginationItem type="next" />
        </Pagination>
      )}
    </VStack>
  );
}
