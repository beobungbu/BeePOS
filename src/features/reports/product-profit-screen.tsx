import { useMemo } from 'react';
import { View } from 'react-native';
import {
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useCatalogStore } from '../../data/catalog-store';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { StatStrip, type StatStripItem } from '../../components/stat-strip';
// The rows come from the money feature so the profit on this report and the profit on the
// money screens are the same arithmetic, read off the cost snapshot each line carries.
import { grossProfitTotals, productGrossProfit } from '../money/lib/gross-profit';
import { ReportsFrame } from './components/reports-frame';
import { revenueOrders } from './lib/report-analytics';
import { percentLabel } from './lib/format';
import { useReportFilters, useReportPeriod } from './use-report-filters';

/** Rows the table lists; the rest are reached by narrowing the period or the branch. */
const ROW_LIMIT = 20;

/**
 * Gross profit per product from the cost snapshot each order line stored at the time of sale.
 * The top seller and the top earner are rarely the same row, which is the point of the cut.
 */
export function ProductProfitScreen() {
  const t = useT();
  const filters = useReportFilters();
  const period = useReportPeriod(filters);
  const products = useCatalogStore((state) => state.products);
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop';

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.cut.productProfit') });

  const { rows, totals } = useMemo(() => {
    const productById = new Map(products.map((product) => [product.id, product]));
    const computed = productGrossProfit(revenueOrders(period.orders));
    return {
      // Totals are of every row, not of the twenty shown, so the strip still adds up.
      totals: grossProfitTotals(computed),
      rows: computed.slice(0, ROW_LIMIT).map((row) => ({
        ...row,
        name: productById.get(row.productId)?.name ?? row.productId,
        sku: productById.get(row.productId)?.sku ?? '',
      })),
    };
  }, [period.orders, products]);

  const stats: StatStripItem[] = [
    { label: t('reports.stat.revenue'), value: formatVND(totals.revenue) },
    { label: t('reports.figure.cogs'), value: formatVND(totals.cogs) },
    { label: t('reports.stat.grossProfit'), value: formatVND(totals.profit), tone: 'success' },
    { label: t('reports.figure.margin'), value: percentLabel(totals.marginPercent) },
  ];

  return (
    <ReportsFrame tab="products" filters={filters}>
      <StatStrip items={stats} layout={isDesktop ? 'row' : 'stacked'} />
      <Section title={t('reports.cut.productProfit')}>
        {rows.length === 0 ? (
          <Text tone="muted">{t('reports.empty.noData')}</Text>
        ) : (
          <VStack gap="sm">
            <Table layout={isDesktop || breakpoint === 'tablet' ? 'scroll' : 'stacked'}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.table.product')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.table.qty')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.table.revenue')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.column.profit')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.column.margin')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.productId} className="min-h-12">
                    <TableCell label={t('reports.table.product')}>
                      {/* Wrapped: two `Text` children of a cell lay out side by side. */}
                      <View className="min-w-0">
                        <Text variant="label" className="font-semibold" numberOfLines={2}>
                          {row.name}
                        </Text>
                        <Text variant="caption" tone="muted" numeric="tabular">
                          {`${row.sku} · ${t('reports.figure.cogs')} ${formatVND(row.cogs)}`}
                        </Text>
                      </View>
                    </TableCell>
                    <TableCell label={t('reports.table.qty')} className="items-end text-right">
                      <Text variant="label" numeric="tabular">
                        {String(row.qty)}
                      </Text>
                    </TableCell>
                    <TableCell label={t('reports.table.revenue')} className="items-end text-right">
                      <Text variant="label" numeric="tabular">
                        {formatVND(row.revenue)}
                      </Text>
                    </TableCell>
                    <TableCell label={t('reports.column.profit')} className="items-end text-right">
                      <Text
                        variant="label"
                        numeric="tabular"
                        className={row.profit >= 0 ? 'font-bold text-success' : 'font-bold text-destructive'}
                      >
                        {formatVND(row.profit)}
                      </Text>
                    </TableCell>
                    <TableCell label={t('reports.column.margin')} className="items-end text-right">
                      <Text variant="label" tone="muted" numeric="tabular">
                        {percentLabel(row.marginPercent)}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Text variant="caption" tone="muted">
              {t('reports.note.profitSnapshot')}
            </Text>
          </VStack>
        )}
      </Section>
    </ReportsFrame>
  );
}
