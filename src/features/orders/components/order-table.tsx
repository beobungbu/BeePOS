import { Link } from 'expo-router';
import {
  Pagination,
  PaginationItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import type { Order, Staff, Store } from '../../../domain/types';
import type { OrderSortKey, SortDirection } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { OrderStatusBadge } from './order-status-badge';

function lineQtyTotal(order: Order): number {
  return order.lines.reduce((total, line) => total + line.qty, 0);
}

function paymentSummary(order: Order): string {
  return order.payments.map((payment) => payment.method).join(' + ');
}

export function OrderTable({
  orders,
  stores,
  cashiers,
  customerLabel,
  sortKey,
  sortDirection,
  onSortChange,
  page,
  pageCount,
  onPageChange,
}: {
  orders: Order[];
  stores: Store[];
  cashiers: Staff[];
  customerLabel: (order: Order) => string;
  sortKey: OrderSortKey;
  sortDirection: SortDirection;
  onSortChange: (key: OrderSortKey) => void;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const t = useT();
  const storeName = (id: string) => stores.find((store) => store.id === id)?.name ?? id;
  const cashierName = (id: string) => cashiers.find((member) => member.id === id)?.name ?? id;

  return (
    <VStack className="gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead label={t('orders.table.code')}>{t('orders.table.code')}</TableHead>
            <TableHead
              label={t('orders.table.time')}
              onSortChange={() => onSortChange('time')}
              sortDirection={sortKey === 'time' ? sortDirection : 'none'}
            >
              {t('orders.table.time')}
            </TableHead>
            <TableHead label={t('orders.table.store')}>{t('orders.table.store')}</TableHead>
            <TableHead label={t('orders.table.cashier')}>{t('orders.table.cashier')}</TableHead>
            <TableHead label={t('orders.table.customer')}>{t('orders.table.customer')}</TableHead>
            <TableHead label={t('orders.table.items')}>{t('orders.table.items')}</TableHead>
            <TableHead
              label={t('orders.table.total')}
              onSortChange={() => onSortChange('total')}
              sortDirection={sortKey === 'total' ? sortDirection : 'none'}
            >
              {t('orders.table.total')}
            </TableHead>
            <TableHead label={t('orders.table.payment')}>{t('orders.table.payment')}</TableHead>
            <TableHead label={t('orders.table.status')}>{t('orders.table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell label={t('orders.table.code')}>
                <Link href={`/orders/${order.id}`}>
                  <Text className="font-medium text-primary">{order.code}</Text>
                </Link>
              </TableCell>
              <TableCell label={t('orders.table.time')}>
                <Text>{new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
              </TableCell>
              <TableCell label={t('orders.table.store')}>
                <Text>{storeName(order.storeId)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.cashier')}>
                <Text>{cashierName(order.cashierId)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.customer')}>
                <Text>{customerLabel(order)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.items')}>
                <Text>{lineQtyTotal(order)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.total')}>
                <Text className="font-medium">{formatVND(order.total)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.payment')}>
                <Text tone="muted">{paymentSummary(order)}</Text>
              </TableCell>
              <TableCell label={t('orders.table.status')}>
                <OrderStatusBadge status={order.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
