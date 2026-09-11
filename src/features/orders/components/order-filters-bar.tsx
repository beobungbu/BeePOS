import {
  Chip,
  ChipGroup,
  Field,
  HStack,
  DatePicker,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VStack,
} from '@beemvp/beeui-ui';
import type { OrderStatus, Staff, Store } from '../../../domain/types';
import { useT } from '../../../i18n';
import { calendarDateToIso, isoToCalendarDate } from '../lib/calendar-date';

const STATUS_OPTIONS: OrderStatus[] = ['paid', 'partial_refund', 'refunded', 'void'];

export interface OrdersFilterValue {
  storeId: string;
  cashierId: string;
  status: OrderStatus | '';
  fromDate: string;
  toDate: string;
  search: string;
}

export function OrderFiltersBar({
  value,
  onChange,
  stores,
  cashiers,
}: {
  value: OrdersFilterValue;
  onChange: (next: OrdersFilterValue) => void;
  stores: Store[];
  cashiers: Staff[];
}) {
  const t = useT();

  return (
    <VStack className="gap-3">
      <HStack className="flex-wrap gap-3">
        <Field className="min-w-48 flex-1" label={t('orders.filters.store')}>
          <Select
            onValueChange={(v) => onChange({ ...value, storeId: v === 'all' ? '' : v })}
            value={value.storeId || 'all'}
          >
            <SelectTrigger>
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
        </Field>
        <Field className="min-w-48 flex-1" label={t('orders.filters.cashier')}>
          <Select
            onValueChange={(v) => onChange({ ...value, cashierId: v === 'all' ? '' : v })}
            value={value.cashierId || 'all'}
          >
            <SelectTrigger>
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
        </Field>
      </HStack>
      <HStack className="flex-wrap gap-3">
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
      </HStack>
      <SearchInput
        defaultValue={value.search}
        onSearch={(text) => onChange({ ...value, search: text })}
        placeholder={t('orders.filters.search')}
      />
      <ChipGroup
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
    </VStack>
  );
}
