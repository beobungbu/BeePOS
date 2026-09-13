/**
 * The weighted-average cost of every product, as a history rather than a single number.
 *
 * Kept out of the catalogue store on purpose: `Product.costPrice` is the catalogue's opening
 * cost and never moves, while this is what the stock actually cost, which moves on every
 * receipt. Reports read this; the product form still edits the catalogue figure.
 */

import { create } from 'zustand';
import type { CostHistory, GoodsReceipt } from '../domain/types';
import {
  costHistoryFromReceipt,
  latestCost,
  receiptCostUpdates,
  type CostUpdate,
} from '../domain/costing';
import { costHistory as seedCostHistory } from './seed';

interface CostingState {
  history: CostHistory[];
  addCostHistory: (entry: CostHistory) => void;
  /**
   * Blends a confirmed receipt into the cost of everything it brought in and records the new
   * cost per product. Returns the moves it made, so the caller can show them or log them.
   */
  applyReceipt: (
    receipt: GoodsReceipt,
    onHandFor: (productId: string, storeId: string) => number,
  ) => CostUpdate[];
}

export const useCostingStore = create<CostingState>((set, get) => ({
  history: seedCostHistory,

  addCostHistory: (entry) => set((state) => ({ history: [...state.history, entry] })),

  applyReceipt: (receipt, onHandFor) => {
    const history = get().history;
    const updates = receiptCostUpdates({
      receipt,
      onHandFor,
      costFor: (productId, storeId) => latestCost(history, productId, storeId) ?? 0,
    });
    if (updates.length === 0) return [];

    const rows = costHistoryFromReceipt(receipt, updates);
    set((state) => ({ history: [...state.history, ...rows] }));
    return updates;
  },
}));

/** The cost in force for a product right now, or `undefined` when it has no history. */
export function currentCost(productId: string, storeId?: string): number | undefined {
  return latestCost(useCostingStore.getState().history, productId, storeId);
}
