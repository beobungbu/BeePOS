import { HStack, Stat, StatLabel, StatValue } from '@beemvp/beeui-ui';
import type { OrderStats } from '../../../domain/orders';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';

export function OrderStatsStrip({ stats }: { stats: OrderStats }) {
  const t = useT();
  return (
    <HStack className="flex-wrap gap-3">
      <Stat className="min-w-40 flex-1">
        <StatLabel>{t('orders.stats.orders')}</StatLabel>
        <StatValue>{stats.orderCount}</StatValue>
      </Stat>
      <Stat className="min-w-40 flex-1">
        <StatLabel>{t('orders.stats.revenue')}</StatLabel>
        <StatValue>{formatVND(stats.revenue)}</StatValue>
      </Stat>
      <Stat className="min-w-40 flex-1">
        <StatLabel>{t('orders.stats.refunds')}</StatLabel>
        <StatValue>{formatVND(stats.refundAmount)}</StatValue>
      </Stat>
    </HStack>
  );
}
