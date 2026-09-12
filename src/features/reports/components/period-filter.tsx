import { Pressable, ScrollView } from 'react-native';
import {
  Calendar,
  HStack,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SegmentedControl,
  SegmentedControlItem,
  Text,
  VStack,
  type CalendarVisibleMonth,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../../hooks/use-breakpoint';
import { useT } from '../../../i18n';
import type { PeriodKey } from '../../../domain/reports';
import type { Store } from '../../../domain/types';
import type { ReportFiltersState } from '../use-report-filters';

function toCalendarDate(date: Date) {
  return { day: date.getUTCDate(), month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

function fromCalendarDate(value: CalendarVisibleMonth & { day?: number }): Date {
  return new Date(Date.UTC(value.year, value.month - 1, value.day ?? 1));
}

function formatShortDate(date: Date | null): string {
  if (!date) return '--/--/----';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

interface PeriodFilterProps {
  filters: ReportFiltersState;
  stores: Store[];
  /** Desktop: emit the controls bare so the shared 56 pt toolbar can lay them out in one row. */
  inline?: boolean;
}

/** The four periods, in the order the mockup lists them. Values never change with the width. */
const PERIODS: { value: PeriodKey; labelKey: string }[] = [
  { value: 'today', labelKey: 'reports.period.today' },
  { value: '7d', labelKey: 'reports.period.last7' },
  { value: '30d', labelKey: 'reports.period.last30' },
  { value: 'custom', labelKey: 'reports.period.custom' },
];

export function PeriodFilter({ filters, stores, inline = false }: PeriodFilterProps) {
  const t = useT();
  // Hugging the content would squeeze the four labels at 1440; a min width below 768 would
  // push "Tuỳ chọn" off the screen, so the floor is a tablet-and-up rule.
  const isWide = useBreakpoint() !== 'phone';

  const customRange = filters.periodKey === 'custom' && (
    <>
      <Popover>
        <PopoverTrigger variant="outline" size="sm" accessibilityLabel={t('reports.period.from')}>
          {`${t('reports.period.from')}: ${formatShortDate(filters.customStart)}`}
        </PopoverTrigger>
        <PopoverContent placement="bottom" align="start">
          <Calendar
            value={filters.customStart ? toCalendarDate(filters.customStart) : null}
            onValueChange={(value) => filters.setCustomStart(fromCalendarDate(value))}
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger variant="outline" size="sm" accessibilityLabel={t('reports.period.to')}>
          {`${t('reports.period.to')}: ${formatShortDate(filters.customEnd)}`}
        </PopoverTrigger>
        <PopoverContent placement="bottom" align="start">
          <Calendar
            value={filters.customEnd ? toCalendarDate(filters.customEnd) : null}
            onValueChange={(value) => filters.setCustomEnd(fromCalendarDate(value))}
          />
        </PopoverContent>
      </Popover>
    </>
  );

  const storeSelect = filters.canViewAllStores && (
    <Select
      value={filters.storeId ?? 'all'}
      onValueChange={(value) => filters.setStoreId(value === 'all' ? null : value)}
    >
      <SelectTrigger className="min-w-40" accessibilityLabel={t('reports.storeFilter.label')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('reports.storeFilter.all')}</SelectItem>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (inline) {
    return (
      <>
        <SegmentedControl
          className="min-w-96 shrink-0"
          value={filters.periodKey}
          onValueChange={(value) => filters.setPeriodKey(value as PeriodKey)}
        >
          {PERIODS.map((period) => (
            <SegmentedControlItem key={period.value} value={period.value}>
              {t(period.labelKey)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        {customRange}
        {storeSelect}
      </>
    );
  }

  return (
    <VStack gap="sm" className="min-w-64 flex-1">
      {isWide ? (
        <SegmentedControl
          className="min-w-96 self-start"
          value={filters.periodKey}
          onValueChange={(value) => filters.setPeriodKey(value as PeriodKey)}
        >
          {PERIODS.map((period) => (
            <SegmentedControlItem key={period.value} value={period.value}>
              {t(period.labelKey)}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      ) : (
        // `SegmentedControl` gives every segment the same width, so at 375 pt "Hôm nay" and
        // "Tuỳ chọn" each wrap to two lines and the control grows to 58 pt. The chip row of
        // direction doc section 5 scrolls instead, and carries the same four values.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {PERIODS.map((period) => {
            const selected = filters.periodKey === period.value;
            return (
              <Pressable
                key={period.value}
                onPress={() => filters.setPeriodKey(period.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                accessibilityLabel={t(period.labelKey)}
                className={`h-9 items-center justify-center rounded-full px-4 ${
                  selected ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Text
                  variant="label"
                  className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
                >
                  {t(period.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <HStack gap="sm" wrap>
        {customRange}
        {storeSelect}
      </HStack>
    </VStack>
  );
}
