import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import type { Order } from '../../../domain/types';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

/**
 * The totals block of `docs/design/design-direction.md` section 5: label rows, a strong rule,
 * then `TỔNG CỘNG` muted against the amount at title size. Rows that would read `0 đ` (no
 * discount, no tax) are dropped instead of printing a zero the cashier has to parse.
 */
export function OrderTotals({ order, compact = false }: { order: Order; compact?: boolean }) {
  const t = useT();

  return (
    <View className="gap-1">
      <Row label={t('orders.detail.subtotal')} value={formatVND(order.subtotal)} />
      {order.discountTotal > 0 ? (
        <Row
          label={t('orders.detail.discount')}
          tone="text-success"
          value={`-${formatVND(order.discountTotal)}`}
        />
      ) : null}
      {order.taxTotal > 0 ? <Row label={t('orders.detail.tax')} value={formatVND(order.taxTotal)} /> : null}
      <View className="my-1 h-px bg-border-strong" />
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-label uppercase text-muted-foreground">{t('orders.detail.total')}</Text>
        <Text className={`font-bold text-foreground ${compact ? 'text-heading' : 'text-title'}`} numeric="tabular">
          {formatVND(order.total)}
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value, tone = 'text-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-label text-muted-foreground">{label}</Text>
      <Text className={`text-label font-semibold ${tone}`} numeric="tabular">
        {value}
      </Text>
    </View>
  );
}
