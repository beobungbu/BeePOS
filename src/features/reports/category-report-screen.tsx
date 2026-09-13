import { useMemo } from 'react';
import { Section, Text, VStack } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useCatalogStore } from '../../data/catalog-store';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { HorizontalBars } from './components/horizontal-bars';
import { ReportsFrame } from './components/reports-frame';
import { revenueByCategory } from './lib/report-analytics';
import { percentLabel } from './lib/format';
import { useReportFilters, useReportPeriod } from './use-report-filters';

/** Revenue split by category: what the money is actually coming from. */
export function CategoryReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const period = useReportPeriod(filters);
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.cut.revenueByCategory') });

  const rows = useMemo(
    () => revenueByCategory(period.orders, products, categories, t('reports.column.other')),
    // `t` is a new closure per render; the locale it is bound to changes with the store, which
    // re-renders this screen anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period.orders, products, categories],
  );

  return (
    <ReportsFrame tab="category" filters={filters}>
      <Section title={t('reports.cut.revenueByCategory')}>
        {rows.length === 0 ? (
          <Text tone="muted">{t('reports.empty.noData')}</Text>
        ) : (
          <VStack gap="sm">
            <HorizontalBars
              labelWidth={150}
              rows={rows.map((row) => ({
                key: row.categoryId,
                label: row.name,
                value: row.revenue,
                valueText: formatVND(row.revenue),
                trailingText: percentLabel(row.sharePercent),
              }))}
            />
            <Text variant="caption" tone="muted">
              {t('reports.note.categorySum')}
            </Text>
          </VStack>
        )}
      </Section>
    </ReportsFrame>
  );
}
