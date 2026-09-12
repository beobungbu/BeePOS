import { Button, ButtonLabel, SafeArea, Screen, Stack, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { ScrollView } from 'react-native';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { PeriodFilter } from './components/period-filter';
import { StatCards } from './components/stat-cards';
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
  const tableLayout = isWide ? 'scroll' : 'stacked';

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
          <VStack gap="lg" className={GUTTER[breakpoint]}>
            <VStack gap="xs">
              <Text variant="title">{t('reports.title')}</Text>
              <Text variant="caption" tone="muted">{t('reports.subtitle')}</Text>
            </VStack>

            <Stack direction={isWide ? 'horizontal' : 'vertical'} gap="md" wrap justify="between" align="start">
              <PeriodFilter filters={filters} stores={data.stores} />
              <Button variant="outline" size="sm" onPress={handleExport} accessibilityLabel={t('reports.export.button')}>
                <ButtonLabel>{t('reports.export.button')}</ButtonLabel>
              </Button>
            </Stack>

            <StatCards stats={data.stats} />

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
