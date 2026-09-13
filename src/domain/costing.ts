/**
 * Weighted-average cost, and the cost of goods sold that falls out of it.
 *
 * Two halves that must not drift apart:
 *
 *  - On a receipt confirm, the cost of everything already on the shelf and the cost of what
 *    just arrived are blended into one new unit cost, written to `CostHistory`.
 *  - At the moment of sale, that cost is copied onto the order line (`unitCostSnapshot`).
 *    Gross profit reads the snapshot, never the product's current cost, so re-pricing stock
 *    next month cannot rewrite last month's margin.
 */

import { roundVND, sum } from './money';
import type { CostHistory, GoodsReceipt, Order, OrderLine, Product } from './types';

/** A quantity held at a cost: the two numbers a weighted average is made of. */
export interface CostLot {
  qty: number;
  unitCost: number;
}

/**
 * Blends existing stock with an incoming receipt.
 *
 * Negative or non-finite quantities are treated as zero: stock that went negative through an
 * adjustment must not invert the average. When both sides are empty the incoming cost stands,
 * which is what happens the first time a product is ever received.
 */
export function weightedAverageCost(current: CostLot, incoming: CostLot): number {
  const currentQty = Number.isFinite(current.qty) ? Math.max(0, current.qty) : 0;
  const incomingQty = Number.isFinite(incoming.qty) ? Math.max(0, incoming.qty) : 0;
  const currentCost = Number.isFinite(current.unitCost) ? Math.max(0, current.unitCost) : 0;
  const incomingCost = Number.isFinite(incoming.unitCost) ? Math.max(0, incoming.unitCost) : 0;

  const totalQty = currentQty + incomingQty;
  if (totalQty <= 0) return roundVND(incomingCost || currentCost);
  if (incomingQty <= 0) return roundVND(currentCost);
  if (currentQty <= 0) return roundVND(incomingCost);

  return roundVND((currentQty * currentCost + incomingQty * incomingCost) / totalQty);
}

/** One product's cost move caused by confirming a receipt. */
export interface CostUpdate {
  productId: string;
  storeId: string;
  /** The weighted-average cost in force before the receipt. */
  previousCost: number;
  /** The blended cost after it. */
  unitCost: number;
  /** Units received. */
  qty: number;
}

export interface ReceiptCostInput {
  receipt: GoodsReceipt;
  /** On-hand quantity of a product at the receipt's store, before the receipt is applied. */
  onHandFor: (productId: string, storeId: string) => number;
  /** The weighted-average cost in force for a product before the receipt. */
  costFor: (productId: string, storeId: string) => number;
}

/**
 * The cost moves a receipt causes, one per line. Lines for the same product are folded
 * together first, so a receipt that lists a product twice blends both batches rather than
 * applying the second against a stale on-hand figure.
 *
 * Pure: nothing is written, the caller decides what to do with the result.
 */
export function receiptCostUpdates({
  receipt,
  onHandFor,
  costFor,
}: ReceiptCostInput): CostUpdate[] {
  const merged = new Map<string, CostLot>();
  for (const line of receipt.lines) {
    const existing = merged.get(line.productId);
    if (!existing) {
      merged.set(line.productId, { qty: line.qty, unitCost: line.unitCost });
      continue;
    }
    merged.set(line.productId, {
      qty: existing.qty + line.qty,
      unitCost: weightedAverageCost(existing, { qty: line.qty, unitCost: line.unitCost }),
    });
  }

  return [...merged.entries()].map(([productId, incoming]) => {
    const previousCost = costFor(productId, receipt.storeId);
    const onHand = onHandFor(productId, receipt.storeId);
    return {
      productId,
      storeId: receipt.storeId,
      previousCost,
      unitCost: weightedAverageCost({ qty: onHand, unitCost: previousCost }, incoming),
      qty: incoming.qty,
    };
  });
}

/** Turns cost moves into the history rows that record them. */
export function costHistoryFromReceipt(
  receipt: GoodsReceipt,
  updates: readonly CostUpdate[],
  at: Date = new Date(),
): CostHistory[] {
  return updates.map((update) => ({
    productId: update.productId,
    storeId: update.storeId,
    unitCost: update.unitCost,
    source: 'receipt' as const,
    refId: receipt.id,
    createdAt: at,
  }));
}

/**
 * The cost in force for a product, newest row first.
 *
 * A branch row wins over a chain-wide one when `storeId` is given, because that branch buys at
 * its own price; with no branch row the chain cost applies. Returns `undefined` when the
 * product has no history at all, so the caller can fall back to `Product.costPrice`.
 */
export function latestCost(
  history: readonly CostHistory[],
  productId: string,
  storeId?: string,
): number | undefined {
  const rows = history.filter((row) => row.productId === productId);
  if (rows.length === 0) return undefined;

  const byNewest = (a: CostHistory, b: CostHistory) => b.createdAt.getTime() - a.createdAt.getTime();

  if (storeId) {
    const scoped = rows.filter((row) => row.storeId === storeId).sort(byNewest);
    if (scoped.length > 0) return scoped[0].unitCost;
  }
  const chainWide = rows.filter((row) => !row.storeId).sort(byNewest);
  if (chainWide.length > 0) return chainWide[0].unitCost;

  return [...rows].sort(byNewest)[0].unitCost;
}

/**
 * The cost to stamp on a line being sold right now: the weighted-average cost if the product
 * has one, the catalogue cost otherwise.
 */
export function costSnapshotFor(
  product: Pick<Product, 'id' | 'costPrice'>,
  history: readonly CostHistory[] = [],
  storeId?: string,
): number {
  return latestCost(history, product.id, storeId) ?? product.costPrice;
}

/** A product's cost curve at a store, oldest first, for the cost-history panel. */
export function costHistoryFor(
  history: readonly CostHistory[],
  productId: string,
  storeId?: string,
): CostHistory[] {
  return history
    .filter((row) => row.productId === productId && (!storeId || !row.storeId || row.storeId === storeId))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Cost of one sold line: the snapshot times the base quantity it was sold in. */
export function lineCogs(line: OrderLine): number {
  const factor = line.unitFactor && line.unitFactor > 0 ? line.unitFactor : 1;
  return roundVND(line.unitCostSnapshot * line.qty * factor);
}

/** Cost of goods sold for an order, from the snapshots its lines carry. */
export function cogsFor(order: Pick<Order, 'lines'>): number {
  return sum(order.lines.map(lineCogs));
}

/** Order revenue minus its own cost of goods sold. */
export function grossProfitFor(order: Pick<Order, 'lines' | 'total'>): number {
  return roundVND(order.total - cogsFor(order));
}

/** Gross margin as a percentage of revenue, one decimal place. Zero revenue gives 0. */
export function grossMarginPercent(order: Pick<Order, 'lines' | 'total'>): number {
  if (order.total <= 0) return 0;
  return Math.round((grossProfitFor(order) / order.total) * 1000) / 10;
}

/** Value of the stock on hand at the cost currently in force. */
export function inventoryValuation(
  levels: readonly { productId: string; storeId: string; onHand: number }[],
  products: readonly Pick<Product, 'id' | 'costPrice'>[],
  history: readonly CostHistory[] = [],
): number {
  const productById = new Map(products.map((product) => [product.id, product]));
  return sum(
    levels.map((level) => {
      const product = productById.get(level.productId);
      if (!product) return 0;
      return costSnapshotFor(product, history, level.storeId) * Math.max(0, level.onHand);
    }),
  );
}
