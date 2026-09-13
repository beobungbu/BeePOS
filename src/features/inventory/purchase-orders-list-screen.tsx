import {
  Badge,
  Button,
  EmptyState,
  ListGroup,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useOrgStore } from '../../data/org-store';
import { usePurchasingStore } from '../../data/purchasing-store';
import { useSupplierStore } from '../../data/supplier-store';
import { formatVND } from '../../domain/money';
import type { PurchaseOrderStatus } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { formatDate } from '../../lib/datetime';
import { purchaseOrderTotals } from './lib/purchase-orders';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

const STATUS_VARIANT: Record<PurchaseOrderStatus, 'outline' | 'primary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'outline',
  sent: 'primary',
  partial: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

export function PurchaseOrdersListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const purchaseOrders = usePurchasingStore((state) => state.purchaseOrders);
  const suppliers = useSupplierStore((state) => state.suppliers);
  // The branches of the chain this device is signed into, not the demo seed.
  const allStores = useOrgStore((state) => state.stores);

  const supplierName = (supplierId: string): string =>
    suppliers.find((supplier) => supplier.id === supplierId)?.name ?? supplierId;

  const storeName = (storeId: string): string =>
    allStores.find((store) => store.id === storeId)?.name ?? storeId;

  useScreenHeader({ title: t('inventory.purchaseOrders.title'), backTo: '/inventory' });

  const column = {
    code: t('inventory.purchaseOrders.columns.code'),
    supplier: t('inventory.purchaseOrders.columns.supplier'),
    expected: t('inventory.purchaseOrders.columns.expected'),
    received: t('inventory.purchaseOrders.columns.received'),
    total: t('inventory.purchaseOrders.columns.total'),
    status: t('inventory.purchaseOrders.columns.status'),
  };

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <View className="flex-row items-center justify-between">
          <Text variant="title">{t('inventory.purchaseOrders.title')}</Text>
          <Button onPress={() => router.push('/inventory/purchase-orders/new')}>
            {t('inventory.purchaseOrders.newOrder')}
          </Button>
        </View>

        {purchaseOrders.length === 0 ? (
          <EmptyState
            title={t('inventory.purchaseOrders.empty')}
            description={t('inventory.purchaseOrders.emptyDescription')}
          />
        ) : isWide ? (
          <Table layout="scroll">
            <TableHeader>
              <TableRow>
                <TableHead label={column.code}>{column.code}</TableHead>
                <TableHead label={column.supplier}>{column.supplier}</TableHead>
                <TableHead label={column.expected}>{column.expected}</TableHead>
                <TableHead label={column.received}>{column.received}</TableHead>
                <TableHead label={column.total}>{column.total}</TableHead>
                <TableHead label={column.status}>{column.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((order) => {
                const totals = purchaseOrderTotals(order);
                return (
                  <TableRow key={order.id}>
                    <TableCell label={column.code}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${t('inventory.purchaseOrders.detailTitle')} ${order.code}`}
                        onPress={() => router.push(`/inventory/purchase-orders/${order.id}`)}
                      >
                        <Text variant="label" className="font-semibold">{order.code}</Text>
                        <Text variant="caption" tone="muted">{storeName(order.storeId)}</Text>
                      </Pressable>
                    </TableCell>
                    <TableCell label={column.supplier}>
                      <Text variant="label">{supplierName(order.supplierId)}</Text>
                    </TableCell>
                    <TableCell label={column.expected}>
                      <Text variant="caption" tone="muted" numeric="tabular">
                        {order.expectedAt ? formatDate(order.expectedAt.toISOString()) : ''}
                      </Text>
                    </TableCell>
                    <TableCell label={column.received}>
                      <Text variant="label" numeric="tabular" className="w-full text-right">
                        {`${totals.receivedQty} / ${totals.orderedQty}`}
                      </Text>
                    </TableCell>
                    <TableCell label={column.total}>
                      <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                        {formatVND(totals.orderedValue)}
                      </Text>
                    </TableCell>
                    <TableCell label={column.status}>
                      <Badge variant={STATUS_VARIANT[order.status]}>
                        {t(`inventory.purchaseOrders.status.${order.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <ListGroup>
            {purchaseOrders.map((order) => {
              const totals = purchaseOrderTotals(order);
              return (
                <ListItem
                  key={order.id}
                  title={order.code}
                  description={`${supplierName(order.supplierId)} · ${formatVND(totals.orderedValue)}`}
                  onPress={() => router.push(`/inventory/purchase-orders/${order.id}`)}
                  trailing={
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {t(`inventory.purchaseOrders.status.${order.status}`)}
                    </Badge>
                  }
                />
              );
            })}
          </ListGroup>
        )}
      </View>
    </ScrollView>
  );
}
