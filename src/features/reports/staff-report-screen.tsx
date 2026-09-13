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
import { useOrgStore } from '../../data/org-store';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { ReportsFrame } from './components/reports-frame';
import { salesByRep } from './lib/report-analytics';
import { percentLabel } from './lib/format';
import { useReportFilters, useReportPeriod } from './use-report-filters';

/**
 * Sales per person: the rep named on a wholesale order, the cashier on a counter sale. The
 * total row is there so the figures can be checked against the overview cut by hand.
 */
export function StaffReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const period = useReportPeriod(filters);
  const staff = useOrgStore((state) => state.staff);
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.cut.salesByRep') });

  const rows = useMemo(() => salesByRep(period.orders, staff), [period.orders, staff]);
  const totals = rows.reduce(
    (sum, row) => ({
      orders: sum.orders + row.orders,
      revenue: sum.revenue + row.revenue,
      profit: sum.profit + row.profit,
    }),
    { orders: 0, revenue: 0, profit: 0 },
  );

  return (
    <ReportsFrame tab="staff" filters={filters}>
      <Section title={t('reports.cut.salesByRep')}>
        {rows.length === 0 ? (
          <Text tone="muted">{t('reports.empty.noData')}</Text>
        ) : (
          <VStack gap="sm">
            <Table layout={isWide ? 'scroll' : 'stacked'}>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.column.staff')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.table.orders')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.table.revenue')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.column.profit')}</TableHead>
                  <TableHead className="items-end text-right">{t('reports.column.margin')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.staffId} className="min-h-12">
                    <TableCell label={t('reports.column.staff')}>
                      {/* Wrapped: two `Text` children of a cell lay out side by side. */}
                      <View className="min-w-0">
                        <Text variant="label" className="font-semibold" numberOfLines={1}>
                          {row.name}
                        </Text>
                        <Text variant="caption" tone="muted" numeric="tabular">
                          {`${t('reports.table.orders')} ${row.orders} · ${t('reports.column.wholesale')} ${row.wholesaleOrders}`}
                        </Text>
                      </View>
                    </TableCell>
                    <TableCell label={t('reports.table.orders')} className="items-end text-right">
                      <Text variant="label" numeric="tabular">
                        {String(row.orders)}
                      </Text>
                    </TableCell>
                    <TableCell label={t('reports.table.revenue')} className="items-end text-right">
                      <Text variant="label" numeric="tabular" className="font-bold">
                        {formatVND(row.revenue)}
                      </Text>
                    </TableCell>
                    <TableCell label={t('reports.column.profit')} className="items-end text-right">
                      <Text variant="label" numeric="tabular" className="text-success">
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
                <TableRow className="min-h-12 bg-muted">
                  <TableCell label={t('reports.column.staff')}>
                    <Text variant="label" className="font-bold">
                      {t('reports.aging.total')}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.table.orders')} className="items-end text-right">
                    <Text variant="label" numeric="tabular" className="font-bold">
                      {String(totals.orders)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.table.revenue')} className="items-end text-right">
                    <Text variant="label" numeric="tabular" className="font-bold">
                      {formatVND(totals.revenue)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.column.profit')} className="items-end text-right">
                    <Text variant="label" numeric="tabular" className="font-bold text-success">
                      {formatVND(totals.profit)}
                    </Text>
                  </TableCell>
                  <TableCell label={t('reports.column.margin')} className="items-end text-right">
                    <Text variant="label" tone="muted" numeric="tabular">
                      {'-'}
                    </Text>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Text variant="caption" tone="muted">
              {t('reports.note.repCredit')}
            </Text>
          </VStack>
        )}
      </Section>
    </ReportsFrame>
  );
}
