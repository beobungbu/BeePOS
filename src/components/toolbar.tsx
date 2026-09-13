import { useCallback, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Badge, Popover, PopoverContent, PopoverTrigger, Text } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../hooks/use-breakpoint';
import { useT } from '../i18n';
import { fill } from '../features/orders/lib/fill';
import { filtersFitInline, SEARCH_MIN_WIDTH } from './toolbar-fit';

/**
 * The one filter row every admin list screen draws directly under the app header
 * (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decision 3, tightened by
 * the owner decision of 2026-09-13: on desktop the row may neither wrap nor clip).
 *
 * Desktop is a single 56 pt row. Search, anything pinned (inventory's low stock alert) and the
 * primary actions are always inline; the secondary filters are the only thing that gives way,
 * and they give way by moving whole into a `Bộ lọc` popover rather than by shrinking past
 * legibility. Below 1280 the same children wrap, because at 768 a search field, two selects and
 * two buttons on one line leave the search box too narrow to read its own placeholder. The
 * result count is not in here: it belongs to the pagination footer, which is the only place it
 * stays true after a page change.
 */

export function Toolbar({
  search,
  pinned,
  children,
  activeFilterCount = 0,
  actions,
}: {
  /** Search field, always inline. Give its wrapper `min-w-60 shrink` so the row can squeeze it. */
  search?: React.ReactNode;
  /** Always inline, never collapsed: an alert the screen refuses to hide behind a popover. */
  pinned?: React.ReactNode;
  /** Secondary filters, laid out left to right, collapsed into a popover when they stop fitting. */
  children?: React.ReactNode;
  /** Filters currently narrowing the list, shown as a badge on the collapsed trigger. */
  activeFilterCount?: number;
  /** Primary actions, right aligned on desktop, always inline. */
  actions?: React.ReactNode;
}) {
  const isDesktop = useBreakpoint() === 'desktop';
  const [available, setAvailable] = useState(0);
  const [filtersWidth, setFiltersWidth] = useState(0);
  const [pinnedWidth, setPinnedWidth] = useState(0);
  const [actionsWidth, setActionsWidth] = useState(0);

  const onRowLayout = useMeasure(setAvailable);
  const onFiltersLayout = useMeasure(setFiltersWidth);
  const onPinnedLayout = useMeasure(setPinnedWidth);
  const onActionsLayout = useMeasure(setActionsWidth);

  if (!isDesktop) {
    return (
      <View className="flex-row flex-wrap items-center gap-2 py-2">
        {search}
        {pinned}
        {children}
        {actions ? <View className="flex-row items-center gap-2">{actions}</View> : null}
      </View>
    );
  }

  const inline = filtersFitInline({
    available,
    filtersWidth,
    pinnedWidth,
    actionsWidth,
    searchWidth: search ? SEARCH_MIN_WIDTH : 0,
  });

  return (
    <View className="min-h-14 flex-row items-center gap-2" onLayout={onRowLayout}>
      {search}
      {pinned ? (
        <View className="flex-row items-center gap-2" onLayout={onPinnedLayout}>
          {pinned}
        </View>
      ) : null}
      {children ? (
        inline ? (
          // Measured while inline only. Collapsing stops the measurement, so the width the
          // next decision reads is the width the filters had when they last fitted.
          <View className="flex-row items-center gap-2" onLayout={onFiltersLayout}>
            {children}
          </View>
        ) : (
          <FilterPopover count={activeFilterCount}>{children}</FilterPopover>
        )
      ) : null}
      {actions ? (
        <View className="ml-auto flex-row items-center gap-2" onLayout={onActionsLayout}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}

/**
 * The collapsed form of the secondary filters. The same elements move into the popover, so the
 * screen keeps one source of filter state and a filter stays selected across the collapse.
 */
function FilterPopover({ count, children }: { count: number; children: React.ReactNode }) {
  const t = useT();
  const label = t('common.toolbar.filters');
  return (
    <Popover>
      <PopoverTrigger
        variant="outline"
        size="sm"
        accessibilityLabel={
          count > 0 ? `${label}, ${fill(t('common.toolbar.filtersActive'), { count })}` : label
        }
      >
        {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the variant, which is
            1.2:1 on an outline button in dark (docs/beeui-audit/findings-18-w-c.md). */}
        <Text variant="label" className="text-foreground">
          {label}
        </Text>
        {count > 0 ? <Badge variant="primary">{String(count)}</Badge> : null}
      </PopoverTrigger>
      <PopoverContent placement="bottom" align="start">
        {/* Hugs the filters it was handed, with a floor that keeps a lone select from looking
            like a mistake. The widest filter any screen hands over is the 320 pt product status
            segmented control, which widens the column on its own. */}
        <View className="min-w-72 gap-3">{children}</View>
      </PopoverContent>
    </Popover>
  );
}

/** Layout width of a slot, ignoring the sub-pixel jitter that would otherwise re-render it. */
function useMeasure(set: (update: (previous: number) => number) => void) {
  return useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      set((previous) => (Math.abs(previous - width) > 1 ? width : previous));
    },
    [set],
  );
}
