import { View } from 'react-native';
import { Text, useBeeToken } from '@beemvp/beeui-ui';

export interface BarRow {
  key: string;
  label: string;
  value: number;
  /** Money or count, already formatted; the bar only needs `value` for its width. */
  valueText: string;
  /** Optional third column, e.g. the share percentage. */
  trailingText?: string;
  /** Drawn in `primary` instead of the series colour: the current point of a time series. */
  highlight?: boolean;
}

/**
 * Horizontal bars with no chart library: each fill is a `View` whose width is a percentage of
 * the largest row (`docs/design/specs/commerce.md` section G). Light enough for native, and
 * every row carries its own number so the chart is readable without reading the bars.
 */
export function HorizontalBars({ rows, labelWidth = 120 }: { rows: BarRow[]; labelWidth?: number }) {
  const seriesColor = String(useBeeToken('chart.series-1'));
  const primaryColor = String(useBeeToken('colors.primary'));
  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));

  return (
    <View className="gap-2">
      {rows.map((row) => (
        <View className="min-h-8 flex-row items-center gap-3" key={row.key}>
          <Text
            variant="caption"
            className="shrink-0 text-muted-foreground"
            numberOfLines={1}
            style={{ width: labelWidth }}
          >
            {row.label}
          </Text>
          <View className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <View
              accessible
              accessibilityLabel={`${row.label}: ${row.valueText}`}
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, Math.round((Math.abs(row.value) / max) * 100))}%`,
                backgroundColor: row.highlight ? primaryColor : seriesColor,
              }}
            />
          </View>
          <Text variant="label" numeric="tabular" className="shrink-0 font-semibold text-foreground">
            {row.valueText}
          </Text>
          {row.trailingText ? (
            <Text
              variant="caption"
              numeric="tabular"
              className="w-12 shrink-0 text-right text-muted-foreground"
            >
              {row.trailingText}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
