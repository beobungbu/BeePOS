import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, EmptyState, Text, useToast } from '@beemvp/beeui-ui';
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
// The return/exchange screen names itself; the word comes from its own dictionary.
import '../../../i18n/returns.vi';
import '../../../i18n/returns.en';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { StatStrip } from '../../../components/stat-strip';
import { formatDate, formatDateTime } from '../../../lib/datetime';
import { OrderStatusBadge } from '../components/order-status-badge';
import { OrderLifecycleStepper } from '../components/order-lifecycle-stepper';
import { OrderWholesalePanel } from '../components/order-wholesale-panel';
import { DeliveryNoteDialog } from '../components/delivery-note-dialog';
import { CancelOrderDialog } from '../components/cancel-order-dialog';
import { useWholesaleOrderActions } from '../hooks/use-wholesale-order-actions';
import { OrderLinesList } from '../components/order-lines-list';
import { OrderTimeline } from '../components/order-timeline';
import { OrderTotals } from '../components/order-totals';
import { RefundDialog } from '../components/refund-dialog';
import { VoidAlertDialog } from '../components/void-alert-dialog';
import { useOrderActions } from '../hooks/use-order-actions';
import { itemCount } from '../lib/order-presentation';
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
  const wholesaleActions = useWholesaleOrderActions(order);
  const toast = useToast();

  const [refundOpen, setRefundOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  // Pushed route: the back control lives in the shell header, next to the order code.
  useScreenHeader({ title: order?.code ?? t('orders.title'), backTo: '/orders' });

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
  const isWholesale = order.channel === 'wholesale';
  const rep = staff.find((member) => member.id === order.salesRepId);
  const { progress } = wholesaleActions;

  const summaryCard = (
    <Card className="gap-3">
      <Text variant="label" className="font-semibold text-foreground">{t('orders.detail.summary')}</Text>
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
      <Text variant="label" className="font-semibold text-foreground">{t('orders.detail.payments')}</Text>
      {/* An on-account order takes no money at the till: what settles it is the receivable,
          so the card names it rather than showing an empty list. */}
      {order.payments.length === 0 ? (
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="label" className="font-normal text-muted-foreground">
            {t('orders.lifecycle.onAccount')}
          </Text>
          <Text variant="label" className="font-semibold text-foreground" numeric="tabular">
            {order.dueDate ? formatDate(order.dueDate.toISOString()) : formatVND(order.total)}
          </Text>
        </View>
      ) : null}
      {order.payments.map((payment, index) => (
        <View className="flex-row items-center justify-between gap-3" key={`${payment.method}-${index}`}>
          <Text variant="label" className="font-normal text-muted-foreground">{t(`orders.paymentMethod.${payment.method}`)}</Text>
          <Text variant="label" className="font-semibold text-foreground" numeric="tabular">
            {formatVND(payment.amount)}
          </Text>
        </View>
      ))}
    </Card>
  );

  const timelineCard = (
    <Card className="gap-3">
      <Text variant="label" className="font-semibold text-foreground">{t('orders.detail.timeline')}</Text>
      <OrderTimeline cashierName={cashierName} order={order} refunds={actions.refunds} />
    </Card>
  );

  const wholesalePanel = isWholesale ? (
    <OrderWholesalePanel
      order={order}
      progress={progress}
      products={products}
      notes={wholesaleActions.notes}
      customer={customer}
      rep={rep}
      onMarkDelivered={(noteId) => {
        wholesaleActions.markDelivered(noteId);
        toast.show({ title: t('orders.delivery.deliveredToast'), variant: 'success' });
      }}
    />
  ) : null;

  const linesCard = (
    <Card className="gap-4">
      <Text variant="label" className="font-semibold text-foreground">
        {`${t('orders.detail.lines')} · ${fill(t('orders.detail.itemCount'), { count: itemCount(order) })}`}
      </Text>
      <OrderLinesList lines={order.lines} products={products} />
      <OrderTotals order={order} />
    </Card>
  );

  // A wholesale order leads with where it is in its lifecycle and how much of it has
  // arrived; a retail bill has neither, so it keeps the header it always had.
  const wholesaleHeader = isWholesale ? (
    <View className="gap-3">
      <OrderLifecycleStepper status={order.status} />
      <StatStrip
        layout={isPhone ? 'stacked' : 'row'}
        items={[
          { label: t('orders.lifecycle.orderValue'), value: formatVND(order.total) },
          {
            label: t('orders.lifecycle.delivered'),
            value: formatVND(progress.deliveredValue),
            tone: 'success',
          },
          {
            label: t('orders.lifecycle.pendingValue'),
            value: formatVND(progress.pendingValue),
            tone: progress.pendingValue > 0 ? 'warning' : 'foreground',
          },
          {
            label: t('orders.lifecycle.payment'),
            value: order.dueDate
              ? `${t('orders.lifecycle.onAccount')} · ${formatDate(order.dueDate.toISOString())}`
              : t(`orders.paymentMethod.${order.payments[0]?.method ?? 'cash'}`),
          },
          {
            label: t('orders.lifecycle.salesRep'),
            value: rep?.name ?? t('orders.lifecycle.noRep'),
          },
        ]}
      />
    </View>
  ) : null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName={`gap-4 pb-8 pt-3 ${gutter}`}>
      <View className={isPhone ? 'gap-3' : 'flex-row flex-wrap items-start justify-between gap-3'}>
        <View className="min-w-0 gap-1">
          <View className="flex-row flex-wrap items-center gap-3">
            <Text variant="title" className="font-bold text-foreground">{order.code}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text variant="caption" className="text-muted-foreground" numberOfLines={2}>
            {`${formatDateTime(order.createdAt)} · ${cashierName} · ${storeName}`}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {isWholesale ? (
            <>
              {wholesaleActions.nextStatus ? (
                <Button onPress={wholesaleActions.advance}>
                  {`${t('orders.lifecycle.advanceTo')} ${t(
                    `orders.status.${wholesaleActions.nextStatus}`,
                  )}`}
                </Button>
              ) : null}
              <Button variant="outline" onPress={() => setDeliveryOpen(true)}>
                {t('orders.delivery.create')}
              </Button>
              {customer?.type === 'company' ? (
                <Button variant="outline" onPress={() => router.push(`/orders/invoice/${order.id}`)}>
                  {t('orders.vatInvoice.action')}
                </Button>
              ) : null}
              <CancelOrderDialog
                code={order.code}
                disabled={!wholesaleActions.canCancel}
                onConfirm={(reason) => {
                  wholesaleActions.cancel(reason);
                  toast.show({ title: t('orders.lifecycle.cancelled'), variant: 'success' });
                }}
              />
            </>
          ) : null}
          <Button onPress={actions.reprint} variant="outline">
            {t('orders.actions.reprint')}
          </Button>
          {/* Returning goods from this order is a new transaction at the till, so the action
              hands over to `/pos/returns` rather than mutating the order from here. */}
          {actions.canRefund ? (
            <Button onPress={() => router.push('/pos/returns')} variant="outline">
              {t('returns.entryTitle')}
            </Button>
          ) : null}
          <Button
            className="border-destructive"
            disabled={!actions.canRefund}
            labelClassName="text-destructive"
            onPress={() => setRefundOpen(true)}
            variant="outline"
          >
            {t('orders.actions.refund')}
          </Button>
          {/* Void is the retail till's correction of a bill rung up in error; the wholesale
              equivalent is cancelling the order, which is already in this row. Showing both
              would put the same word on two buttons that do different things. */}
          {isWholesale ? null : (
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
          )}
        </View>
      </View>

      {wholesaleHeader}

      {isPhone ? (
        <View className="gap-4">
          {linesCard}
          {wholesalePanel}
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
            {wholesalePanel}
            {summaryCard}
            {timelineCard}
          </View>
        </View>
      )}

      <DeliveryNoteDialog
        open={deliveryOpen}
        onOpenChange={setDeliveryOpen}
        progress={progress}
        products={products}
        onCreate={(lines) => {
          wholesaleActions.createNote(lines);
          toast.show({ title: t('orders.delivery.created'), variant: 'success' });
        }}
      />

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
      <Text variant="label" className="font-normal text-muted-foreground">{label}</Text>
      <Text variant="label" className="font-normal flex-1 text-right text-foreground">{value}</Text>
    </View>
  );
}
