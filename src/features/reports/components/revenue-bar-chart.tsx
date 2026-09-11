import { Box, HStack, Section, Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { DayRevenue } from '../../../domain/reports';

const CHART_HEIGHT = 140;

function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

interface RevenueBarChartProps {
  days: DayRevenue[];
}

/** Plain-View bar chart (no chart library): each bar's height is proportional to the max. */
export function RevenueBarChart({ days }: RevenueBarChartProps) {
  const t = useT();
  const maxRevenue = Math.max(1, ...days.map((day) => day.revenue));

  return (
    <Section title={t('reports.section.revenueByDay')}>
      {days.length === 0 ? (
        <Text tone="muted">{t('reports.empty.noData')}</Text>
      ) : (
        <HStack
          gap="xs"
          align="end"
          className="w-full overflow-x-auto"
          style={{ height: CHART_HEIGHT + 40 }}
        >
          {days.map((day) => {
            const barHeight = Math.max(2, Math.round((day.revenue / maxRevenue) * CHART_HEIGHT));
            const label = `${formatDayLabel(day.date)}: ${formatVND(day.revenue)}`;
            return (
              <VStack key={day.date} gap="xs" align="center" className="min-w-10 flex-1">
                <Box
                  accessible
                  accessibilityLabel={label}
                  className="w-full justify-end"
                  style={{ height: CHART_HEIGHT }}
                >
                  <Box className="w-full rounded-t bg-primary" style={{ height: barHeight }} />
                </Box>
                <Text variant="caption" tone="muted">
                  {formatDayLabel(day.date)}
                </Text>
              </VStack>
            );
          })}
        </HStack>
      )}
    </Section>
  );
}
