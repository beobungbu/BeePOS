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
  VStack,
  type CalendarVisibleMonth,
} from '@beemvp/beeui-ui';
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
}

export function PeriodFilter({ filters, stores }: PeriodFilterProps) {
  const t = useT();

  return (
    <VStack gap="sm" className="w-full">
      <SegmentedControl
        value={filters.periodKey}
        onValueChange={(value) => filters.setPeriodKey(value as PeriodKey)}
      >
        <SegmentedControlItem value="today">{t('reports.period.today')}</SegmentedControlItem>
        <SegmentedControlItem value="7d">{t('reports.period.last7')}</SegmentedControlItem>
        <SegmentedControlItem value="30d">{t('reports.period.last30')}</SegmentedControlItem>
        <SegmentedControlItem value="custom">{t('reports.period.custom')}</SegmentedControlItem>
      </SegmentedControl>

      <HStack gap="sm" wrap>
        {filters.periodKey === 'custom' && (
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
        )}

        {filters.canViewAllStores && (
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
        )}
      </HStack>
    </VStack>
  );
}
