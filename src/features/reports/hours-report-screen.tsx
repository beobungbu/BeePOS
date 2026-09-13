import { useMemo } from 'react';
import { Section, Text, VStack } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { HourColumns } from './components/hour-columns';
import { ReportsFrame } from './components/reports-frame';
import { revenueByHour } from './lib/report-analytics';
import { useReportFilters, useReportPeriod } from './use-report-filters';

/** Revenue by hour of the day: when to put the second person on the till. */
export function HoursReportScreen() {
  const t = useT();
  const filters = useReportFilters();
  const period = useReportPeriod(filters);

  useScreenHeader({ title: t('reports.title'), subtitle: t('reports.cut.revenueByHour') });

  const hours = useMemo(() => revenueByHour(period.orders), [period.orders]);
  const peak = hours.find((hour) => hour.isPeak);

  return (
    <ReportsFrame tab="hours" filters={filters}>
      <Section title={t('reports.cut.revenueByHour')}>
        <VStack gap="sm">
          <HourColumns hours={hours} />
          {peak ? (
            <Text variant="caption" tone="muted">
              {t('reports.hour.peak')
                .replace('{hour}', String(peak.hour).padStart(2, '0'))
                .replace('{amount}', formatVND(peak.revenue))}
            </Text>
          ) : null}
          <Text variant="caption" tone="muted">
            {t('reports.note.hourBars')}
          </Text>
        </VStack>
      </Section>
    </ReportsFrame>
  );
}
