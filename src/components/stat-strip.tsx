import { Fragment } from 'react';
import { View } from 'react-native';
import { Separator, Text } from '@beemvp/beeui-ui';

export type StatTone = 'foreground' | 'warning' | 'destructive' | 'success';

export interface StatStripDelta {
  /** Whole line as the reader sees it, e.g. `+84.3% so với kỳ trước`. */
  text: string;
  tone: 'success' | 'destructive';
}

export interface StatStripItem {
  label: string;
  value: string;
  tone?: StatTone;
  /** Change against the comparison period, printed under the value. Reports only. */
  delta?: StatStripDelta;
}

const TONE_CLASS: Record<StatTone, string> = {
  foreground: 'text-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
  success: 'text-success',
};

const DELTA_CLASS: Record<StatStripDelta['tone'], string> = {
  success: 'text-success',
  destructive: 'text-destructive',
};

/**
 * The borderless stat strip the list screens use instead of a card row
 * (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decision 4). Four
 * bordered cards cost 96 pt plus their gaps and carry no information the same four figures do
 * not; a vertical rule between the values is enough grouping. A figure with no delta keeps the
 * 64 pt row; reports adds a delta line and the row grows to fit it, which is still less than
 * the cards it replaces (owner decision of 2026-09-13).
 *
 * `stacked` is the same content one figure per row, for widths where a five-figure row would
 * squeeze a money value onto two lines.
 */
export function StatStrip({
  items,
  layout = 'row',
}: {
  items: StatStripItem[];
  layout?: 'row' | 'stacked';
}) {
  if (layout === 'stacked') {
    return (
      <View>
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 ? <Separator className="my-2" /> : null}
            <View className="flex-row items-center justify-between gap-4">
              <Text variant="caption" className="shrink text-muted-foreground" numberOfLines={2}>
                {item.label}
              </Text>
              <View className="items-end gap-0.5">
                <Text
                  variant="heading"
                  className={`font-bold ${TONE_CLASS[item.tone ?? 'foreground']}`}
                  numberOfLines={1}
                  numeric="tabular"
                >
                  {item.value}
                </Text>
                {item.delta ? (
                  <Text variant="caption" className={DELTA_CLASS[item.delta.tone]} numberOfLines={1}>
                    {item.delta.text}
                  </Text>
                ) : null}
              </View>
            </View>
          </Fragment>
        ))}
      </View>
    );
  }

  return (
    <View className="min-h-16 flex-row items-center">
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <Separator orientation="vertical" className="mx-5 h-8" /> : null}
          <View className="min-w-0 gap-0.5">
            <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              variant="heading"
              className={`font-bold ${TONE_CLASS[item.tone ?? 'foreground']}`}
              numberOfLines={1}
              numeric="tabular"
            >
              {item.value}
            </Text>
            {item.delta ? (
              <Text variant="caption" className={DELTA_CLASS[item.delta.tone]} numberOfLines={1}>
                {item.delta.text}
              </Text>
            ) : null}
          </View>
        </Fragment>
      ))}
    </View>
  );
}
