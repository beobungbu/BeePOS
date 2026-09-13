import { useMemo } from 'react';
import { create } from 'zustand';
import type { StorePrice } from '../domain/types';
import { indexStorePrices } from '../domain/catalog';
import { storePrices as seedStorePrices } from './seed';
import { useSessionStore } from './session-store';

interface StorePriceState {
  prices: StorePrice[];
  /** Sets one branch's price for one product. A price below zero is refused. */
  setStorePrice: (input: StorePrice) => void;
  /** Removes the override, putting the branch back on the chain price. */
  clearStorePrice: (storeId: string, productId: string) => void;
}

export const useStorePriceStore = create<StorePriceState>((set) => ({
  prices: seedStorePrices,

  setStorePrice: (input) => {
    if (!Number.isFinite(input.salePrice) || input.salePrice < 0) return;
    set((state) => {
      const exists = state.prices.some(
        (price) => price.storeId === input.storeId && price.productId === input.productId,
      );
      return {
        prices: exists
          ? state.prices.map((price) =>
              price.storeId === input.storeId && price.productId === input.productId ? input : price,
            )
          : [...state.prices, input],
      };
    });
  },

  clearStorePrice: (storeId, productId) =>
    set((state) => ({
      prices: state.prices.filter(
        (price) => !(price.storeId === storeId && price.productId === productId),
      ),
    })),
}));

/**
 * The chain's overrides. Selects the raw array and derives with `useMemo`: filtering inside
 * the zustand selector returns a new array on every call, which makes `useSyncExternalStore`
 * see a changed snapshot every render and loop (the defect documented in `shift-store.ts`).
 */
export function useStorePrices(): StorePrice[] {
  const prices = useStorePriceStore((state) => state.prices);
  const orgId = useSessionStore((state) => state.session?.orgId);
  return useMemo(
    () => (orgId ? prices.filter((price) => price.orgId === orgId) : prices),
    [prices, orgId],
  );
}

/**
 * The overrides indexed for repeated lookups, which is what the sell screen needs: it prices
 * every visible tile on every render, and scanning the rows per tile would cost
 * `tiles x overrides` per frame.
 */
export function useStorePriceIndex(): ReadonlyMap<string, number> {
  const prices = useStorePrices();
  return useMemo(() => indexStorePrices(prices), [prices]);
}
