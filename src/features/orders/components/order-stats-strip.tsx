import { View } from 'react-native';
import { Stat, StatLabel, StatValue, Text } from '@beemvp/beeui-ui';
import type { OrderStats } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import type { Breakpoint } from '../../../hooks/use-breakpoint';
import { StatStrip } from '../../../components/stat-strip';
import { averageOrderValue } from '../lib/order-presentation';

/** The heading step (18 / 24) as the arbitrary-value utility BeeUI emits for its own variants. */
const STAT_VALUE_CLASS =
  'text-[length:var(--text-title)] leading-[var(--text-title--line-height)] font-bold';

/**
 * The mockup's stat row: three compact figures in one strip on phone, four Stat cards from
 * tablet up (`docs/design/mockups/orders.html`). Money is tabular so the columns line up
 * with the table underneath.
 */
export function OrderStatsStrip({ stats, breakpoint }: { stats: OrderStats; breakpoint: Breakpoint }) {
  const t = useT();
  const average = formatVND(averageOrderValue(stats));

  if (breakpoint === 'phone') {
    return (
      <View className="flex-row gap-2 border-b border-border bg-surface px-4 py-3">
        <CompactStat label={t('orders.stats.ordersShort')} value={String(stats.orderCount)} />
        <CompactStat label={t('orders.stats.revenue')} value={formatVND(stats.revenue)} />
        <CompactStat label={t('orders.stats.averageShort')} value={average} />
      </View>
    );
  }

  // Desktop drops the cards for the 64 pt strip: four bordered boxes cost 96 pt plus gaps
  // and say nothing the four figures do not (phase 4, decision 4).
  if (breakpoint === 'desktop') {
    return (
      <StatStrip
        items={[
          { label: t('orders.stats.orders'), value: String(stats.orderCount) },
          { label: t('orders.stats.revenue'), value: formatVND(stats.revenue) },
          { label: t('orders.stats.average'), value: average },
          { label: t('orders.stats.refundCount'), value: String(stats.refundCount) },
        ]}
      />
    );
  }

  // Four cards fit one row at desktop; at tablet they wrap to 2 x 2 rather than clipping a
  // revenue figure that needs the full width of its card.
  // Class names are whole literals so the Uniwind extractor can see them in the source.
  // StatValue takes no variant prop, so the heading step is written the way BeeUI writes it
  // internally: the named utility generates no CSS in this toolchain.
  const cardClass = 'min-w-64 flex-1 rounded-lg border border-border bg-surface p-3.5';

  return (
    <View className="flex-row flex-wrap gap-3">
      <Stat className={cardClass}>
        <StatLabel>{t('orders.stats.orders')}</StatLabel>
        <StatValue className={STAT_VALUE_CLASS} numberOfLines={1} numeric="tabular">{stats.orderCount}</StatValue>
      </Stat>
      <Stat className={cardClass}>
        <StatLabel>{t('orders.stats.revenue')}</StatLabel>
        <StatValue className={STAT_VALUE_CLASS} numberOfLines={1} numeric="tabular">{formatVND(stats.revenue)}</StatValue>
      </Stat>
      <Stat className={cardClass}>
        <StatLabel>{t('orders.stats.average')}</StatLabel>
        <StatValue className={STAT_VALUE_CLASS} numberOfLines={1} numeric="tabular">{average}</StatValue>
      </Stat>
      <Stat className={cardClass}>
        <StatLabel>{t('orders.stats.refundCount')}</StatLabel>
        <StatValue className={STAT_VALUE_CLASS} numberOfLines={1} numeric="tabular">{stats.refundCount}</StatValue>
      </Stat>
    </View>
  );
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 gap-0.5">
      <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="body" className="font-bold text-foreground" numberOfLines={1} numeric="tabular">
        {value}
      </Text>
    </View>
  );
}
