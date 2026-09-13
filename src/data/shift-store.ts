import { useMemo } from 'react';
import { create } from 'zustand';
import { shiftSummary } from '../domain/pos';
import type { Shift } from '../domain/types';
import { useOrderStore } from './order-store';
import { useSessionStore } from './session-store';
import { currentOrgId } from './org-store';

interface ShiftState {
  /** Opens a new shift for the current staff/store; throws if there is no active session. */
  openShift: (openingCash: number) => Shift;
  /** Closes a shift and recomputes its final totals from the orders placed during it. */
  closeShift: (shiftId: string, closingCash: number) => void;
}

export const useShiftStore = create<ShiftState>(() => ({
  openShift: (openingCash) => {
    const { staff, store, register } = useSessionStore.getState();
    if (!staff || !store) throw new Error('Không có phiên đăng nhập đang hoạt động');

    const shift: Shift = {
      id: `shift-${Date.now()}`,
      orgId: currentOrgId(),
      storeId: store.id,
      registerId: register?.id,
      cashierId: staff.id,
      openedAt: new Date().toISOString(),
      openingCash,
      expectedCash: openingCash,
      orderCount: 0,
      revenue: 0,
    };
    useOrderStore.getState().addShift(shift);
    return shift;
  },

  closeShift: (shiftId, closingCash) => {
    const shift = useOrderStore.getState().shifts.find((item) => item.id === shiftId);
    if (!shift) return;

    const closedShift: Shift = { ...shift, closedAt: new Date().toISOString(), closingCash };
    const summary = shiftSummary(closedShift, useOrderStore.getState().orders);
    useOrderStore.getState().updateShift({
      ...closedShift,
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      expectedCash: summary.expectedCash,
    });
  },
}));

/**
 * Reactive selector for the current staff/store's open (not yet closed) shift, if any.
 *
 * Derives (rather than selects-and-filters inline) so the zustand selector itself only
 * ever returns the store's own stable `shifts` array reference; deriving inside the
 * selector would return a fresh value on every call and made React's
 * `useSyncExternalStore` snapshot check throw "Maximum update depth exceeded" on the
 * shift screen (see docs/beeui-audit/findings-01-pos.md).
 */
export function useCurrentShift(): Shift | undefined {
  const storeId = useSessionStore((state) => state.store?.id);
  const cashierId = useSessionStore((state) => state.staff?.id);
  const shifts = useOrderStore((state) => state.shifts);
  return useMemo(
    () => shifts.find((shift) => shift.storeId === storeId && shift.cashierId === cashierId && !shift.closedAt),
    [shifts, storeId, cashierId],
  );
}

/** Reactive selector for a store's shift history, most recent first. */
export function useShiftHistory(storeId: string | undefined): Shift[] {
  const shifts = useOrderStore((state) => state.shifts);
  return useMemo(
    () =>
      shifts
        .filter((shift) => shift.storeId === storeId)
        .slice()
        .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()),
    [shifts, storeId],
  );
}
