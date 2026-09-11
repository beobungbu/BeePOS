import { useMemo, useState } from 'react';
import { useCatalogStore } from '../../data/catalog-store';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import {
  averageBasket,
  cashierPerformance,
  deltaPercent,
  filterOrders,
  grossProfit,
  paymentMix,
  periodRange,
  previousPeriod,
  revenueByDay,
  revenueByStore,
  topProducts,
  totalRefunds,
  totalRevenue,
  type PeriodKey,
} from '../../domain/reports';

export interface ReportFiltersState {
  periodKey: PeriodKey;
  setPeriodKey: (key: PeriodKey) => void;
  customStart: Date | null;
  customEnd: Date | null;
  setCustomStart: (date: Date) => void;
  setCustomEnd: (date: Date) => void;
  storeId: string | null;
  setStoreId: (storeId: string | null) => void;
  /** Whether the current staff may see the "all stores" option (owner/manager only). */
  canViewAllStores: boolean;
}

/** Owns period/store filter UI state for `/reports`. */
export function useReportFilters(): ReportFiltersState {
  const staff = useSessionStore((state) => state.staff);
  const session = useSessionStore((state) => state.store);
  const canViewAllStores = staff?.role === 'owner' || staff?.role === 'manager';

  const [periodKey, setPeriodKey] = useState<PeriodKey>('today');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [storeId, setStoreId] = useState<string | null>(canViewAllStores ? null : (session?.id ?? null));

  return {
    periodKey,
    setPeriodKey,
    customStart,
    customEnd,
    setCustomStart,
    setCustomEnd,
    storeId,
    setStoreId,
    canViewAllStores,
  };
}

/** Derives every dashboard section's data from the current filters, memoized. */
export function useReportData(filters: ReportFiltersState) {
  const orders = useOrderStore((state) => state.orders);
  const products = useCatalogStore((state) => state.products);
  const stores = useOrgStore((state) => state.stores);
  const staff = useOrgStore((state) => state.staff);

  return useMemo(() => {
    const now = new Date();
    const range = periodRange(
      filters.periodKey,
      now,
      filters.customStart ?? undefined,
      filters.customEnd ?? undefined,
    );
    const prevRange = previousPeriod(range);

    const current = filterOrders(orders, range, filters.storeId ?? undefined);
    const previous = filterOrders(orders, prevRange, filters.storeId ?? undefined);

    const currentRevenue = totalRevenue(current);
    const previousRevenue = totalRevenue(previous);
    const currentOrders = current.length;
    const previousOrders = previous.length;
    const currentAvg = averageBasket(current);
    const previousAvg = averageBasket(previous);
    const currentProfit = grossProfit(current, products);
    const previousProfit = grossProfit(previous, products);
    const currentRefunds = totalRefunds(current);
    const previousRefunds = totalRefunds(previous);

    const visibleStores = filters.storeId ? stores.filter((s) => s.id === filters.storeId) : stores;

    return {
      range,
      stats: {
        revenue: { value: currentRevenue, delta: deltaPercent(currentRevenue, previousRevenue) },
        orders: { value: currentOrders, delta: deltaPercent(currentOrders, previousOrders) },
        avgBasket: { value: currentAvg, delta: deltaPercent(currentAvg, previousAvg) },
        grossProfit: { value: currentProfit, delta: deltaPercent(currentProfit, previousProfit) },
        refunds: { value: currentRefunds, delta: deltaPercent(currentRefunds, previousRefunds) },
      },
      revenueByDay: revenueByDay(current, range),
      revenueByStore: revenueByStore(current, visibleStores),
      topProducts: topProducts(current, products, 10),
      paymentMix: paymentMix(current),
      cashierPerformance: cashierPerformance(current, staff),
      stores,
    };
  }, [orders, products, stores, staff, filters.periodKey, filters.customStart, filters.customEnd, filters.storeId]);
}
