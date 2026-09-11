import { Badge, HStack, Stat, StatHelpText, StatLabel, StatValue } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { useReportData } from '../use-report-filters';

interface StatCardsProps {
  stats: ReturnType<typeof useReportData>['stats'];
}

function DeltaBadge({ delta }: { delta: number }) {
  const t = useT();
  const isUp = delta >= 0;
  return (
    <HStack gap="xs" align="center">
      <Badge variant={isUp ? 'success' : 'destructive'}>{`${isUp ? '▲' : '▼'} ${Math.abs(delta)}%`}</Badge>
      <StatHelpText>{t('reports.stat.vsPrevious')}</StatHelpText>
    </HStack>
  );
}

export function StatCards({ stats }: StatCardsProps) {
  const t = useT();

  const items = [
    { key: 'revenue', label: t('reports.stat.revenue'), value: formatVND(stats.revenue.value), delta: stats.revenue.delta },
    { key: 'orders', label: t('reports.stat.orders'), value: String(stats.orders.value), delta: stats.orders.delta },
    { key: 'avgBasket', label: t('reports.stat.avgBasket'), value: formatVND(stats.avgBasket.value), delta: stats.avgBasket.delta },
    { key: 'grossProfit', label: t('reports.stat.grossProfit'), value: formatVND(stats.grossProfit.value), delta: stats.grossProfit.delta },
    { key: 'refunds', label: t('reports.stat.refunds'), value: formatVND(stats.refunds.value), delta: stats.refunds.delta },
  ];

  return (
    <HStack gap="md" wrap>
      {items.map((item) => (
        <Stat key={item.key} className="min-w-40 flex-1 gap-1 rounded-lg border border-border bg-card p-4">
          <StatLabel>{item.label}</StatLabel>
          <StatValue className="text-2xl font-semibold text-foreground">{item.value}</StatValue>
          <DeltaBadge delta={item.delta} />
        </Stat>
      ))}
    </HStack>
  );
}
