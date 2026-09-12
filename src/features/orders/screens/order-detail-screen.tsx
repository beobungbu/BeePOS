import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, EmptyState, Text } from '@beemvp/beeui-ui';
import { useOrderStore } from '../../../data/order-store';
import { useCustomerStore } from '../../../data/customer-store';
import { useCatalogStore } from '../../../data/catalog-store';
import { staff, stores } from '../../../data/seed';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';
// The summary card shows the customer's phone, a label owned by the customers dictionary.
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { AppIcon } from '../../../components/icons';
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderLinesList } from '../components/order-lines-list';
import { OrderTimeline } from '../components/order-timeline';
import { OrderTotals } from '../components/order-totals';
import { RefundDialog } from '../components/refund-dialog';
import { VoidAlertDialog } from '../components/void-alert-dialog';
import { useOrderActions } from '../hooks/use-order-actions';
import { formatDateTime, itemCount } from '../lib/order-presentation';
import { fill } from '../lib/fill';

export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';

  const order = useOrderStore((state) => state.orders.find((item) => item.id === id));
  const note = useOrderStore((state) => (id ? state.notes[id] : undefined));
  const products = useCatalogStore((state) => state.products);
  const customer = useCustomerStore((state) => state.customers.find((item) => item.id === order?.customerId));
  const actions = useOrderActions(order);

  const [refundOpen, setRefundOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-4">
        <EmptyState description={t('orders.empty.description')} title={t('orders.empty.title')} />
        <Button onPress={() => router.push('/orders')} variant="outline">
          {t('orders.detail.back')}
        </Button>
      </View>
    );
  }

  const storeName = stores.find((store) => store.id === order.storeId)?.name ?? order.storeId;
  const cashierName = staff.find((member) => member.id === order.cashierId)?.name ?? order.cashierId;
  const gutter = isPhone ? 'px-4' : breakpoint === 'tablet' ? 'px-5' : 'px-6';

  const summaryCard = (
    <Card className="gap-3">
      <Text className="text-label font-semibold text-foreground">{t('orders.detail.summary')}</Text>
      <InfoRow label={t('orders.detail.customer')} value={customer?.name ?? t('orders.table.noCustomer')} />
      {customer ? <InfoRow label={t('customers.table.phone')} value={customer.phone} /> : null}
      <InfoRow label={t('orders.detail.store')} value={storeName} />
      <InfoRow label={t('orders.detail.cashier')} value={cashierName} />
      <InfoRow label={t('orders.detail.time')} value={formatDateTime(order.createdAt)} />
      <InfoRow label={t('orders.detail.note')} value={note ?? t('orders.detail.noNote')} />
    </Card>
  );

  const paymentsCard = (
    <Card className="gap-3">
      <Text className="text-label font-semibold text-foreground">{t('orders.detail.payments')}</Text>
      {order.payments.map((payment, index) => (
        <View className="flex-row items-center justify-between gap-3" key={`${payment.method}-${index}`}>
          <Text className="text-label text-muted-foreground">{t(`orders.paymentMethod.${payment.method}`)}</Text>
          <Text className="text-label font-semibold text-foreground" numeric="tabular">
            {formatVND(payment.amount)}
          </Text>
        </View>
      ))}
    </Card>
  );

  const timelineCard = (
    <Card className="gap-3">
      <Text className="text-label font-semibold text-foreground">{t('orders.detail.timeline')}</Text>
      <OrderTimeline cashierName={cashierName} order={order} refunds={actions.refunds} />
    </Card>
  );

  const linesCard = (
    <Card className="gap-4">
      <Text className="text-label font-semibold text-foreground">
        {`${t('orders.detail.lines')} · ${fill(t('orders.detail.itemCount'), { count: itemCount(order) })}`}
      </Text>
      <OrderLinesList lines={order.lines} products={products} />
      <OrderTotals order={order} />
    </Card>
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
      <View className="flex-row">
        <Button
          accessibilityLabel={t('orders.detail.back')}
          className="flex-row items-center gap-1.5"
          onPress={() => router.push('/orders')}
          variant="ghost"
        >
          <AppIcon name="chevron-left" size={20} tone="muted-foreground" />
          <Text className="text-label font-semibold text-foreground">{t('orders.detail.back')}</Text>
        </Button>
      </View>

      <View className={isPhone ? 'gap-3' : 'flex-row flex-wrap items-start justify-between gap-3'}>
        <View className="min-w-0 gap-1">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text className="text-title font-bold text-foreground">{order.code}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text className="text-caption text-muted-foreground" numberOfLines={2}>
            {`${formatDateTime(order.createdAt)} · ${cashierName} · ${storeName}`}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <Button onPress={actions.reprint} variant="outline">
            {t('orders.actions.reprint')}
          </Button>
          <Button
            className="border-destructive"
            disabled={!actions.canRefund}
            labelClassName="text-destructive"
            onPress={() => setRefundOpen(true)}
            variant="outline"
          >
            {t('orders.actions.refund')}
          </Button>
          <VoidAlertDialog
            code={order.code}
            disabled={!actions.canVoidNow}
            onConfirm={() => {
              actions.voidOrder();
              setVoidOpen(false);
            }}
            onOpenChange={setVoidOpen}
            open={voidOpen}
          />
        </View>
      </View>

      {isPhone ? (
        <View className="gap-4">
          {linesCard}
          {summaryCard}
          {paymentsCard}
          {timelineCard}
        </View>
      ) : (
        <View className="flex-row items-start gap-4">
          <View className="min-w-0 flex-[3] gap-4">
            {linesCard}
            {paymentsCard}
          </View>
          <View className="min-w-0 flex-[2] gap-4">
            {summaryCard}
            {timelineCard}
          </View>
        </View>
      )}

      <RefundDialog
        onConfirm={actions.refund}
        onOpenChange={setRefundOpen}
        open={refundOpen}
        order={order}
        priorRefunds={actions.refunds}
        products={products}
      />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <Text className="text-label text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-label text-foreground">{value}</Text>
    </View>
  );
}
