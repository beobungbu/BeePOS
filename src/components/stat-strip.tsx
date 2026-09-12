import { Fragment } from 'react';
import { View } from 'react-native';
import { Separator, Text } from '@beemvp/beeui-ui';

export type StatTone = 'foreground' | 'warning' | 'destructive' | 'success';

export interface StatStripItem {
  label: string;
  value: string;
  tone?: StatTone;
}

const TONE_CLASS: Record<StatTone, string> = {
  foreground: 'text-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
  success: 'text-success',
};

/**
 * The 64 pt borderless stat strip the list screens use instead of a card row
 * (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decision 4). Four
 * bordered cards cost 96 pt plus their gaps and carry no information the same four figures do
 * not; a vertical rule between the values is enough grouping. Reports keeps its cards, where
 * a stat is the content of the screen rather than a caption on the table under it.
 */
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <View className="h-16 flex-row items-center">
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
          </View>
        </Fragment>
      ))}
    </View>
  );
}
