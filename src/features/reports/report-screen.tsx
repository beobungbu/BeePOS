import { Stack, VStack } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { ReportsFrame } from './components/reports-frame';
import { ReportStats } from './components/report-stats';
import { RevenueBarChart } from './components/revenue-bar-chart';
import { StoreRevenueTable } from './components/store-revenue-table';
import { TopProductsTable } from './components/top-products-table';
import { PaymentMixSection } from './components/payment-mix-section';
import { CashierTable } from './components/cashier-table';
import { useReportData, useReportFilters } from './use-report-filters';

/**
 * The overview cut: the five headline figures and the four sections that were the whole of
 * `/reports` before phase 7. The other six cuts are sibling routes sharing this screen's
 * period and branch filters through `ReportsFrame`.
 */
export function ReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const data = useReportData(filters);
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';
  const tableLayout = isWide ? 'scroll' : 'stacked';

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.subtitle') });

  return (
    <ReportsFrame tab="overview" filters={filters}>
      {/* One figure per row below 1280: five money values on one row leave "217.513.070 đ"
          wrapped onto two lines at 768 and unreadable at 375. */}
      <ReportStats stats={data.stats} layout={isDesktop ? 'row' : 'stacked'} />

      <Stack direction={isWide ? 'horizontal' : 'vertical'} gap="lg" wrap align="start">
        <VStack gap="lg" className={isWide ? 'min-w-80 flex-1' : ''}>
          <RevenueBarChart days={data.revenueByDay} />
          <StoreRevenueTable rows={data.revenueByStore} layout={tableLayout} />
          <CashierTable rows={data.cashierPerformance} layout={tableLayout} />
        </VStack>
        <VStack gap="lg" className={isWide ? 'min-w-80 flex-1' : ''}>
          <TopProductsTable rows={data.topProducts} layout={tableLayout} />
          <PaymentMixSection rows={data.paymentMix} />
        </VStack>
      </Stack>
    </ReportsFrame>
  );
}
