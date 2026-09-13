import { StatStrip, type StatStripItem } from '../../../components/stat-strip';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { useReportData } from '../use-report-filters';

interface ReportStatsProps {
  stats: ReturnType<typeof useReportData>['stats'];
  /** Desktop puts the five figures on one row; narrower widths keep one figure per row. */
  layout: 'row' | 'stacked';
}

/**
 * The five headline figures of `/reports`, on the same strip the list screens use (owner
 * decision of 2026-09-13, replacing the card row of phase 4 decision 4). The delta the cards
 * carried survives as a line under the value, signed and worded rather than an arrow glyph, so
 * it still reads on a screen reader and in monochrome.
 */
export function ReportStats({ stats, layout }: ReportStatsProps) {
  const t = useT();
  const vsPrevious = t('reports.stat.vsPrevious');

  const delta = (value: number): StatStripItem['delta'] => ({
    text: `${value >= 0 ? '+' : '-'}${Math.abs(value)}% ${vsPrevious}`,
    tone: value >= 0 ? 'success' : 'destructive',
  });

  const items: StatStripItem[] = [
    { label: t('reports.stat.revenue'), value: formatVND(stats.revenue.value), delta: delta(stats.revenue.delta) },
    { label: t('reports.stat.orders'), value: String(stats.orders.value), delta: delta(stats.orders.delta) },
    { label: t('reports.stat.avgBasket'), value: formatVND(stats.avgBasket.value), delta: delta(stats.avgBasket.delta) },
    { label: t('reports.stat.grossProfit'), value: formatVND(stats.grossProfit.value), delta: delta(stats.grossProfit.delta) },
    { label: t('reports.stat.refunds'), value: formatVND(stats.refunds.value), delta: delta(stats.refunds.delta) },
  ];

  return <StatStrip items={items} layout={layout} />;
}
