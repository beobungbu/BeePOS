/**
 * Lots and expiry dates for the products that track them.
 *
 * Lots sit beside stock levels rather than inside them: only ten of the 120 SKUs are tracked,
 * and a lot table keyed by product would otherwise be mostly empty rows. The stock level stays
 * the number the app sells against; the lots say which batch to pick first.
 */

import { create } from 'zustand';
import type { Lot } from '../domain/types';
import { lots as seedLots } from './seed';

interface LotState {
  lots: Lot[];
  upsertLot: (lot: Lot) => void;
  /** Takes `qty` off a lot, floored at 0. */
  consumeLot: (lotId: string, qty: number) => void;
  removeLot: (lotId: string) => void;
}

export const useLotStore = create<LotState>((set) => ({
  lots: seedLots,

  upsertLot: (lot) =>
    set((state) => {
      const exists = state.lots.some((item) => item.id === lot.id);
      return {
        lots: exists ? state.lots.map((item) => (item.id === lot.id ? lot : item)) : [...state.lots, lot],
      };
    }),

  consumeLot: (lotId, qty) =>
    set((state) => ({
      lots: state.lots.map((lot) =>
        lot.id === lotId ? { ...lot, onHand: Math.max(0, lot.onHand - Math.max(0, qty)) } : lot,
      ),
    })),

  removeLot: (lotId) => set((state) => ({ lots: state.lots.filter((lot) => lot.id !== lotId) })),
}));

/**
 * The batches of a product at a branch in the order they should be picked: first expiry
 * first, undated batches last, empty batches dropped.
 */
export function fefoLots(lots: readonly Lot[], productId: string, storeId: string): Lot[] {
  return lots
    .filter((lot) => lot.productId === productId && lot.storeId === storeId && lot.onHand > 0)
    .sort((a, b) => {
      if (!a.expiresAt && !b.expiresAt) return a.lotCode.localeCompare(b.lotCode);
      if (!a.expiresAt) return 1;
      if (!b.expiresAt) return -1;
      return a.expiresAt.getTime() - b.expiresAt.getTime();
    });
}

/** Batches at or past `withinDays` of their expiry, soonest first. */
export function expiringLots(lots: readonly Lot[], now: Date, withinDays: number): Lot[] {
  const cutoff = now.getTime() + withinDays * 86_400_000;
  return lots
    .filter((lot) => lot.onHand > 0 && lot.expiresAt !== undefined && lot.expiresAt.getTime() <= cutoff)
    .sort((a, b) => (a.expiresAt as Date).getTime() - (b.expiresAt as Date).getTime());
}
