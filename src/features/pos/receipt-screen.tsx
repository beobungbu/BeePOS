import { useEffect } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonLabel, Text, useToast } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { calcChange, formatReceiptText, type ReceiptTextInput } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { useActiveCart } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useOrderStore } from '../../data/order-store';
import { usePricingStore } from '../../data/pricing-store';
import { useSessionStore } from '../../data/session-store';
import { METHOD_LABEL_KEY } from './components/payment-method-cards';
import { SecondaryButtonLabel } from './components/secondary-button-label';
import { usePosLayout } from './hooks/use-pos-layout';
import { cartLabel } from './lib/order-label';
import { pointsEarnedOnOrder } from './lib/loyalty';
import { formatDateTime } from '../../lib/datetime';
import {
  ensurePrintStylesheet,
  printReceipt,
  RECEIPT_PRINT_ID,
  shareReceipt,
} from './lib/receipt-print';

/** Cash payments encode the tendered amount in `ref` as "tendered=<n>" so change can be shown here. */
function tenderedFromRef(ref: string | undefined): number | undefined {
  if (!ref || !ref.startsWith('tendered=')) return undefined;
  const value = Number.parseFloat(ref.slice('tendered='.length));
  return Number.isFinite(value) ? value : undefined;
}

export default function ReceiptScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const layout = usePosLayout();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const order = useOrderStore((state) => state.orders.find((item) => item.id === orderId));
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const pointHistory = useCustomerStore((state) => state.pointHistory);
  const loyaltyRule = usePricingStore((state) => state.loyaltyRule);
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const nextCart = useActiveCart();

  // The receipt names itself in the app header: the order code over the store and the time.
  useScreenHeader({
    title: order?.code ?? t('pos.receipt.title'),
    subtitle: order ? formatDateTime(order.createdAt) : undefined,
    backTo: '/pos',
  });

  // Before the early return below: the stylesheet has to be in the document whether or not
  // this receipt resolved, and hooks cannot run conditionally.
  useEffect(() => {
    ensurePrintStylesheet();
  }, []);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text variant="body" className="text-muted-foreground">{t('pos.receipt.notFound')}</Text>
      </View>
    );
  }

  const customer = customers.find((item) => item.id === order.customerId);
  const totalChange = order.payments.reduce((accumulator, payment) => {
    const tendered = tenderedFromRef(payment.ref);
    return tendered !== undefined ? accumulator + calcChange(payment.amount, tendered) : accumulator;
  }, 0);
  const dateText = formatDateTime(order.createdAt);
  const customerName = customer?.name ?? t('pos.cart.customerDefault');
  // What this sale actually awarded, under the chain's own earn rate and the buyer's tier at
  // the moment it was rung up. A sale with no buyer attached earns nothing and prints nothing.
  const pointsEarned = customer ? pointsEarnedOnOrder(pointHistory, order, loyaltyRule) : 0;

  // Bound once so the two callbacks below keep the narrowing the guard above established.
  const paidOrder = order;

  /** The same receipt as the screen, in the 32 column form a share sheet can carry. */
  function receiptText(): string {
    const input: ReceiptTextInput = {
      storeName: store?.name ?? t('pos.receipt.title'),
      storeAddress: store?.address,
      code: paidOrder.code,
      dateText,
      cashierName: staff?.name ?? paidOrder.cashierId,
      customerName,
      lines: paidOrder.lines.map((line) => ({
        name: products.find((item) => item.id === line.productId)?.name ?? line.productId,
        qty: line.qty,
        unitPrice: line.unitPrice,
      })),
      subtotal: paidOrder.subtotal,
      discountTotal: paidOrder.discountTotal,
      taxTotal: paidOrder.taxTotal,
      total: paidOrder.total,
      payments: paidOrder.payments.map((payment) => ({
        label: t(METHOD_LABEL_KEY[payment.method]),
        amount: payment.amount,
      })),
      change: totalChange,
      pointsEarned,
      footer: t('pos.receipt.footer'),
      labels: {
        orderCode: t('pos.receipt.orderCode'),
        date: t('pos.receipt.date'),
        cashier: t('pos.receipt.cashier'),
        customer: t('pos.receipt.customer'),
        subtotal: t('pos.receipt.subtotal'),
        discount: t('pos.receipt.discount'),
        tax: t('pos.receipt.tax'),
        total: t('pos.cart.grandTotal'),
        change: t('pos.receipt.change'),
        pointsEarned: t('pos.receipt.pointsEarned'),
      },
    };
    return formatReceiptText(input);
  }

  function handlePrint() {
    if (printReceipt()) {
      toast.show({ title: t('pos.receipt.printedToast'), variant: 'success' });
      return;
    }
    toast.show({ title: t('pos.receipt.printFailed'), variant: 'destructive' });
  }

  async function handleShare() {
    const outcome = await shareReceipt(receiptText(), paidOrder.code);
    if (outcome === 'shared') {
      toast.show({ title: t('pos.receipt.sharedToast'), variant: 'success' });
    } else if (outcome === 'failed') {
      toast.show({ title: t('pos.receipt.shareFailed'), variant: 'destructive' });
    }
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 12, alignItems: 'center' }}
      >
        <View className="w-full max-w-[480px] gap-3">
          <View className="items-center gap-1 rounded-lg bg-success/10 px-4 py-5">
            <Text variant="label" className="font-semibold text-success">{t('pos.receipt.successTitle')}</Text>
            <Text variant="title" className="font-bold tabular-nums text-success">{formatVND(order.total)}</Text>
            {totalChange > 0 ? (
              <Text variant="label" className="font-normal text-muted-foreground">
                {`${t('pos.receipt.change')}: ${formatVND(totalChange)}`}
              </Text>
            ) : null}
          </View>

          {/* The printed block. Everything outside it is hidden by the print stylesheet in
              lib/receipt-print.ts, so what leaves the browser is the receipt at 58 mm. */}
          <View nativeID={RECEIPT_PRINT_ID} className="gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="items-center gap-0.5">
              <Text variant="body" className="font-semibold text-foreground">
                {store?.name ?? t('pos.receipt.title')}
              </Text>
              <Text variant="caption" className="text-muted-foreground">{store?.address}</Text>
            </View>

            <View className="h-px bg-border" />

            <ReceiptRow label={t('pos.receipt.orderCode')} value={order.code} />
            <ReceiptRow label={t('pos.receipt.date')} value={dateText} />
            <ReceiptRow label={t('pos.receipt.cashier')} value={staff?.name ?? order.cashierId} />
            <ReceiptRow label={t('pos.receipt.customer')} value={customerName} />

            <View className="h-px bg-border" />

            {order.lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              return (
                <View key={line.productId} className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text variant="label" className="font-normal text-foreground" numberOfLines={2}>
                      {product?.name ?? line.productId}
                    </Text>
                    <Text variant="caption" className="tabular-nums text-muted-foreground">
                      {`${line.qty} x ${formatVND(line.unitPrice)}`}
                    </Text>
                  </View>
                  <Text variant="label" className="font-normal tabular-nums text-foreground">
                    {formatVND(line.unitPrice * line.qty)}
                  </Text>
                </View>
              );
            })}

            <View className="h-px bg-border" />

            <ReceiptRow label={t('pos.receipt.subtotal')} value={formatVND(order.subtotal)} />
            <ReceiptRow
              label={t('pos.receipt.discount')}
              value={order.discountTotal > 0 ? `-${formatVND(order.discountTotal)}` : formatVND(0)}
            />
            <ReceiptRow label={t('pos.receipt.tax')} value={formatVND(order.taxTotal)} />

            <View className="h-px bg-border-strong" />

            <View className="flex-row items-center justify-between">
              <Text variant="label" className="font-normal text-muted-foreground">{t('pos.cart.grandTotal')}</Text>
              <Text variant="heading" className="font-bold tabular-nums text-foreground">
                {formatVND(order.total)}
              </Text>
            </View>

            {order.payments.map((payment, index) => (
              <ReceiptRow
                key={`${payment.method}-${index}`}
                label={t(METHOD_LABEL_KEY[payment.method])}
                value={formatVND(payment.amount)}
              />
            ))}
            {totalChange > 0 ? (
              <ReceiptRow label={t('pos.receipt.change')} value={formatVND(totalChange)} />
            ) : null}
            {pointsEarned > 0 ? (
              <ReceiptRow
                label={t('pos.receipt.pointsEarned')}
                value={`+${pointsEarned} ${t('pos.checkout.pointsUnit')}`}
              />
            ) : null}

            <Text variant="caption" className="pt-1 text-center text-subtle-foreground">
              {t('pos.receipt.footer')}
            </Text>
          </View>

          {/*
            One control, because only one of the two is real on a given platform: the browser
            prints, and a phone with no printer driver shares the text instead. A button that
            does nothing when pressed is a lie about the product.
          */}
          <View className="flex-row gap-2">
            {Platform.OS === 'web' ? (
              <Button variant="outline" className="flex-1" onPress={handlePrint}>
                <SecondaryButtonLabel>{t('pos.receipt.print')}</SecondaryButtonLabel>
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onPress={handleShare}>
                <SecondaryButtonLabel>{t('pos.receipt.share')}</SecondaryButtonLabel>
              </Button>
            )}
          </View>

          <Button className="min-h-[52px]" onPress={() => router.replace('/pos')}>
            <ButtonLabel>
              {`${t('pos.receipt.continueTo')} · ${cartLabel(t, nextCart)}`}
            </ButtonLabel>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="label" className="font-normal text-muted-foreground">{label}</Text>
      <Text variant="label" className="font-normal tabular-nums text-foreground">{value}</Text>
    </View>
  );
}
