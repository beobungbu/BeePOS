import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Button,
  Card,
  DescriptionItem,
  DescriptionList,
  EmptyState,
  HStack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Timeline,
  TimelineItem,
  VStack,
  useToast,
} from '@beemvp/beeui-ui';
import { useOrderStore } from '../../../data/order-store';
import { useCustomerStore } from '../../../data/customer-store';
import { useCatalogStore } from '../../../data/catalog-store';
import { useInventoryStore } from '../../../data/inventory-store';
import { staff, stores } from '../../../data/seed';
import { formatVND, sum } from '../../../domain/money';
import { applyRefund, canVoid, lineNetAmount, type Refund, type RefundPlanResult } from '../../../domain/orders';
import type { PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';
import { OrderStatusBadge } from '../components/order-status-badge';
import { RefundDialog } from '../components/refund-dialog';
import { VoidAlertDialog } from '../components/void-alert-dialog';

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const toast = useToast();

  const order = useOrderStore((state) => state.orders.find((item) => item.id === id));
  // Select the raw array (stable reference) and derive with useMemo: an inline `.filter()`
  // inside the zustand selector returns a new array every call, which makes
  // useSyncExternalStore see a changed snapshot on every render and loops forever
  // ("Maximum update depth exceeded").
  const allRefunds = useOrderStore((state) => state.refunds);
  const refunds = useMemo(() => allRefunds.filter((item) => item.orderId === id), [allRefunds, id]);
  const note = useOrderStore((state) => (id ? state.notes[id] : undefined));
  const addRefund = useOrderStore((state) => state.addRefund);
  const updateOrder = useOrderStore((state) => state.updateOrder);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const products = useCatalogStore((state) => state.products);
  const customer = useCustomerStore((state) => state.customers.find((item) => item.id === order?.customerId));
  const refundCustomer = useCustomerStore((state) => state.refundCustomer);

  const [refundOpen, setRefundOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const priorRefundedAmount = useMemo(() => sum(refunds.map((refund) => refund.amount)), [refunds]);

  if (!order) {
    return (
      <VStack className="flex-1 items-center justify-center gap-4 p-4">
        <EmptyState description="" title={t('orders.empty.title')} />
        <Button onPress={() => router.push('/orders')} variant="outline">
          {t('orders.detail.back')}
        </Button>
      </VStack>
    );
  }

  const storeName = stores.find((store) => store.id === order.storeId)?.name ?? order.storeId;
  const cashierName = staff.find((member) => member.id === order.cashierId)?.name ?? order.cashierId;
  const productName = (productId: string) => products.find((product) => product.id === productId)?.name ?? productId;

  const canRefund = (order.status === 'paid' || order.status === 'partial_refund') && priorRefundedAmount < order.total;
  const voidAllowed = canVoid(order, refunds.length > 0);

  const handleRefundConfirm = ({ plan, method, reason }: { plan: RefundPlanResult; method: PaymentMethod; reason: string }) => {
    const refund: Refund = {
      id: `refund-${order.id}-${Date.now()}`,
      orderId: order.id,
      createdAt: new Date().toISOString(),
      lines: plan.lines,
      method,
      reason,
      amount: plan.amount,
      pointsDeducted: plan.pointsToDeduct,
    };
    addRefund(refund);
    plan.lines.forEach((line) => adjustStock(line.productId, order.storeId, line.qty));
    updateOrder({ ...order, status: applyRefund(order, priorRefundedAmount, plan.amount) });
    if (order.customerId) {
      refundCustomer({
        customerId: order.customerId,
        points: plan.pointsToDeduct,
        spent: plan.amount,
        note: `Hoàn tiền đơn ${order.code}`,
        createdAt: refund.createdAt,
        orderId: order.id,
      });
    }
    toast.show({
      title: t('orders.refundDialog.successToastTitle'),
      description: t('orders.refundDialog.successToastDescription'),
      variant: 'success',
    });
  };

  const handleVoidConfirm = () => {
    updateOrder({ ...order, status: 'void' });
    setVoidOpen(false);
    toast.show({ title: t('orders.voidDialog.successToastTitle'), variant: 'success' });
  };

  const handleReprint = () => {
    toast.show({ title: t('orders.reprintToast.title'), description: t('orders.reprintToast.description') });
  };

  const timelineEvents = [
    { key: 'created', status: 'default' as const, title: t('orders.detail.eventCreated'), meta: order.createdAt },
    ...(order.status !== 'void'
      ? [{ key: 'paid', status: 'success' as const, title: t('orders.detail.eventPaid'), meta: order.createdAt }]
      : []),
    ...refunds.map((refund) => ({
      key: refund.id,
      status: 'destructive' as const,
      title: t('orders.detail.eventRefund'),
      description: `${formatVND(refund.amount)} - ${refund.reason}`,
      meta: refund.createdAt,
    })),
    ...(order.status === 'void'
      ? [{ key: 'void', status: 'destructive' as const, title: t('orders.detail.eventVoid'), meta: order.createdAt }]
      : []),
  ].sort((a, b) => a.meta.localeCompare(b.meta));

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Button onPress={() => router.push('/orders')} variant="ghost">
        {t('orders.detail.back')}
      </Button>
      <HStack className="flex-wrap items-center justify-between gap-3">
        <HStack className="items-center gap-3">
          <Text variant="heading">{order.code}</Text>
          <OrderStatusBadge status={order.status} />
        </HStack>
        <HStack className="flex-wrap gap-2">
          <Button onPress={handleReprint} variant="outline">
            {t('orders.actions.reprint')}
          </Button>
          <Button disabled={!canRefund} onPress={() => setRefundOpen(true)} variant="secondary">
            {t('orders.actions.refund')}
          </Button>
          <VoidAlertDialog disabled={!voidAllowed} onConfirm={handleVoidConfirm} onOpenChange={setVoidOpen} open={voidOpen} />
        </HStack>
      </HStack>

      <Card className="gap-3">
        <DescriptionList>
          <DescriptionItem label={t('orders.detail.store')} value={storeName} />
          <DescriptionItem label={t('orders.detail.cashier')} value={cashierName} />
          <DescriptionItem label={t('orders.detail.customer')} value={customer?.name ?? t('orders.table.noCustomer')} />
          <DescriptionItem label={t('orders.detail.time')} value={new Date(order.createdAt).toLocaleString('vi-VN')} />
          <DescriptionItem label={t('orders.detail.note')} value={note ?? t('orders.detail.noNote')} />
        </DescriptionList>
      </Card>

      <Card className="gap-3">
        <Text variant="heading">{t('orders.detail.lines')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead label={t('orders.detail.product')}>{t('orders.detail.product')}</TableHead>
              <TableHead label={t('orders.detail.qty')}>{t('orders.detail.qty')}</TableHead>
              <TableHead label={t('orders.detail.unitPrice')}>{t('orders.detail.unitPrice')}</TableHead>
              <TableHead label={t('orders.detail.lineTotal')}>{t('orders.detail.lineTotal')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.lines.map((line) => (
              <TableRow key={line.productId}>
                <TableCell label={t('orders.detail.product')}>
                  <Text>{productName(line.productId)}</Text>
                </TableCell>
                <TableCell label={t('orders.detail.qty')}>
                  <Text>{line.qty}</Text>
                </TableCell>
                <TableCell label={t('orders.detail.unitPrice')}>
                  <Text>{formatVND(line.unitPrice)}</Text>
                </TableCell>
                <TableCell label={t('orders.detail.lineTotal')}>
                  <Text>{formatVND(lineNetAmount(line))}</Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <VStack className="gap-1">
          <HStack className="justify-between">
            <Text tone="muted">{t('orders.detail.subtotal')}</Text>
            <Text>{formatVND(order.subtotal)}</Text>
          </HStack>
          <HStack className="justify-between">
            <Text tone="muted">{t('orders.detail.discount')}</Text>
            <Text>-{formatVND(order.discountTotal)}</Text>
          </HStack>
          <HStack className="justify-between">
            <Text tone="muted">{t('orders.detail.tax')}</Text>
            <Text>{formatVND(order.taxTotal)}</Text>
          </HStack>
          <HStack className="justify-between">
            <Text className="font-medium">{t('orders.detail.total')}</Text>
            <Text className="font-medium">{formatVND(order.total)}</Text>
          </HStack>
        </VStack>
        <VStack className="gap-1">
          <Text variant="heading">{t('orders.detail.payments')}</Text>
          {order.payments.map((payment, index) => (
            <HStack className="justify-between" key={`${payment.method}-${index}`}>
              <Text tone="muted">{t(`orders.paymentMethod.${payment.method}`)}</Text>
              <Text>{formatVND(payment.amount)}</Text>
            </HStack>
          ))}
        </VStack>
      </Card>

      <Card className="gap-3">
        <Text variant="heading">{t('orders.detail.timeline')}</Text>
        <Timeline>
          {timelineEvents.map((event) => (
            <TimelineItem
              description={'description' in event ? event.description : undefined}
              key={event.key}
              meta={new Date(event.meta).toLocaleString('vi-VN')}
              status={event.status}
              title={event.title}
            />
          ))}
        </Timeline>
      </Card>

      <RefundDialog
        onConfirm={handleRefundConfirm}
        onOpenChange={setRefundOpen}
        open={refundOpen}
        order={order}
        priorRefunds={refunds}
        products={products}
      />
    </ScrollView>
  );
}
