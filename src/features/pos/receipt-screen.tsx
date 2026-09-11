import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonLabel, Separator, Text, useToast } from '@beemvp/beeui-ui';
import { calcChange } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import type { Payment } from '../../domain/types';
import { useT } from '../../i18n';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';

const METHOD_LABEL_KEY: Record<Payment['method'], string> = {
  cash: 'pos.checkout.methodCash',
  transfer: 'pos.checkout.methodTransfer',
  card: 'pos.checkout.methodCard',
  points: 'pos.checkout.methodPoints',
};

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
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const order = useOrderStore((state) => state.orders.find((item) => item.id === orderId));
  const products = useCatalogStore((state) => state.products);
  const customers = useCustomerStore((state) => state.customers);
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sm text-muted-foreground">{t('pos.receipt.notFound')}</Text>
      </View>
    );
  }

  const customer = customers.find((c) => c.id === order.customerId);
  const totalChange = order.payments.reduce((acc, payment) => {
    const tendered = tenderedFromRef(payment.ref);
    return tendered !== undefined ? acc + calcChange(payment.amount, tendered) : acc;
  }, 0);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View className="items-center gap-1">
        <Text className="text-lg font-semibold text-foreground">{store?.name ?? t('pos.receipt.title')}</Text>
        <Text className="text-xs text-muted-foreground">{store?.address}</Text>
      </View>

      <Separator />

      <View className="gap-1">
        <Text className="text-sm text-foreground">
          {t('pos.receipt.orderCode')}: {order.code}
        </Text>
        <Text className="text-sm text-foreground">
          {t('pos.receipt.date')}: {new Date(order.createdAt).toLocaleString('vi-VN')}
        </Text>
        <Text className="text-sm text-foreground">
          {t('pos.receipt.cashier')}: {staff?.name ?? order.cashierId}
        </Text>
        <Text className="text-sm text-foreground">
          {t('pos.receipt.customer')}: {customer?.name ?? t('pos.cart.customerDefault')}
        </Text>
      </View>

      <Separator />

      <View className="gap-2">
        {order.lines.map((line) => {
          const product = products.find((item) => item.id === line.productId);
          return (
            <View key={line.productId} className="flex-row items-center justify-between">
              <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                {product?.name ?? line.productId} x{line.qty}
              </Text>
              <Text className="text-sm text-foreground">{formatVND(line.unitPrice * line.qty)}</Text>
            </View>
          );
        })}
      </View>

      <Separator />

      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.receipt.subtotal')}</Text>
          <Text className="text-sm text-foreground">{formatVND(order.subtotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.receipt.discount')}</Text>
          <Text className="text-sm text-foreground">-{formatVND(order.discountTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{t('pos.receipt.tax')}</Text>
          <Text className="text-sm text-foreground">{formatVND(order.taxTotal)}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-foreground">{t('pos.receipt.total')}</Text>
          <Text className="text-lg font-semibold text-foreground">{formatVND(order.total)}</Text>
        </View>
      </View>

      <Separator />

      <View className="gap-1">
        <Text className="text-sm font-medium text-foreground">{t('pos.receipt.payments')}</Text>
        {order.payments.map((payment, index) => (
          <View key={`${payment.method}-${index}`} className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{t(METHOD_LABEL_KEY[payment.method])}</Text>
            <Text className="text-sm text-foreground">{formatVND(payment.amount)}</Text>
          </View>
        ))}
        {totalChange > 0 && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{t('pos.receipt.change')}</Text>
            <Text className="text-sm text-foreground">{formatVND(totalChange)}</Text>
          </View>
        )}
      </View>

      <Separator />

      <Text className="text-center text-xs text-muted-foreground">{t('pos.receipt.footer')}</Text>

      <View className="flex-row gap-2 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => toast.show({ title: t('pos.receipt.printedToast'), variant: 'success' })}
        >
          <ButtonLabel>{t('pos.receipt.print')}</ButtonLabel>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => toast.show({ title: t('pos.receipt.sharedToast'), variant: 'success' })}
        >
          <ButtonLabel>{t('pos.receipt.share')}</ButtonLabel>
        </Button>
      </View>
      <Button onPress={() => router.replace('/pos')}>
        <ButtonLabel>{t('pos.receipt.newSale')}</ButtonLabel>
      </Button>
    </ScrollView>
  );
}
