import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import type { Category } from '../../../domain/types';
import { useT } from '../../../i18n';

export const ALL_CATEGORY = 'all';

interface CategoryChipsProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  /** Phone scrolls one row; tablet and desktop wrap to at most two rows. */
  scroll: boolean;
  /** How many chips fit two wrapped rows at this width; the rest go behind `+N`. */
  visibleLimit: number;
  gutter: number;
}

/**
 * Category filter chips per `docs/design/design-direction.md` section 5: 36 pt tall inside a
 * 44 pt row, `Tất cả` pinned first, selected in `primary`, unselected `bg-muted` with no
 * border. Built from `Pressable` rather than `ChipGroup` because the phone row has to scroll
 * horizontally with a gutter bleed and `ChipGroup` lays its children out as a wrapping row.
 */
export function CategoryChips({
  categories,
  value,
  onChange,
  scroll,
  visibleLimit,
  gutter,
}: CategoryChipsProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);

  const all = [{ id: ALL_CATEGORY, name: t('pos.categoryAll') }, ...categories];
  const overflow = scroll || expanded ? 0 : Math.max(0, all.length - visibleLimit);
  const shown = overflow > 0 ? all.slice(0, visibleLimit) : all;

  const chips = shown.map((category) => (
    <CategoryChip
      key={category.id}
      label={category.name}
      selected={category.id === value}
      onPress={() => onChange(category.id)}
    />
  ));

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="h-11"
        contentContainerStyle={{ alignItems: 'center', gap: 8, paddingHorizontal: gutter }}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      {chips}
      {overflow > 0 ? (
        <CategoryChip label={`+${overflow}`} selected={false} onPress={() => setExpanded(true)} />
      ) : null}
    </View>
  );
}

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`h-9 justify-center rounded-full px-3.5 ${selected ? 'bg-primary' : 'bg-muted'}`}
    >
      <Text
        className={`text-label font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
