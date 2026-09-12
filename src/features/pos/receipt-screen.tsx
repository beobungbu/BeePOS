import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonLabel, Text, useToast } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { calcChange } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import type { Payment } from '../../domain/types';
import { useT } from '../../i18n';
import { useActiveCart } from '../../data/cart-store';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { METHOD_LABEL_KEY } from './components/payment-method-cards';
import { SecondaryButtonLabel } from './components/secondary-button-label';
import { usePosLayout } from './hooks/use-pos-layout';
import { orderLabel } from './lib/order-label';

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
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const nextCart = useActiveCart();

  // The receipt names itself in the app header: the order code over the store and the time.
  useScreenHeader({
    title: order?.code ?? t('pos.receipt.title'),
    subtitle: order ? new Date(order.createdAt).toLocaleString('vi-VN') : undefined,
    backTo: '/pos',
  });

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-body text-muted-foreground">{t('pos.receipt.notFound')}</Text>
      </View>
    );
  }

  const customer = customers.find((item) => item.id === order.customerId);
  const totalChange = order.payments.reduce((accumulator, payment) => {
    const tendered = tenderedFromRef(payment.ref);
    return tendered !== undefined ? accumulator + calcChange(payment.amount, tendered) : accumulator;
  }, 0);

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 12, alignItems: 'center' }}
      >
        <View className="w-full max-w-[480px] gap-3">
          <View className="items-center gap-1 rounded-lg bg-success/10 px-4 py-5">
            <Text className="text-label font-semibold text-success">{t('pos.receipt.successTitle')}</Text>
            <Text className="text-title font-bold tabular-nums text-success">{formatVND(order.total)}</Text>
            {totalChange > 0 ? (
              <Text className="text-label text-muted-foreground">
                {`${t('pos.receipt.change')}: ${formatVND(totalChange)}`}
              </Text>
            ) : null}
          </View>

          <View className="gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="items-center gap-0.5">
              <Text className="text-body font-semibold text-foreground">
                {store?.name ?? t('pos.receipt.title')}
              </Text>
              <Text className="text-caption text-muted-foreground">{store?.address}</Text>
            </View>

            <View className="h-px bg-border" />

            <ReceiptRow label={t('pos.receipt.orderCode')} value={order.code} />
            <ReceiptRow
              label={t('pos.receipt.date')}
              value={new Date(order.createdAt).toLocaleString('vi-VN')}
            />
            <ReceiptRow label={t('pos.receipt.cashier')} value={staff?.name ?? order.cashierId} />
            <ReceiptRow
              label={t('pos.receipt.customer')}
              value={customer?.name ?? t('pos.cart.customerDefault')}
            />

            <View className="h-px bg-border" />

            {order.lines.map((line) => {
              const product = products.find((item) => item.id === line.productId);
              return (
                <View key={line.productId} className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-label text-foreground" numberOfLines={2}>
                      {product?.name ?? line.productId}
                    </Text>
                    <Text className="text-caption tabular-nums text-muted-foreground">
                      {`${line.qty} x ${formatVND(line.unitPrice)}`}
                    </Text>
                  </View>
                  <Text className="text-label tabular-nums text-foreground">
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
              <Text className="text-label text-muted-foreground">{t('pos.cart.grandTotal')}</Text>
              <Text className="text-heading font-bold tabular-nums text-foreground">
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

            <Text className="pt-1 text-center text-caption text-subtle-foreground">
              {t('pos.receipt.footer')}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => toast.show({ title: t('pos.receipt.printedToast'), variant: 'success' })}
            >
              <SecondaryButtonLabel>{t('pos.receipt.print')}</SecondaryButtonLabel>
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onPress={() => toast.show({ title: t('pos.receipt.sharedToast'), variant: 'success' })}
            >
              <SecondaryButtonLabel>{t('pos.receipt.share')}</SecondaryButtonLabel>
            </Button>
          </View>

          <Button className="min-h-[52px]" onPress={() => router.replace('/pos')}>
            <ButtonLabel>
              {`${t('pos.receipt.continueTo')} · ${orderLabel(t, nextCart.ordinal)}`}
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
      <Text className="text-label text-muted-foreground">{label}</Text>
      <Text className="text-label tabular-nums text-foreground">{value}</Text>
    </View>
  );
}
