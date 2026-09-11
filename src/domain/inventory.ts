/** Pure inventory domain logic: stock math, movement log, receipt/transfer/count state machines. */

import type {
  GoodsReceiptLine,
  StockCountLine,
  StockLevel,
  StockTransferStatus,
} from './types';

export interface StockMovement {
  id: string;
  productId: string;
  storeId: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export type StockMovementInput = Omit<StockMovement, 'id' | 'createdAt'>;

/** Quantity actually sellable right now: on hand minus reserved, floored at 0. */
export function availableQty(level: Pick<StockLevel, 'onHand' | 'reserved'>): number {
  return Math.max(0, level.onHand - level.reserved);
}

export type StockStatus = 'out' | 'low' | 'ok';

/** Classifies a stock level for badge/alert display. */
export function stockStatus(level: Pick<StockLevel, 'onHand' | 'minLevel'>): StockStatus {
  if (level.onHand <= 0) return 'out';
  if (level.onHand <= level.minLevel) return 'low';
  return 'ok';
}

/** Stock levels at or below their minimum threshold (low or out of stock). */
export function lowStock(levels: readonly StockLevel[]): StockLevel[] {
  return levels.filter((level) => level.onHand <= level.minLevel);
}

export interface StockAdjustment {
  productId: string;
  storeId: string;
  delta: number;
  field?: 'onHand' | 'reserved';
}

/**
 * Applies a delta to a matching stock level (creating no new rows), clamped at 0.
 * Pure: returns a new array, the input is left untouched.
 */
export function applyMovement(
  levels: readonly StockLevel[],
  adjustment: StockAdjustment,
): StockLevel[] {
  const field = adjustment.field ?? 'onHand';
  return levels.map((level) => {
    if (level.productId !== adjustment.productId || level.storeId !== adjustment.storeId) {
      return level;
    }
    return { ...level, [field]: Math.max(0, level[field] + adjustment.delta) };
  });
}

/** Total quantity and total cost across a goods receipt's or transfer's lines. */
export function receiptTotals(lines: readonly GoodsReceiptLine[]): {
  totalQty: number;
  totalCost: number;
} {
  return lines.reduce(
    (totals, line) => ({
      totalQty: totals.totalQty + line.qty,
      totalCost: totals.totalCost + line.qty * line.unitCost,
    }),
    { totalQty: 0, totalCost: 0 },
  );
}

export type TransferAction = 'send' | 'receive';

const TRANSFER_TRANSITIONS: Record<TransferAction, StockTransferStatus> = {
  send: 'sent',
  receive: 'received',
};

const TRANSFER_PRECONDITIONS: Record<TransferAction, StockTransferStatus> = {
  send: 'draft',
  receive: 'sent',
};

/**
 * Advances a stock transfer's state machine: draft -> sent -> received.
 * Throws when the action is not valid from the current status.
 */
export function transferTransition(
  current: StockTransferStatus,
  action: TransferAction,
): StockTransferStatus {
  if (TRANSFER_PRECONDITIONS[action] !== current) {
    throw new Error(`Invalid transfer transition: cannot ${action} a transfer in status "${current}"`);
  }
  return TRANSFER_TRANSITIONS[action];
}

/** Difference between the counted and expected quantity for a stock count line. */
export function countVariance(line: Pick<StockCountLine, 'expected' | 'counted'>): number {
  return line.counted - line.expected;
}
