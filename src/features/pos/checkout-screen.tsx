import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  ButtonLabel,
  SegmentedControl,
  SegmentedControlItem,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { calcCart, nextOrderCode, type PricedCartLine } from '../../domain/pos';
import { formatVND, roundVND, sum } from '../../domain/money';
import type { Order, Payment, PaymentMethod } from '../../domain/types';
import { useT } from '../../i18n';
import { useCartStore } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { submitOrder } from './adapters';
import { PaymentMethodPanel } from './components/payment-method-panel';
import { SplitPaymentList } from './components/split-payment-list';

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'card', 'points'];
const METHOD_LABEL_KEY: Record<PaymentMethod, string> = {
  cash: 'pos.checkout.methodCash',
  transfer: 'pos.checkout.methodTransfer',
  card: 'pos.checkout.methodCard',
  points: 'pos.checkout.methodPoints',
};

export default function CheckoutScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();

  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const currentShift = useCurrentShift();
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const orders = useOrderStore((state) => state.orders);

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [payments, setPayments] = useState<Payment[]>([]);

  const customer = customers.find((c) => c.id === cart.customerId);

  const pricedLines: PricedCartLine[] = cart.lines.map((line) => ({
    ...line,
    taxRate: products.find((product) => product.id === line.productId)?.taxRate ?? 0,
  }));
  const totals = calcCart(pricedLines, cart.discount);
  const paidSoFar = sum(payments.map((payment) => payment.amount));
  const remaining = Math.max(0, roundVND(totals.total - paidSoFar));
  const canConfirm = cart.lines.length > 0 && payments.length > 0 && remaining === 0;

  function handleAddPayment(payment: Payment) {
    if (payment.amount <= 0) return;
    setPayments((prev) => [...prev, payment]);
  }

  function handleRemovePayment(index: number) {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (!store || !staff || !canConfirm) return;

    const existingCodes = orders.filter((order) => order.storeId === store.id).map((order) => order.code);
    const order: Order = {
      id: `order-${Date.now()}`,
      code: nextOrderCode(store.code, new Date(), existingCodes),
      storeId: store.id,
      cashierId: staff.id,
      customerId: cart.customerId,
      lines: cart.lines,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      payments,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    submitOrder(order, { shiftId: currentShift?.id });
    clearCart();
    toast.show({ title: t('pos.checkout.successToast'), variant: 'success' });
    router.replace(`/pos/receipt/${order.id}`);
  }

  if (cart.lines.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-muted-foreground">{t('pos.checkout.emptyCartError')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-semibold text-foreground">{t('pos.checkout.title')}</Text>

      <View className="gap-2 rounded-lg border border-border p-4">
        <Text className="text-sm font-medium text-foreground">{t('pos.checkout.summary')}</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.subtotal')}</Text>
          <Text className="text-sm text-foreground">{formatVND(totals.subtotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.discount')}</Text>
          <Text className="text-sm text-foreground">-{formatVND(totals.discountTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.cart.tax')}</Text>
          <Text className="text-sm text-foreground">{formatVND(totals.taxTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">{t('pos.cart.total')}</Text>
          <Text className="text-lg font-semibold text-foreground">{formatVND(totals.total)}</Text>
        </View>
      </View>

      <SegmentedControl value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
        {METHODS.map((item) => (
          <SegmentedControlItem key={item} value={item}>
            {t(METHOD_LABEL_KEY[item])}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      <PaymentMethodPanel key={method} method={method} remaining={remaining} customer={customer} onAddPayment={handleAddPayment} />

      <SplitPaymentList payments={payments} onRemove={handleRemovePayment} />

      <View className="flex-row items-center justify-between rounded-lg border border-border p-4">
        <Text className="text-sm text-muted-foreground">{t('pos.checkout.remaining')}</Text>
        <Text className={`text-base font-semibold ${remaining === 0 ? 'text-success' : 'text-destructive'}`}>
          {remaining === 0 ? t('pos.checkout.fullyPaid') : formatVND(remaining)}
        </Text>
      </View>

      <Button disabled={!canConfirm} onPress={handleConfirm}>
        <ButtonLabel>{t('pos.checkout.confirm')}</ButtonLabel>
      </Button>
    </ScrollView>
  );
}
