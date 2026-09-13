import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  ButtonLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../components/icons';
import { useScreenHeader } from '../../components/shell/screen-header';
import { nextOrderCode, pointsEarned } from '../../domain/pos';
import { formatVND, roundVND, sum } from '../../domain/money';
import type { Order, Payment, PaymentMethod } from '../../domain/types';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';
import { useLargeText } from '../../hooks/use-large-text';
import { useActiveCart, useCartStore } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { submitOrder } from './adapters';
import { OrderTotalsPanel } from './components/order-totals-panel';
import { PaymentMethodCards } from './components/payment-method-cards';
import { PaymentMethodPanel } from './components/payment-method-panel';
import { SplitPaymentList } from './components/split-payment-list';
import { usePosLayout } from './hooks/use-pos-layout';
import { cartLineCount, cartTotalsOf, cartUnitCount } from './lib/cart-totals';
import { cartLabel, countLabel, openOrdersLabel } from './lib/order-label';
import { draftPayment } from './lib/payment-draft';
import { currentOrgId } from '../../data/org-store';

export default function CheckoutScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const layout = usePosLayout();
  const largeText = useLargeText();

  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const currentShift = useCurrentShift();
  const cart = useActiveCart();
  const carts = useCartStore((state) => state.carts);
  const closeCart = useCartStore((state) => state.closeCart);
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const orders = useOrderStore((state) => state.orders);

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amountText, setAmountText] = useState('');
  const [refText, setRefText] = useState('');
  const [pointsText, setPointsText] = useState('');

  const customer = customers.find((item) => item.id === cart.customerId);
  const totals = cartTotalsOf(cart, products);
  const paidSoFar = sum(payments.map((payment) => payment.amount));
  const remaining = Math.max(0, roundVND(totals.total - paidSoFar));

  const draft = draftPayment({
    method,
    remaining,
    amountText,
    refText,
    pointsText,
    customerPoints: customer?.points,
  });

  const isDesktop = layout.breakpoint === 'desktop';
  const otherOpenOrders = carts.length - 1;
  const isEmpty = cart.lines.length === 0;

  // The shell header carries the screen: `Thanh toán` over the store, the counts and, from
  // tablet up, how many orders stay open, with the order being paid as the badge. Switching
  // order mid payment is never correct, so there is no strip here, only the name.
  useScreenHeader({
    title: t('pos.checkout.title'),
    subtitle: isEmpty
      ? undefined
      : [
          countLabel(t, cartLineCount(cart), 'pos.cart.lineItems'),
          countLabel(t, cartUnitCount(cart), 'pos.cart.items'),
          otherOpenOrders > 0 && layout.breakpoint !== 'phone'
            ? openOrdersLabel(t, otherOpenOrders)
            : undefined,
        ]
          .filter(Boolean)
          .join(' · '),
    badge: cartLabel(t, cart),
    backTo: '/pos',
  });
  const canFinish = remaining === 0 || (draft.payment !== undefined && draft.settlesBalance);
  const canAct = canFinish || draft.payment !== undefined;

  /** Switching method clears the fields of the previous one instead of carrying them over. */
  function chooseMethod(next: PaymentMethod) {
    setMethod(next);
    setAmountText('');
    setRefText('');
    setPointsText('');
  }

  function completeOrder(finalPayments: Payment[]) {
    if (!store || !staff || finalPayments.length === 0) return;

    const existingCodes = orders.filter((order) => order.storeId === store.id).map((order) => order.code);
    const order: Order = {
      id: `order-${Date.now()}`,
      orgId: currentOrgId(),
      code: nextOrderCode(store.code, new Date(), existingCodes),
      storeId: store.id,
      cashierId: staff.id,
      customerId: cart.customerId,
      lines: cart.lines,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      payments: finalPayments,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    submitOrder(order, { shiftId: currentShift?.id });
    // Logged here rather than where the discount is typed: at the till it is still a cart,
    // and a log line that names no order code is a line nobody can trace back.
    if (order.discountTotal > 0) {
      recordAudit({
        action: 'orderDiscount',
        entity: 'order',
        entityId: order.code,
        summary: fill(t('chain.audit.summary.discount'), {
          amount: formatVND(order.discountTotal),
          base: formatVND(order.subtotal),
        }),
      });
    }
    // Paying retires the order: the cashier lands on the next open one, or on a fresh empty
    // order when this was the last.
    closeCart(cart.id);
    toast.show({ title: t('pos.checkout.successToast'), variant: 'success' });
    router.replace(`/pos/receipt/${order.id}`);
  }

  function handlePrimaryPress() {
    if (remaining === 0) {
      completeOrder(payments);
      return;
    }
    if (!draft.payment) return;
    if (draft.settlesBalance) {
      completeOrder([...payments, draft.payment]);
      return;
    }
    setPayments((previous) => [...previous, draft.payment as Payment]);
    setAmountText('');
    setRefText('');
    setPointsText('');
  }

  if (isEmpty) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text variant="body" className="text-muted-foreground">{t('pos.checkout.emptyCartError')}</Text>
      </View>
    );
  }

  const paymentColumn = (
    <>
      <OrderTotalsPanel totals={totals} collapsible={layout.breakpoint === 'phone'} />
      <View className="gap-2">
        <Text variant="label" className="font-semibold text-foreground">{t('pos.checkout.method')}</Text>
        <PaymentMethodCards value={method} onChange={chooseMethod} compact={layout.breakpoint === 'phone'} />
      </View>
      <PaymentMethodPanel
        method={method}
        remaining={remaining}
        customer={customer}
        draft={draft}
        amountText={amountText}
        onAmountChange={setAmountText}
        refText={refText}
        onRefChange={setRefText}
        pointsText={pointsText}
        onPointsChange={setPointsText}
        storeName={store?.name}
      />
      <SplitPaymentList
        payments={payments}
        remaining={remaining}
        onRemove={(index) => setPayments((previous) => previous.filter((_, i) => i !== index))}
      />
      {isDesktop ? (
        <View className="gap-1 rounded-md bg-surface-muted p-3">
          <MetaRow label={t('pos.checkout.shiftLine')} value={currentShift ? t('pos.shift.statusOpen') : t('pos.checkout.noShift')} />
          <MetaRow label={t('pos.checkout.cashier')} value={staff?.name ?? ''} />
          {customer ? (
            <MetaRow
              label={t('pos.checkout.pointsEarned')}
              value={`${pointsEarned(totals.total)} ${t('pos.checkout.pointsUnit')}`}
            />
          ) : null}
        </View>
      ) : null}
    </>
  );

  const actionWord = canFinish ? t('pos.checkout.finish') : t('pos.checkout.addPayment');
  const actionAmount = formatVND(canFinish ? totals.total : draft.payment?.amount ?? remaining);
  const actionLabel = `${actionWord} · ${actionAmount}`;

  const primaryAction = (
    <View className="gap-1.5">
      {/* BeeUI clamps a button label to one line, so at large text sizes "Thêm thanh toán ·
          13.200 đ" truncated to "· 13.2…" and the amount lost its currency. Above the
          threshold the verb and the amount are stacked instead, and the button grows: the
          cashier never confirms a figure they cannot read in full. */}
      <Button
        className="min-h-[52px]"
        disabled={!canAct}
        onPress={handlePrimaryPress}
        accessibilityLabel={actionLabel}
      >
        {largeText ? (
          <View className="items-center">
            <ButtonLabel>{actionWord}</ButtonLabel>
            <ButtonLabel>{actionAmount}</ButtonLabel>
          </View>
        ) : (
          <ButtonLabel>{actionLabel}</ButtonLabel>
        )}
      </Button>
      {otherOpenOrders > 0 ? (
        <Text variant="caption" className="text-center text-subtle-foreground">
          {`${t('pos.checkout.nextOrderHint')} ${cartLabel(
            t,
            carts.find((item) => item.id !== cart.id) ?? cart,
          )}`}
        </Text>
      ) : null}
    </View>
  );

  if (isDesktop) {
    return (
      <View className="flex-1">
        <View className="min-h-0 flex-1 flex-row">
          <ScrollView className="flex-1 bg-surface-muted" contentContainerStyle={{ padding: 24, gap: 16 }}>
            <Text variant="heading" className="font-semibold text-foreground">{t('pos.checkout.review')}</Text>
            <View className="overflow-hidden rounded-lg border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pos.checkout.reviewProduct')}</TableHead>
                    <TableHead>
                      <View className="w-full items-end">
                        <Text variant="caption" className="text-muted-foreground">
                          {t('pos.checkout.reviewUnitPrice')}
                        </Text>
                      </View>
                    </TableHead>
                    <TableHead>
                      <View className="w-full items-center">
                        <Text variant="caption" className="text-muted-foreground">
                          {t('pos.checkout.reviewQty')}
                        </Text>
                      </View>
                    </TableHead>
                    <TableHead>
                      <View className="w-full items-end">
                        <Text variant="caption" className="text-muted-foreground">
                          {t('pos.checkout.reviewLineTotal')}
                        </Text>
                      </View>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.lines.map((line) => {
                    const product = products.find((item) => item.id === line.productId);
                    return (
                      <TableRow key={line.productId}>
                        <TableCell>
                          <View className="gap-0.5">
                            <Text variant="label" className="font-semibold text-foreground">
                              {product?.name ?? line.productId}
                            </Text>
                            <Text variant="caption" className="text-muted-foreground">
                              {product?.unit ?? ''}
                            </Text>
                          </View>
                        </TableCell>
                        <TableCell>
                          <View className="w-full items-end">
                            <Text variant="label" className="font-normal tabular-nums text-foreground">
                              {formatVND(line.unitPrice)}
                            </Text>
                          </View>
                        </TableCell>
                        <TableCell>
                          <View className="w-full items-center">
                            <Text variant="label" className="font-normal tabular-nums text-foreground">{line.qty}</Text>
                          </View>
                        </TableCell>
                        <TableCell>
                          <View className="w-full items-end">
                            <Text variant="label" className="font-semibold tabular-nums text-foreground">
                              {formatVND(line.unitPrice * line.qty)}
                            </Text>
                          </View>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </View>
            {customer ? (
              <View className="flex-row items-center gap-2.5">
                <AppIcon name="users-round" size={18} tone="muted-foreground" />
                <Text variant="label" className="font-normal flex-1 text-foreground">
                  {`${customer.name} · ${customer.phone} · ${customer.points} ${t('pos.customerDialog.points')}`}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="w-[480px] border-l border-border bg-surface">
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, gap: 16 }}>
              {paymentColumn}
            </ScrollView>
            <View className="border-t border-border p-5">{primaryAction}</View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 12 }}
      >
        {paymentColumn}
      </ScrollView>
      <View className="border-t border-border bg-surface-raised p-3">{primaryAction}</View>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="caption" className="text-subtle-foreground">{label}</Text>
      <Text variant="caption" className="text-subtle-foreground">{value}</Text>
    </View>
  );
}
