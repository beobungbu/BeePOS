import { View } from 'react-native';
import { HStack, Text, useBeeToken, VStack } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import { useT } from '../../../i18n';
import type { HourRevenue } from '../lib/report-analytics';

const CHART_HEIGHT = 150;

/**
 * One column per trading hour, height as a percentage of the busiest one, peak in `primary`
 * and the rest in `series-1` (`docs/design/specs/commerce.md` section G). A `View` per column,
 * no chart library, so it renders the same on native.
 */
export function HourColumns({ hours }: { hours: HourRevenue[] }) {
  const t = useT();
  const seriesColor = String(useBeeToken('chart.series-1'));
  const primaryColor = String(useBeeToken('colors.primary'));
  const max = Math.max(1, ...hours.map((hour) => hour.revenue));

  if (hours.length === 0) return <Text tone="muted">{t('reports.empty.noData')}</Text>;

  return (
    <HStack gap="xs" align="end" className="w-full overflow-x-auto" style={{ height: CHART_HEIGHT + 32 }}>
      {hours.map((hour) => {
        const label = t('reports.hour.label').replace('{hour}', String(hour.hour).padStart(2, '0'));
        const height = Math.max(2, Math.round((hour.revenue / max) * CHART_HEIGHT));
        return (
          <VStack key={hour.hour} gap="xs" align="center" className="min-w-8 flex-1">
            <View
              accessible
              accessibilityLabel={`${label}: ${formatVND(hour.revenue)}`}
              className="w-full justify-end"
              style={{ height: CHART_HEIGHT }}
            >
              <View
                className="w-full rounded-t"
                style={{ height, backgroundColor: hour.isPeak ? primaryColor : seriesColor }}
              />
            </View>
            <Text variant="caption" tone="muted" numeric="tabular">
              {String(hour.hour).padStart(2, '0')}
            </Text>
          </VStack>
        );
      })}
    </HStack>
  );
}
