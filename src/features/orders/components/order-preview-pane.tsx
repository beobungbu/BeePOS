import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text } from '@beemvp/beeui-ui';
import type { Customer, Order, Staff } from '../../../domain/types';
import { useCatalogStore } from '../../../data/catalog-store';
import { useT } from '../../../i18n';
// The preview shows the customer's loyalty tier, a string owned by the customers dictionary.
import '../../../i18n/customers.vi';
import '../../../i18n/customers.en';
import { AppIcon } from '../../../components/icons';
import { formatDateTime } from '../../../lib/datetime';
import { useOrderActions } from '../hooks/use-order-actions';
import { OrderLinesList } from './order-lines-list';
import { OrderStatusBadge } from './order-status-badge';
import { OrderTimeline } from './order-timeline';
import { OrderTotals } from './order-totals';
import { RefundDialog } from './refund-dialog';

/**
 * The 320 pt desktop preview of `docs/design/mockups/orders.html`: header, customer, lines
 * with thumbnails, totals, history, and the two actions a manager reaches for from a list.
 * It is the reason a desktop row selects instead of navigating; the header still links to the
 * full detail route.
 */
export function OrderPreviewPane({
  order,
  customer,
  cashier,
  staffName,
}: {
  order: Order | undefined;
  customer: Customer | undefined;
  cashier: Staff | undefined;
  /** Fallback when the cashier id resolves to nobody in the seed staff list. */
  staffName: string;
}) {
  const t = useT();
  const router = useRouter();
  const products = useCatalogStore((state) => state.products);
  const actions = useOrderActions(order);
  const [refundOpen, setRefundOpen] = useState(false);

  if (!order) {
    return (
      <View className="w-80 border-l border-border bg-surface p-6">
        <View className="items-center gap-2 pt-8">
          <AppIcon name="receipt-text" size={40} tone="subtle-foreground" />
          <Text variant="body" className="text-center font-semibold text-foreground">{t('orders.preview.empty')}</Text>
          <Text variant="label" className="font-normal text-center text-muted-foreground">{t('orders.preview.emptyHint')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="w-80 border-l border-border bg-surface">
      {/* The code takes the full pane width: at the heading step it no longer fits beside a
          long status badge, so the badge sits on its own row under the meta line. */}
      <View className="gap-2 border-b border-border px-5 py-4">
        <View className="min-w-0">
          <Text variant="heading" className="font-semibold text-foreground" numberOfLines={1}>
            {order.code}
          </Text>
          <Text variant="caption" className="text-muted-foreground" numberOfLines={2}>
            {`${formatDateTime(order.createdAt)} · ${cashier?.name ?? staffName}`}
          </Text>
        </View>
        <View className="flex-row">
          <OrderStatusBadge status={order.status} />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 py-4">
        <View className="flex-row items-center gap-2.5">
          <AppIcon name="users-round" size={20} tone="muted-foreground" />
          <View className="min-w-0 flex-1">
            <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
              {customer?.name ?? t('orders.table.noCustomer')}
            </Text>
            {customer ? (
              <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                {`${customer.phone} · ${t(`customers.tier.${customer.tier}`)}`}
              </Text>
            ) : null}
          </View>
        </View>

        <OrderLinesList lines={order.lines} products={products} />
        <OrderTotals compact order={order} />
        <OrderTimeline cashierName={cashier?.name ?? staffName} order={order} refunds={actions.refunds} />

        <Button onPress={() => router.push(`/orders/${order.id}`)} variant="ghost">
          {t('orders.preview.open')}
        </Button>
      </ScrollView>

      <View className="flex-row gap-2.5 border-t border-border px-5 py-4">
        <Button className="flex-1" onPress={actions.reprint} variant="outline">
          {t('orders.actions.reprint')}
        </Button>
        <Button
          className="flex-1 border-destructive"
          disabled={!actions.canRefund}
          labelClassName="text-destructive"
          onPress={() => setRefundOpen(true)}
          variant="outline"
        >
          {t('orders.actions.refund')}
        </Button>
      </View>

      <RefundDialog
        onConfirm={actions.refund}
        onOpenChange={setRefundOpen}
        open={refundOpen}
        order={order}
        priorRefunds={actions.refunds}
        products={products}
      />
    </View>
  );
}
