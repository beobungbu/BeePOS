import { useRef, useState } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { IconButton, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { Category } from '../../../domain/types';
import { useT } from '../../../i18n';

export const ALL_CATEGORY = 'all';

/** How far the desktop edge control advances the row: about one and a half chips. */
const SCROLL_STEP = 240;

interface CategoryChipsProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  /** Phone and desktop scroll one row; tablet wraps to at most two rows. */
  scroll: boolean;
  /** How many chips fit two wrapped rows at this width; the rest go behind `+N`. */
  visibleLimit: number;
  gutter: number;
  /** Desktop: a chevron at the right edge advances the row for a pointer with no wheel tilt. */
  showScrollControl?: boolean;
}

/**
 * Category filter chips per `docs/design/design-direction.md` section 5: 36 pt tall inside a
 * 44 pt row, `Tất cả` pinned first, selected in `primary`, unselected `bg-muted` with no
 * border. Built from `Pressable` rather than `ChipGroup` because the phone row has to scroll
 * horizontally with a gutter bleed and `ChipGroup` lays its children out as a wrapping row.
 *
 * Desktop scrolls the same single row instead of wrapping to two: two rows of chips cost
 * 88 pt of the catalogue before a single product, and the `+N` chip hid the tail of the list
 * behind a press that then reflowed the whole grid.
 */
export function CategoryChips({
  categories,
  value,
  onChange,
  scroll,
  visibleLimit,
  gutter,
  showScrollControl = false,
}: CategoryChipsProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const offset = useRef(0);
  const [atEnd, setAtEnd] = useState(false);

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

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    offset.current = contentOffset.x;
    setAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 1);
  }

  if (scroll) {
    const row = (
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        className={showScrollControl ? 'h-11 flex-1' : 'h-11'}
        contentContainerStyle={{
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: showScrollControl ? 0 : gutter,
        }}
      >
        {chips}
      </ScrollView>
    );

    if (!showScrollControl) return row;

    return (
      <View className="flex-row items-center gap-1">
        {row}
        <IconButton
          variant="ghost"
          accessibilityLabel={t('pos.categoryScrollNext')}
          accessibilityState={{ disabled: atEnd }}
          onPress={() => {
            offset.current += SCROLL_STEP;
            scroller.current?.scrollTo({ x: offset.current, animated: true });
          }}
        >
          <AppIcon name="chevron-right" tone={atEnd ? 'subtle-foreground' : 'muted-foreground'} />
        </IconButton>
      </View>
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
        variant="label"
        className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
