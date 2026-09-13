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
import { FormScrollView } from '../../components/form-scroll-view';
import { useScreenHeader } from '../../components/shell/screen-header';
import { pointsEarned } from '../../domain/pos';
import { creditCheck, dueDateFor } from '../../domain/ledger';
import { formatVND, roundVND, sum } from '../../domain/money';
import type { Order, Payment, PaymentMethod } from '../../domain/types';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';
import { useLargeText } from '../../hooks/use-large-text';
import { useActiveCart, useCartStore } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useLedgerStore } from '../../data/ledger-store';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { recordOnAccountInvoice, submitOrder } from './adapters';
import { OnAccountPanel } from './components/on-account-panel';
import { OrderTotalsPanel } from './components/order-totals-panel';
import {
  ON_ACCOUNT,
  PaymentMethodCards,
  type PaymentChoice,
} from './components/payment-method-cards';
import { PaymentMethodPanel } from './components/payment-method-panel';
import { SplitPaymentList } from './components/split-payment-list';
import { VatInvoiceBlock } from './components/vat-invoice-block';
import { usePosLayout } from './hooks/use-pos-layout';
import { useCartRepricing } from './hooks/use-wholesale-pricing';
import { buildOrder, vatInvoiceFor } from './lib/build-order';
import { cartLineCount, cartTotalsOf, cartUnitCount } from './lib/cart-totals';
import { cartLabel, countLabel, openOrdersLabel } from './lib/order-label';
import { draftPayment } from './lib/payment-draft';
import { unitConversionText } from './lib/wholesale';
import { currentOrgId } from '../../data/org-store';
import { currentCost } from '../../data/costing-store';

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
  const setVatInvoice = useCartStore((state) => state.setVatInvoice);
  const ledgerEntries = useLedgerStore((state) => state.entries);

  const [choice, setChoice] = useState<PaymentChoice>('cash');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amountText, setAmountText] = useState('');
  const [refText, setRefText] = useState('');
  const [pointsText, setPointsText] = useState('');

  const customer = customers.find((item) => item.id === cart.customerId);
  const totals = cartTotalsOf(cart, products);
  const paidSoFar = sum(payments.map((payment) => payment.amount));
  const remaining = Math.max(0, roundVND(totals.total - paidSoFar));

  // A tier crossed on the way to this screen has to be priced before anything is tendered.
  useCartRepricing(cart);

  const wholesale = cart.wholesale === true;
  const isCompany = customer?.type === 'company';
  const vatInvoice = cart.vatInvoice ?? vatInvoiceFor(customer);
  const credit = customer
    ? creditCheck(customer, ledgerEntries, totals.total)
    : { allowed: false, balance: 0, limit: 0, available: 0, projected: totals.total };
  // No limit means no credit: a shop that has not agreed one with a buyer is not extending it.
  const accountAllowed = wholesale && isCompany && credit.limit > 0;
  const onAccount = choice === ON_ACCOUNT;
  const dueDate = dueDateFor(new Date(), customer?.paymentTermDays);
  const method: PaymentMethod = onAccount ? 'cash' : choice;

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
  const canFinish = onAccount
    ? credit.allowed && payments.length === 0
    : remaining === 0 || (draft.payment !== undefined && draft.settlesBalance);
  const canAct = canFinish || (!onAccount && draft.payment !== undefined);

  /** Switching method clears the fields of the previous one instead of carrying them over. */
  function chooseMethod(next: PaymentChoice) {
    setChoice(next);
    setAmountText('');
    setRefText('');
    setPointsText('');
  }

  function completeOrder(finalPayments: Payment[]) {
    if (!store || !staff) return;
    if (finalPayments.length === 0 && !onAccount) return;

    const existingCodes = orders.filter((order) => order.storeId === store.id).map((order) => order.code);
    // Wholesale never rings straight into `paid`: the goods still have to be delivered, and
    // the lifecycle stepper on the order detail is what walks it from there. Retail is a
    // counter sale and is done.
    const order: Order = buildOrder({
      cart: { ...cart, vatInvoice: wholesale ? vatInvoice : undefined },
      store,
      orgId: currentOrgId(),
      cashierId: staff.id,
      customer,
      totals,
      payments: finalPayments,
      status: wholesale ? 'confirmed' : 'paid',
      existingCodes,
      costFor: (productId) => {
        const product = products.find((item) => item.id === productId);
        return currentCost(productId, store.id) ?? product?.costPrice ?? 0;
      },
      onAccount,
    });

    submitOrder(order, { shiftId: currentShift?.id });
    if (onAccount) recordOnAccountInvoice(order);
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
    toast.show({
      title: onAccount ? t('pos.wholesale.account.recorded') : t('pos.checkout.successToast'),
      variant: 'success',
    });
    // A wholesale order is not finished by being rung up: it still has to be delivered, so
    // the till lands on the order detail, where the stepper and the delivery notes live. A
    // retail sale lands on its receipt, which is the thing the customer walks away with.
    router.replace(order.channel === 'wholesale' ? `/orders/${order.id}` : `/pos/receipt/${order.id}`);
  }

  function handlePrimaryPress() {
    if (onAccount) {
      // Nothing is tendered: the whole total becomes a receivable, so the order is booked
      // with no payment at all rather than with a fictional one.
      if (credit.allowed) completeOrder([]);
      return;
    }
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
      <OrderTotalsPanel
        totals={totals}
        collapsible={layout.breakpoint === 'phone'}
        wholesale={wholesale}
      />
      {wholesale && isCompany ? (
        <VatInvoiceBlock value={vatInvoice} onChange={setVatInvoice} />
      ) : null}
      <View className="gap-2">
        <Text variant="label" className="font-semibold text-foreground">{t('pos.checkout.method')}</Text>
        <PaymentMethodCards
          value={choice}
          onChange={chooseMethod}
          compact={layout.breakpoint === 'phone'}
          allowAccount={accountAllowed}
        />
        {wholesale && !isCompany ? (
          <Text variant="caption" className="text-muted-foreground">
            {t('pos.wholesale.account.needCompany')}
          </Text>
        ) : null}
      </View>
      {onAccount ? (
        <OnAccountPanel check={credit} dueDate={dueDate} noLimit={credit.limit <= 0} />
      ) : (
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
      )}
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

  // "Ghi nợ · 6.771.600 đ": the button says what it is about to do to the buyer's account,
  // not "Hoàn tất", because no money changes hands.
  const actionWord = onAccount
    ? t('pos.wholesale.account.method')
    : canFinish
      ? t('pos.checkout.finish')
      : t('pos.checkout.addPayment');
  const actionAmount = formatVND(
    onAccount || canFinish ? totals.total : draft.payment?.amount ?? remaining,
  );
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
                              {wholesale ? unitConversionText(product, line) : product?.unit ?? ''}
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
      {/* "Tiền khách đưa" opens the keypad straight over the pay button on a phone, and the
          default scroll view swallows the first tap that follows (P7-03). */}
      <FormScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 12 }}
      >
        {paymentColumn}
      </FormScrollView>
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
