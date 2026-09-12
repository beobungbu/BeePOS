import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState, Pagination, PaginationItem, Skeleton, Text } from '@beemvp/beeui-ui';
import { useOrderStore } from '../../../data/order-store';
import { useCustomerStore } from '../../../data/customer-store';
import { staff, stores } from '../../../data/seed';
import { filterOrders, orderStats, sortOrders, type OrderSortKey, type SortDirection } from '../../../domain/orders';
import type { Order } from '../../../domain/types';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { useT } from '../../../i18n';
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';
import { useBreakpoint, type Breakpoint } from '../../../hooks/use-breakpoint';
import { OrderFiltersBar, type OrdersFilterValue } from '../components/order-filters-bar';
import { OrderStatsStrip } from '../components/order-stats-strip';
import { OrderTable } from '../components/order-table';
import { OrderListGroup } from '../components/order-list-group';
import { OrderPreviewPane } from '../components/order-preview-pane';
import { fill } from '../lib/fill';
import { pageRange, rangeForPreset } from '../lib/order-presentation';

const FILTER_LOADING_DELAY_MS = 300;

/** Rows that fit the data area at each band; desktop matches the mockup's twelve. */
function pageSizeFor(breakpoint: Breakpoint): number {
  if (breakpoint === 'phone') return 20;
  return breakpoint === 'tablet' ? 10 : 12;
}

export function OrdersListScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';
  const isDesktop = breakpoint === 'desktop';

  const orders = useOrderStore((state) => state.orders);
  const refunds = useOrderStore((state) => state.refunds);
  const customers = useCustomerStore((state) => state.customers);

  const [filters, setFilters] = useState<OrdersFilterValue>(() => ({
    storeId: '',
    cashierId: '',
    status: '',
    search: '',
    preset: 'days7',
    ...rangeForPreset('days7', new Date()),
  }));
  const [sortKey, setSortKey] = useState<OrderSortKey>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // Simulated loading on every filter/sort change, to exercise the Skeleton state (there is
  // no real network round-trip in this prototype).
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), FILTER_LOADING_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [filters, sortKey, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filtered = useMemo(
    () =>
      filterOrders(
        orders,
        {
          storeId: filters.storeId || undefined,
          cashierId: filters.cashierId || undefined,
          status: filters.status || undefined,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          search: filters.search || undefined,
        },
        customers,
      ),
    [orders, filters, customers],
  );
  const sorted = useMemo(() => sortOrders(filtered, sortKey, sortDirection), [filtered, sortKey, sortDirection]);
  const stats = useMemo(() => orderStats(filtered, refunds), [filtered, refunds]);

  const pageSize = pageSizeFor(breakpoint);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageOrders = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const range = pageRange(currentPage, pageSize, sorted.length);

  // Derived rather than stored, so the pane always mirrors a row that is actually on screen
  // after a filter, a sort or a page change, with no effect to keep the two in step.
  const selectedOrder = pageOrders.find((order) => order.id === selectedId) ?? pageOrders[0];

  const customerLabel = (order: Order): string => {
    if (!order.customerId) return t('orders.table.noCustomer');
    return customers.find((customer) => customer.id === order.customerId)?.name ?? t('orders.table.noCustomer');
  };

  const handleSortChange = (key: OrderSortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 'ascending' ? 'descending' : 'ascending'));
    } else {
      setSortKey(key);
      setSortDirection('descending');
    }
  };

  const gutter = isPhone ? 'px-4' : isDesktop ? 'px-6' : 'px-5';

  // The screen names itself in the app header, so no second title row is drawn here.
  useScreenHeader({
    title: t('orders.title'),
    subtitle: `${t(`orders.filters.${filters.preset}`)} · ${fill(t('orders.filters.results'), {
      count: sorted.length,
    })}`,
  });

  const filtersBar = (
    <OrderFiltersBar
      breakpoint={breakpoint}
      cashiers={staff}
      onChange={setFilters}
      resultCount={sorted.length}
      stores={stores}
      value={filters}
    />
  );

  const body = loading ? (
    <View className={`gap-2 py-3 ${gutter}`}>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </View>
  ) : pageOrders.length === 0 ? (
    <View className={`py-8 ${gutter}`}>
      <EmptyState description={t('orders.empty.description')} title={t('orders.empty.title')} />
    </View>
  ) : isPhone ? (
    <OrderListGroup customerLabel={customerLabel} orders={pageOrders} showDayHeaders={filters.preset !== 'today'} />
  ) : (
    <OrderTable
      breakpoint={breakpoint}
      cashiers={staff}
      customerLabel={customerLabel}
      onSelectOrder={isDesktop ? (order) => setSelectedId(order.id) : undefined}
      onSortChange={handleSortChange}
      orders={pageOrders}
      selectedOrderId={isDesktop ? selectedOrder?.id : undefined}
      sortDirection={sortDirection}
      sortKey={sortKey}
    />
  );

  const footer =
    sorted.length === 0 ? null : (
      <View className={`flex-row flex-wrap items-center justify-between gap-3 border-t border-border bg-surface py-3 ${gutter}`}>
        <Text className="text-label text-muted-foreground" numeric="tabular">
          {fill(t('orders.pagination.showing'), { from: range.from, to: range.to, total: sorted.length })}
        </Text>
        {pageCount > 1 ? (
          <Pagination onPageChange={setPage} page={currentPage} pageCount={pageCount}>
            <PaginationItem type="previous" />
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <PaginationItem key={pageNumber} page={pageNumber} />
            ))}
            <PaginationItem type="next" />
          </Pagination>
        ) : null}
      </View>
    );

  if (isPhone) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-4">
        {filtersBar}
        <OrderStatsStrip breakpoint={breakpoint} stats={stats} />
        <View className="pt-3">{body}</View>
        {footer}
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {filtersBar}
      <View className={`py-3 ${gutter}`}>
        <OrderStatsStrip breakpoint={breakpoint} stats={stats} />
      </View>
      <View className="min-h-0 flex-1 flex-row">
        <ScrollView className="min-w-0 flex-1" contentContainerClassName="pb-2">
          {body}
        </ScrollView>
        {isDesktop ? (
          <OrderPreviewPane
            cashier={staff.find((member) => member.id === selectedOrder?.cashierId)}
            customer={customers.find((customer) => customer.id === selectedOrder?.customerId)}
            order={selectedOrder}
            staffName={selectedOrder?.cashierId ?? ''}
          />
        ) : null}
      </View>
      {footer}
    </View>
  );
}
