/**
 * The weighted-average cost of every product, as a history rather than a single number.
 *
 * Kept out of the catalogue store on purpose: `Product.costPrice` is the catalogue's opening
 * cost and never moves, while this is what the stock actually cost, which moves on every
 * receipt. Reports read this; the product form still edits the catalogue figure.
 */

import { create } from 'zustand';
import type { CostHistory, GoodsReceipt, StockLevel } from '../domain/types';
import {
  costHistoryFromReceipt,
  latestCost,
  receiptCostUpdates,
  type CostUpdate,
} from '../domain/costing';
import { costHistory as seedCostHistory } from './seed';
import { demoSeed } from './chain-seed';
import { useInventoryStore } from './inventory-store';

/** Units of a product a receipt brought into one branch. */
function receivedQty(receipt: GoodsReceipt, productId: string): number {
  return receipt.lines
    .filter((line) => line.productId === productId)
    .reduce((total, line) => total + Math.max(0, line.qty), 0);
}

/**
 * On-hand as it stood **before** the receipt landed, which is the only figure a weighted
 * average may be blended against.
 *
 * The screen that confirms a receipt also adds its lines to stock, and the order of the two
 * calls is not something this store can dictate. So the receipt's own status decides: once it
 * reads `received`, its quantities are already in `levels` and have to come back out.
 */
export function onHandBeforeReceipt(
  receipt: GoodsReceipt,
  levels: readonly StockLevel[],
  stockAlreadyApplied: boolean,
): (productId: string, storeId: string) => number {
  return (productId, storeId) => {
    const level = levels.find((row) => row.productId === productId && row.storeId === storeId);
    const onHand = level?.onHand ?? 0;
    return stockAlreadyApplied ? Math.max(0, onHand - receivedQty(receipt, productId)) : onHand;
  };
}

interface CostingState {
  history: CostHistory[];
  addCostHistory: (entry: CostHistory) => void;
  /**
   * Blends a confirmed receipt into the cost of everything it brought in and records the new
   * cost per product. Returns the moves it made, so the caller can show them or log them.
   *
   * `onHandFor` is optional: with nothing passed, stock is read off the inventory store and
   * corrected for whether the receipt has already been posted, so the call works before or
   * after `receiveGoodsReceipt`. Calling it twice for one receipt is a no-op, because a second
   * pass would blend the same delivery in again.
   */
  applyReceipt: (
    receipt: GoodsReceipt,
    onHandFor?: (productId: string, storeId: string) => number,
  ) => CostUpdate[];
}

/** The cost history a chain starts with; it is the seeded receipts', so a new chain has none. */
export function costingSeedForActiveOrg(): Pick<CostingState, 'history'> {
  return { history: demoSeed(seedCostHistory, []) };
}

export const useCostingStore = create<CostingState>((set, get) => ({
  ...costingSeedForActiveOrg(),

  addCostHistory: (entry) => set((state) => ({ history: [...state.history, entry] })),

  applyReceipt: (receipt, onHandFor) => {
    const history = get().history;
    if (history.some((row) => row.source === 'receipt' && row.refId === receipt.id)) return [];

    const resolve = onHandFor ?? defaultOnHandFor(receipt);
    const updates = receiptCostUpdates({
      receipt,
      onHandFor: resolve,
      costFor: (productId, storeId) => latestCost(history, productId, storeId) ?? 0,
    });
    if (updates.length === 0) return [];

    const rows = costHistoryFromReceipt(receipt, updates);
    set((state) => ({ history: [...state.history, ...rows] }));
    return updates;
  },
}));

/**
 * Stock resolver built from the inventory store. Read inside the action rather than at module
 * load, so the two stores may import each other without either seeing a half-built module.
 */
function defaultOnHandFor(receipt: GoodsReceipt): (productId: string, storeId: string) => number {
  const inventory = useInventoryStore.getState();
  const posted = inventory.goodsReceipts.find((row) => row.id === receipt.id);
  const stockAlreadyApplied = (posted ?? receipt).status === 'received';
  return onHandBeforeReceipt(receipt, inventory.stockLevels, stockAlreadyApplied);
}

/**
 * The cost half of confirming a goods receipt, as a plain call for screens that hold no store
 * hook: `applyReceiptCost(receipt)`. Same rules as `applyReceipt`.
 */
export function applyReceiptCost(receipt: GoodsReceipt): CostUpdate[] {
  return useCostingStore.getState().applyReceipt(receipt);
}

/** The cost in force for a product right now, or `undefined` when it has no history. */
export function currentCost(productId: string, storeId?: string): number | undefined {
  return latestCost(useCostingStore.getState().history, productId, storeId);
}
