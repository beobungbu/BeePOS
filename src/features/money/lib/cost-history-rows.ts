/**
 * The seven columns of the cost history table, built from what is actually stored.
 *
 * `CostHistory` keeps the answer (the new average) and not the arithmetic, so quantity and
 * incoming price are read back off the receipt the row names. The on-hand before the receipt
 * is the one figure nothing stores; it is recovered from the weighted average itself, and only
 * where the recovery is sound. The alternative, printing today's stock in a column headed
 * "tồn trước", would be a wrong number in a table whose whole point is being checkable.
 */

import { roundVND } from '../../../domain/money';
import type { CostHistory, GoodsReceipt } from '../../../domain/types';

export interface CostHistoryRow {
  history: CostHistory;
  /** Average in force before this row, absent on the first row of a product. */
  averageBefore?: number;
  /** Average this row put in force. */
  averageAfter: number;
  /** Units the receipt brought in. */
  qtyIn?: number;
  /** Price paid on the receipt. */
  unitCostIn?: number;
  /** Stock held before the receipt, when it can be recovered from the average. */
  onHandBefore?: number;
  /** Document code of the receipt, for the caption under the source badge. */
  refId?: string;
}

/**
 * Recovers the stock a receipt was blended against:
 * `BQ sau = (tồn trước x BQ trước + SL nhập x giá nhập) / (tồn trước + SL nhập)` solved for
 * tồn trước. Returns `undefined` when the two averages are within a dong of each other, where
 * rounding makes the division meaningless, and when the result is not a plausible quantity.
 */
export function onHandBeforeFromAverages(input: {
  qtyIn: number;
  unitCostIn: number;
  averageBefore: number;
  averageAfter: number;
}): number | undefined {
  const { qtyIn, unitCostIn, averageBefore, averageAfter } = input;
  const gap = averageAfter - averageBefore;
  if (!Number.isFinite(gap) || Math.abs(gap) < 1) return undefined;
  if (!(qtyIn > 0)) return undefined;

  const onHand = (qtyIn * (unitCostIn - averageAfter)) / gap;
  if (!Number.isFinite(onHand) || onHand < 0) return undefined;
  // A receipt blended against a thousand times its own size is a rounding artefact, not stock.
  if (onHand > qtyIn * 1000) return undefined;
  return Math.round(onHand);
}

/** Units of one product a receipt brought in, and what they cost. */
function receiptLineFor(
  receipt: GoodsReceipt | undefined,
  productId: string,
): { qty: number; unitCost: number } | undefined {
  const lines = receipt?.lines.filter((line) => line.productId === productId) ?? [];
  if (lines.length === 0) return undefined;
  const qty = lines.reduce((total, line) => total + Math.max(0, line.qty), 0);
  if (qty <= 0) return { qty: 0, unitCost: lines[0].unitCost };
  const value = lines.reduce((total, line) => total + Math.max(0, line.qty) * line.unitCost, 0);
  return { qty, unitCost: roundVND(value / qty) };
}

/**
 * Turns a product's cost history into table rows, oldest first. `history` is expected to be
 * already scoped to the product and branch (`costHistoryFor`), so this only walks it.
 */
export function costHistoryRows(
  history: readonly CostHistory[],
  receipts: readonly GoodsReceipt[],
  productId: string,
): CostHistoryRow[] {
  const receiptById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  let previous: number | undefined;

  return history.map((row) => {
    const line = row.source === 'receipt' ? receiptLineFor(receiptById.get(row.refId ?? ''), productId) : undefined;
    const averageBefore = previous;
    previous = row.unitCost;

    return {
      history: row,
      averageBefore,
      averageAfter: row.unitCost,
      qtyIn: line?.qty,
      unitCostIn: line?.unitCost,
      onHandBefore:
        line && averageBefore !== undefined
          ? onHandBeforeFromAverages({
              qtyIn: line.qty,
              unitCostIn: line.unitCost,
              averageBefore,
              averageAfter: row.unitCost,
            })
          : averageBefore === undefined
            ? 0
            : undefined,
      refId: row.refId,
    };
  });
}
