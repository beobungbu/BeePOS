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
import { StatStrip, type StatStripItem } from '../../components/stat-strip';
import { useCatalogStore } from '../../data/catalog-store';
import { useCostingStore } from '../../data/costing-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { HorizontalBars } from './components/horizontal-bars';
import { ReportsFrame } from './components/reports-frame';
import {
  skusInStock,
  slowMovingValue,
  valuationByStore,
  valuationSeries,
} from './lib/report-analytics';
import { percentLabel } from './lib/format';
import { useReportFilters } from './use-report-filters';

/** Weekly points in the series; six bars is a quarter and still readable at 375. */
const WEEKS = 5;
/** The comparison the table makes, in days. */
const LOOKBACK_DAYS = 30;

/**
 * What the shelves are worth, at average cost, now and over the last weeks.
 *
 * Not filtered by the report period on purpose: stock value is a position, not a flow, and
 * asking "what was it worth during last Tuesday" is a different question from the one the
 * period filter asks. The branch filter still applies, because a branch's stock is its own.
 */
export function ValuationReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';

  const levels = useInventoryStore((state) => state.stockLevels);
  const products = useCatalogStore((state) => state.products);
  const history = useCostingStore((state) => state.history);
  const stores = useOrgStore((state) => state.stores);
  const orders = useOrderStore((state) => state.orders);

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.cut.valuationSeries') });

  const data = useMemo(() => {
    const now = new Date();
    const storeId = filters.storeId ?? undefined;
    const series = valuationSeries(levels, products, history, now, WEEKS, storeId);
    const byStore = valuationByStore(
      levels,
      products,
      history,
      storeId ? stores.filter((store) => store.id === storeId) : stores,
      now,
      LOOKBACK_DAYS,
    );
    const current = byStore.reduce((total, row) => total + row.current, 0);
    const previous = byStore.reduce((total, row) => total + row.previous, 0);
    return {
      series,
      byStore,
      current,
      previous,
      change: current - previous,
      changePercent: previous === 0 ? 0 : Math.round(((current - previous) / previous) * 1000) / 10,
      skus: skusInStock(levels, storeId),
      slowMoving: slowMovingValue(levels, products, history, orders, now, 60, storeId),
    };
  }, [levels, products, history, stores, orders, filters.storeId]);

  const stats: StatStripItem[] = [
    { label: t('reports.figure.current'), value: formatVND(data.current) },
    { label: t('reports.figure.previous'), value: formatVND(data.previous) },
    {
      label: t('reports.figure.change'),
      value: formatVND(data.change),
      tone: data.change >= 0 ? 'success' : 'destructive',
    },
    {
      label: t('reports.figure.changeRate'),
      value: percentLabel(data.changePercent),
      tone: data.change >= 0 ? 'success' : 'destructive',
    },
    { label: t('reports.figure.skus'), value: String(data.skus) },
    { label: t('reports.figure.slowMoving'), value: formatVND(data.slowMoving), tone: 'warning' },
  ];

  return (
    <ReportsFrame tab="valuation" filters={filters}>
      <StatStrip items={stats} layout={breakpoint === 'desktop' ? 'row' : 'stacked'} />

      <Section title={t('reports.cut.valuationSeries')}>
        <VStack gap="sm">
          <HorizontalBars
            labelWidth={72}
            rows={data.series.map((point) => ({
              key: point.date,
              label: shortDate(point.date),
              value: point.value,
              valueText: formatVND(point.value),
              highlight: point.isCurrent,
            }))}
          />
          <Text variant="caption" tone="muted">
            {t('reports.note.valuationMethod')}
          </Text>
          <Text variant="caption" tone="muted">
            {t('reports.note.valuationStock')}
          </Text>
        </VStack>
      </Section>

      <Section title={t('reports.cut.valuationByStore')}>
        <VStack gap="sm">
          <Table layout={isWide ? 'scroll' : 'stacked'}>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.table.store')}</TableHead>
                <TableHead className="items-end text-right">{t('reports.column.current')}</TableHead>
                <TableHead className="items-end text-right">{t('reports.column.previous')}</TableHead>
                <TableHead className="items-end text-right">{t('reports.column.change')}</TableHead>
                <TableHead className="items-end text-right">{t('reports.column.rate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byStore.map((row) => (
                <TableRow key={row.storeId} className="min-h-12">
                  <TableCell label={t('reports.table.store')}>
                    {/* Wrapped: two `Text` children of a cell lay out side by side, and the
                        code has to sit over the branch name, not run into it. */}
                    <View className="min-w-0">
                      <Text variant="label" className="font-semibold">
                        {row.storeCode}
                      </Text>
                      <Text variant="caption" tone="muted" numberOfLines={1}>
                        {row.storeName}
                      </Text>
                    </View>
                  </TableCell>
                  <TableCell label={t('reports.column.current')} className="items-end text-right">
                    <Text variant="label" numeric="tabular" className="font-bold">
                      {formatVND(row.current)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.column.previous')} className="items-end text-right">
                    <Text variant="label" numeric="tabular" tone="muted">
                      {formatVND(row.previous)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.column.change')} className="items-end text-right">
                    <Text
                      variant="label"
                      numeric="tabular"
                      className={row.change >= 0 ? 'text-success' : 'text-destructive'}
                    >
                      {formatVND(row.change)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.column.rate')} className="items-end text-right">
                    <Text
                      variant="label"
                      numeric="tabular"
                      className={row.change >= 0 ? 'text-success' : 'text-destructive'}
                    >
                      {percentLabel(row.changePercent)}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="min-h-12 bg-muted">
                <TableCell label={t('reports.table.store')}>
                  <Text variant="label" className="font-bold">
                    {t('reports.column.total')}
                  </Text>
                </TableCell>
                <TableCell label={t('reports.column.current')} className="items-end text-right">
                  <Text variant="label" numeric="tabular" className="font-bold">
                    {formatVND(data.current)}
                  </Text>
                </TableCell>
                <TableCell label={t('reports.column.previous')} className="items-end text-right">
                  <Text variant="label" numeric="tabular" className="font-bold">
                    {formatVND(data.previous)}
                  </Text>
                </TableCell>
                <TableCell label={t('reports.column.change')} className="items-end text-right">
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={data.change >= 0 ? 'font-bold text-success' : 'font-bold text-destructive'}
                  >
                    {formatVND(data.change)}
                  </Text>
                </TableCell>
                <TableCell label={t('reports.column.rate')} className="items-end text-right">
                  <Text
                    variant="label"
                    numeric="tabular"
                    className={data.change >= 0 ? 'font-bold text-success' : 'font-bold text-destructive'}
                  >
                    {percentLabel(data.changePercent)}
                  </Text>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Text variant="caption" tone="muted">
            {t('reports.note.valuationIncrease')}
          </Text>
          <Text variant="caption" tone="muted">
            {t('reports.note.slowMoving')}
          </Text>
        </VStack>
      </Section>
    </ReportsFrame>
  );
}

/** `2026-08-13` as `13/08`: the bar labels have 72 pt and the year never differs here. */
function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}
