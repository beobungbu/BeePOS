import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text } from '@beemvp/beeui-ui';
import type { Order, Staff } from '../../../domain/types';
import type { OrderSortKey, SortDirection } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import { useTableRowClass } from '../../../components/table-row-density';
import type { Breakpoint } from '../../../hooks/use-breakpoint';
import { isCancelled, paymentSummary } from '../lib/order-presentation';
import { formatTime } from '../../../lib/datetime';
import { fill } from '../lib/fill';
import { OrderStatusBadge } from './order-status-badge';

/**
 * The orders table of `docs/design/mockups/orders.html`: six columns at desktop, five at
 * tablet (Thu ngân is the one that goes), the time folded under the order code, money right
 * aligned and tabular, and a cancelled order's total struck through.
 *
 * The press target is the code cell rather than the whole row: BeeUI's `TableRow` takes no
 * press handler ("Table owns no selection state", it only mirrors a `selected` boolean), so a
 * full-row target would mean one Pressable per cell and one accessible name per cell.
 */
export function OrderTable({
  orders,
  cashiers,
  customerLabel,
  sortKey,
  sortDirection,
  onSortChange,
  breakpoint,
  selectedOrderId,
  onSelectOrder,
}: {
  orders: Order[];
  cashiers: Staff[];
  customerLabel: (order: Order) => string;
  sortKey: OrderSortKey;
  sortDirection: SortDirection;
  onSortChange: (key: OrderSortKey) => void;
  breakpoint: Breakpoint;
  /** Desktop only: the row mirrored in the preview pane. */
  selectedOrderId?: string;
  /** Desktop only. When absent, pressing a row opens the detail route instead. */
  onSelectOrder?: (order: Order) => void;
}) {
  const t = useT();
  const router = useRouter();
  const rowClass = useTableRowClass();
  const showCashier = breakpoint === 'desktop';
  const cashierName = (id: string) => cashiers.find((member) => member.id === id)?.name ?? id;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            label={t('orders.table.code')}
            onSortChange={() => onSortChange('time')}
            sortDirection={sortKey === 'time' ? sortDirection : 'none'}
          >
            {t('orders.table.code')}
          </TableHead>
          <TableHead label={t('orders.table.customer')}>{t('orders.table.customer')}</TableHead>
          {showCashier ? <TableHead label={t('orders.table.cashier')}>{t('orders.table.cashier')}</TableHead> : null}
          <TableHead label={t('orders.table.payment')}>{t('orders.table.payment')}</TableHead>
          <TableHead label={t('orders.table.status')}>{t('orders.table.status')}</TableHead>
          <TableHead
            className="items-end text-right"
            label={t('orders.table.total')}
            onSortChange={() => onSortChange('total')}
            sortDirection={sortKey === 'total' ? sortDirection : 'none'}
          >
            {t('orders.table.total')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const cancelled = isCancelled(order);
          const customer = customerLabel(order);

          return (
            <TableRow
              className={order.id === selectedOrderId ? `${rowClass} bg-primary/10` : rowClass}
              key={order.id}
              selected={order.id === selectedOrderId}
            >
              <TableCell label={t('orders.table.code')}>
                <Pressable
                  accessibilityLabel={fill(t('orders.table.selectRow'), { code: order.code })}
                  accessibilityRole="button"
                  className="min-h-11 justify-center"
                  onPress={() => (onSelectOrder ? onSelectOrder(order) : router.push(`/orders/${order.id}`))}
                >
                  <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                    {order.code}
                  </Text>
                  <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                    {formatTime(order.createdAt)}
                  </Text>
                </Pressable>
              </TableCell>
              <TableCell label={t('orders.table.customer')}>
                <Text
                  variant="label"
                  className={`font-normal ${order.customerId ? 'text-foreground' : 'text-muted-foreground'}`}
                  numberOfLines={1}
                >
                  {customer}
                </Text>
              </TableCell>
              {showCashier ? (
                <TableCell label={t('orders.table.cashier')}>
                  <Text variant="label" className="font-normal text-foreground" numberOfLines={1}>
                    {cashierName(order.cashierId)}
                  </Text>
                </TableCell>
              ) : null}
              <TableCell label={t('orders.table.payment')}>
                <Text variant="label" className="font-normal text-foreground" numberOfLines={1}>
                  {paymentSummary(order, (method) => t(`orders.paymentMethod.${method}`))}
                </Text>
              </TableCell>
              <TableCell label={t('orders.table.status')}>
                <View className="flex-row">
                  <OrderStatusBadge status={order.status} />
                </View>
              </TableCell>
              <TableCell className="items-end text-right" label={t('orders.table.total')}>
                <Text
                  variant="label"
                  className={`text-right font-bold ${cancelled ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                  numeric="tabular"
                >
                  {formatVND(order.total)}
                </Text>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
