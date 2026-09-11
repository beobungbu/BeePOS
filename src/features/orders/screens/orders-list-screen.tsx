import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { EmptyState, Skeleton, Text, VStack } from '@beemvp/beeui-ui';
import { useOrderStore } from '../../../data/order-store';
import { useCustomerStore } from '../../../data/customer-store';
import { staff, stores } from '../../../data/seed';
import { filterOrders, orderStats, sortOrders, type OrderSortKey, type SortDirection } from '../../../domain/orders';
import type { Order } from '../../../domain/types';
import { useT } from '../../../i18n';
import '../../../i18n/orders.vi';
import '../../../i18n/orders.en';
import { useIsWide } from '../hooks/use-is-wide';
import { OrderFiltersBar, type OrdersFilterValue } from '../components/order-filters-bar';
import { OrderStatsStrip } from '../components/order-stats-strip';
import { OrderTable } from '../components/order-table';
import { OrderListGroup } from '../components/order-list-group';

const PAGE_SIZE = 20;
const FILTER_LOADING_DELAY_MS = 300;

function defaultDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 6);
  const toIso = (date: Date) => date.toISOString().slice(0, 10);
  return { fromDate: toIso(from), toDate: toIso(today) };
}

export function OrdersListScreen() {
  const t = useT();
  const isWide = useIsWide();
  const orders = useOrderStore((state) => state.orders);
  const refunds = useOrderStore((state) => state.refunds);
  const customers = useCustomerStore((state) => state.customers);

  const [filters, setFilters] = useState<OrdersFilterValue>(() => ({
    storeId: '',
    cashierId: '',
    status: '',
    search: '',
    ...defaultDateRange(),
  }));
  const [sortKey, setSortKey] = useState<OrderSortKey>('time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

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
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageOrders = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4">
      <Text variant="heading">{t('orders.title')}</Text>
      <OrderFiltersBar cashiers={staff} onChange={setFilters} stores={stores} value={filters} />
      <OrderStatsStrip stats={stats} />
      {loading ? (
        <VStack className="gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </VStack>
      ) : pageOrders.length === 0 ? (
        <EmptyState description={t('orders.empty.description')} title={t('orders.empty.title')} />
      ) : isWide ? (
        <OrderTable
          cashiers={staff}
          customerLabel={customerLabel}
          onPageChange={setPage}
          onSortChange={handleSortChange}
          orders={pageOrders}
          page={page}
          pageCount={pageCount}
          sortDirection={sortDirection}
          sortKey={sortKey}
          stores={stores}
        />
      ) : (
        <OrderListGroup
          cashiers={staff}
          customerLabel={customerLabel}
          onPageChange={setPage}
          orders={pageOrders}
          page={page}
          pageCount={pageCount}
          stores={stores}
        />
      )}
    </ScrollView>
  );
}
