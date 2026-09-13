import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { useCatalogStore } from '../../data/catalog-store';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import { canViewAllStores } from '../../domain/org';
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

interface ReportFilterState {
  periodKey: PeriodKey;
  customStart: Date | null;
  customEnd: Date | null;
  storeId: string | null;
  setPeriodKey: (periodKey: PeriodKey) => void;
  setCustomStart: (customStart: Date) => void;
  setCustomEnd: (customEnd: Date) => void;
  setStoreId: (storeId: string | null) => void;
}

/**
 * Period and branch live in a module store rather than in the screen, because `/reports` is
 * now seven screens: picking "30 ngày" on the overview and then opening Theo giờ has to stay
 * on 30 days, or every tab change silently changes the question being asked.
 */
const useReportFilterStore = create<ReportFilterState>((set) => ({
  periodKey: 'today',
  customStart: null,
  customEnd: null,
  storeId: null,
  setPeriodKey: (periodKey) => set({ periodKey }),
  setCustomStart: (customStart) => set({ customStart }),
  setCustomEnd: (customEnd) => set({ customEnd }),
  setStoreId: (storeId) => set({ storeId }),
}));

/** Owns period/store filter UI state, shared by every report screen. */
export function useReportFilters(): ReportFiltersState {
  const staff = useSessionStore((state) => state.staff);
  const session = useSessionStore((state) => state.store);
  const canSeeAllStores = canViewAllStores(staff);
  const state = useReportFilterStore();
  const sessionStoreId = session?.id ?? null;

  // A cashier may only read their own branch, so the filter is pinned to it whatever the
  // shared state was left on by an owner on the same device.
  useEffect(() => {
    if (!canSeeAllStores && state.storeId !== sessionStoreId) state.setStoreId(sessionStoreId);
  }, [canSeeAllStores, sessionStoreId, state]);

  return {
    periodKey: state.periodKey,
    setPeriodKey: state.setPeriodKey,
    customStart: state.customStart,
    customEnd: state.customEnd,
    setCustomStart: state.setCustomStart,
    setCustomEnd: state.setCustomEnd,
    storeId: canSeeAllStores ? state.storeId : sessionStoreId,
    setStoreId: state.setStoreId,
    canViewAllStores: canSeeAllStores,
  };
}

/**
 * The orders the current filters select, with the range they came from. The six phase-7 cuts
 * each derive their own figures from this rather than from `useReportData`, whose shape is the
 * overview screen's.
 */
export function useReportPeriod(filters: ReportFiltersState) {
  const orders = useOrderStore((state) => state.orders);

  return useMemo(() => {
    const now = new Date();
    const range = periodRange(
      filters.periodKey,
      now,
      filters.customStart ?? undefined,
      filters.customEnd ?? undefined,
    );
    return {
      now,
      range,
      orders: filterOrders(orders, range, filters.storeId ?? undefined),
    };
  }, [orders, filters.periodKey, filters.customStart, filters.customEnd, filters.storeId]);
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
