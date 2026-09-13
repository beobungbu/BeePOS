import { Button, ButtonLabel, SafeArea, Screen, Stack, useToast, VStack } from '@beemvp/beeui-ui';
import { ScrollView, View } from 'react-native';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { Toolbar } from '../../components/toolbar';
import { useT } from '../../i18n';
import { PeriodFilter } from './components/period-filter';
import { ReportStats } from './components/report-stats';
import { RevenueBarChart } from './components/revenue-bar-chart';
import { StoreRevenueTable } from './components/store-revenue-table';
import { TopProductsTable } from './components/top-products-table';
import { PaymentMixSection } from './components/payment-mix-section';
import { CashierTable } from './components/cashier-table';
import { useReportData, useReportFilters } from './use-report-filters';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function ReportScreen() {
  const t = useT();
  const toast = useToast();
  const filters = useReportFilters();
  const data = useReportData(filters);
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';
  const tableLayout = isWide ? 'scroll' : 'stacked';

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.subtitle') });

  function handleExport() {
    toast.show({
      title: t('reports.export.toastTitle'),
      description: t('reports.export.toastDescription'),
      variant: 'success',
    });
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        {/* `Screen` owns no scroll behaviour, so the report sections need one here. */}
        <ScrollView className="flex-1">
          {/* Desktop: period, store and export share the one 56 pt toolbar row under the
              header. The period and the store select collapse into the `Bộ lọc` popover when
              the row would otherwise wrap; export never leaves the row. */}
          {isDesktop ? (
            <View className="border-b border-border bg-surface px-6">
              <Toolbar
                activeFilterCount={
                  // Default state of `useReportFilters`: today, every store the staff may see.
                  (filters.periodKey === 'today' ? 0 : 1) + (filters.storeId ? 1 : 0)
                }
                actions={
                  <Button variant="outline" size="sm" onPress={handleExport} accessibilityLabel={t('reports.export.button')}>
                    {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the
                        variant, which is 1.2:1 on an outline button in dark
                        (docs/beeui-audit/findings-18-w-c.md). */}
                    <ButtonLabel className="text-foreground">{t('reports.export.button')}</ButtonLabel>
                  </Button>
                }
              >
                <PeriodFilter filters={filters} stores={data.stores} inline />
              </Toolbar>
            </View>
          ) : null}
          <VStack gap="lg" className={GUTTER[breakpoint]}>
            {isDesktop ? null : (
              <Stack direction={isWide ? 'horizontal' : 'vertical'} gap="md" wrap justify="between" align="start">
                <PeriodFilter filters={filters} stores={data.stores} />
                <Button variant="outline" size="sm" onPress={handleExport} accessibilityLabel={t('reports.export.button')}>
                  <ButtonLabel className="text-foreground">{t('reports.export.button')}</ButtonLabel>
                </Button>
              </Stack>
            )}

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
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
