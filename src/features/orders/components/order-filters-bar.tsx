import { useEffect } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import {
  Chip,
  ChipGroup,
  DatePicker,
  Field,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@beemvp/beeui-ui';
import type { OrderStatus, Staff, Store } from '../../../domain/types';
import { useT } from '../../../i18n';
import type { Breakpoint } from '../../../hooks/use-breakpoint';
import { Toolbar } from '../../../components/toolbar';
import { calendarDateToIso, isoToCalendarDate } from '../lib/calendar-date';
import { DATE_PRESETS, rangeForPreset, type DatePreset } from '../lib/order-presentation';

const STATUS_OPTIONS: OrderStatus[] = ['paid', 'partial_refund', 'refunded', 'void'];

/** DOM id of the search wrapper, so the web-only F3 shortcut can reach the input inside it. */
const SEARCH_WRAPPER_ID = 'orders-search';

export interface OrdersFilterValue {
  storeId: string;
  cashierId: string;
  status: OrderStatus | '';
  preset: DatePreset;
  fromDate: string;
  toDate: string;
  search: string;
}

export function OrderFiltersBar({
  value,
  onChange,
  stores,
  cashiers,
  breakpoint,
  actions,
}: {
  value: OrdersFilterValue;
  onChange: (next: OrdersFilterValue) => void;
  stores: Store[];
  cashiers: Staff[];
  breakpoint: Breakpoint;
  /** Page actions; desktop pins them to the right of the same 56 pt row. */
  actions?: React.ReactNode;
}) {
  const t = useT();
  const isPhone = breakpoint === 'phone';
  const isDesktop = breakpoint === 'desktop';

  useSearchHotkey(isDesktop);

  const setPreset = (preset: DatePreset) =>
    onChange({ ...value, preset, ...rangeForPreset(preset, new Date(), value) });

  const presetSelect = (
    <Select onValueChange={(v) => setPreset(v as DatePreset)} value={value.preset}>
      <SelectTrigger accessibilityLabel={t('orders.filters.dateRange')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DATE_PRESETS.map((preset) => (
          <SelectItem key={preset} value={preset}>
            {t(`orders.filters.${preset}`)}
          </SelectItem>
        ))}
        <SelectItem value="custom">{t('orders.filters.custom')}</SelectItem>
      </SelectContent>
    </Select>
  );

  const statusSelect = (
    <Select
      onValueChange={(v) => onChange({ ...value, status: v === 'all' ? '' : (v as OrderStatus) })}
      value={value.status || 'all'}
    >
      <SelectTrigger accessibilityLabel={t('orders.filters.status')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('orders.filters.allStatuses')}</SelectItem>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            {t(`orders.status.${status}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const search = (
    <View className="min-w-48 flex-1" nativeID={SEARCH_WRAPPER_ID}>
      <SearchInput
        accessibilityLabel={t('orders.filters.search')}
        defaultValue={value.search}
        onSearch={(text) => onChange({ ...value, search: text })}
        placeholder={isPhone ? t('orders.filters.searchPlaceholderShort') : t('orders.filters.searchPlaceholder')}
      />
    </View>
  );

  const customRange = value.preset === 'custom' && (
    <View className="flex-row flex-wrap gap-3">
      <Field className="min-w-40 flex-1" label={t('orders.filters.fromDate')}>
        <DatePicker
          locale="vi-VN"
          onValueChange={(date) => date && onChange({ ...value, fromDate: calendarDateToIso(date) })}
          value={isoToCalendarDate(value.fromDate)}
        />
      </Field>
      <Field className="min-w-40 flex-1" label={t('orders.filters.toDate')}>
        <DatePicker
          locale="vi-VN"
          onValueChange={(date) => date && onChange({ ...value, toDate: calendarDateToIso(date) })}
          value={isoToCalendarDate(value.toDate)}
        />
      </Field>
    </View>
  );

  if (isPhone) {
    return (
      <View className="gap-3 border-b border-border bg-surface px-4 pb-3 pt-2">
        {search}
        <ScrollView
          contentContainerClassName="flex-row items-center gap-2 pr-4"
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <ChipGroup
            className="flex-row flex-nowrap gap-2"
            onValueChange={(v) => setPreset(v as DatePreset)}
            selectionMode="single"
            value={value.preset}
          >
            {DATE_PRESETS.map((preset) => (
              <Chip key={preset} value={preset}>
                {t(`orders.filters.${preset}`)}
              </Chip>
            ))}
          </ChipGroup>
          <View className="h-6 w-px bg-border-strong" />
          <ChipGroup
            className="flex-row flex-nowrap gap-2"
            onValueChange={(v) => onChange({ ...value, status: v === 'all' ? '' : (v as OrderStatus) })}
            selectionMode="single"
            value={value.status || 'all'}
          >
            <Chip value="all">{t('orders.filters.allStatuses')}</Chip>
            {STATUS_OPTIONS.map((status) => (
              <Chip key={status} value={status}>
                {t(`orders.status.${status}`)}
              </Chip>
            ))}
          </ChipGroup>
        </ScrollView>
        {actions ? <View className="flex-row flex-wrap items-center gap-2">{actions}</View> : null}
        {customRange}
      </View>
    );
  }

  const storeSelect = (
    <View className="min-w-32">
      <Select
        onValueChange={(v) => onChange({ ...value, storeId: v === 'all' ? '' : v })}
        value={value.storeId || 'all'}
      >
        <SelectTrigger accessibilityLabel={t('orders.filters.store')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('orders.filters.allStores')}</SelectItem>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

  const cashierSelect = (
    <View className="min-w-32">
      <Select
        onValueChange={(v) => onChange({ ...value, cashierId: v === 'all' ? '' : v })}
        value={value.cashierId || 'all'}
      >
        <SelectTrigger accessibilityLabel={t('orders.filters.cashier')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('orders.filters.allCashiers')}</SelectItem>
          {cashiers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );

  // Desktop is the shared 56 pt toolbar row. The result count has moved to the pagination
  // footer, the one place it stays true after a page change, so it is not repeated here.
  if (isDesktop) {
    return (
      <View className="border-b border-border bg-surface px-6">
        <Toolbar actions={actions}>
          <View style={{ width: 300 }}>{search}</View>
          <Text variant="caption" className="text-subtle-foreground" numberOfLines={1}>
            F3
          </Text>
          {storeSelect}
          <View className="min-w-32">{presetSelect}</View>
          <View className="min-w-36">{statusSelect}</View>
          {cashierSelect}
        </Toolbar>
        {customRange ? <View className="pb-3">{customRange}</View> : null}
      </View>
    );
  }

  return (
    <View className="gap-3 border-b border-border bg-surface px-5 py-3">
      <View className="flex-row flex-wrap items-center gap-3">
        {search}
        <View className="min-w-32">{presetSelect}</View>
        <View className="min-w-36">{statusSelect}</View>
        {actions ? <View className="ml-auto flex-row items-center gap-2">{actions}</View> : null}
      </View>
      {customRange}
    </View>
  );
}

/**
 * `F3` focuses the order search, the same key the POS catalogue uses, on web only. The input
 * is reached through the wrapper's DOM node instead of a ref because `SearchInput` exposes no
 * imperative focus handle. Native has no hardware key to bind, so the effect never runs there.
 */
function useSearchHotkey(enabled: boolean): void {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof document === 'undefined') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'F3') return;
      const input = document.getElementById(SEARCH_WRAPPER_ID)?.querySelector('input');
      if (!input) return;
      event.preventDefault();
      input.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
