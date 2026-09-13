/**
 * Returns, exchanges and what happens to the goods that come back.
 *
 * Distinct from `src/domain/orders.ts`'s refunds on purpose. A refund is a money movement
 * against an order; a return also decides where each unit goes. `restock` puts it back on the
 * shelf, `damaged` does not and produces a write-off instead, and getting that wrong is the
 * difference between a stock figure that reconciles and one that does not.
 */

import { roundVND, sum } from './money';
import type {
  Order,
  ReturnDisposition,
  ReturnLine,
  ReturnRecord,
  WriteOff,
} from './types';

/** A line the cashier is asking to take back. */
export interface ReturnRequestLine {
  productId: string;
  qty: number;
  reason: string;
  disposition: ReturnDisposition;
}

export interface ReturnPlanInput {
  order: Order;
  requestLines: readonly ReturnRequestLine[];
  /** Returns already recorded against this order; caps what is still returnable. */
  priorReturns?: readonly ReturnRecord[];
}

export interface ReturnPlanResult {
  valid: boolean;
  /** Machine-readable enough to log; the UI owns the copy. */
  error?: string;
  lines: ReturnLine[];
  /** Money owed back for the returned lines, at the price they were sold. */
  refundAmount: number;
  /** Units going back on the shelf. */
  restockLines: ReturnLine[];
  /** Units going to the write-off log instead. */
  damagedLines: ReturnLine[];
}

const EMPTY_PLAN: Omit<ReturnPlanResult, 'valid' | 'error'> = {
  lines: [],
  refundAmount: 0,
  restockLines: [],
  damagedLines: [],
};

function fail(error: string): ReturnPlanResult {
  return { valid: false, error, ...EMPTY_PLAN };
}

/** How many units of a product earlier returns already took back. */
export function returnedQty(
  priorReturns: readonly ReturnRecord[],
  orderId: string,
  productId: string,
): number {
  return priorReturns
    .filter((record) => record.orderId === orderId)
    .flatMap((record) => record.lines)
    .filter((line) => line.productId === productId)
    .reduce((total, line) => total + line.qty, 0);
}

/** Units of a product still returnable on an order. Never negative. */
export function remainingReturnableQty(
  order: Order,
  priorReturns: readonly ReturnRecord[],
  productId: string,
): number {
  const sold = order.lines
    .filter((line) => line.productId === productId)
    .reduce((total, line) => total + line.qty, 0);
  return Math.max(0, sold - returnedQty(priorReturns, order.id, productId));
}

/**
 * Validates a return request and prices it.
 *
 * A line is refunded at the price it was actually sold for, which is the order line's unit
 * price after its own line discount. Order-level discount and tax are deliberately not
 * redistributed here: `src/domain/orders.ts` owns that proportional split for money, and a
 * second, subtly different version of it in this module is how two screens end up disagreeing
 * about what a customer is owed. `refundAmount` is therefore the goods value; the money screen
 * is free to net it through `refundPlan`.
 */
export function returnPlan({
  order,
  requestLines,
  priorReturns = [],
}: ReturnPlanInput): ReturnPlanResult {
  if (requestLines.length === 0) return fail('no lines selected');

  const lines: ReturnLine[] = [];
  const requestedByProduct = new Map<string, number>();

  for (const request of requestLines) {
    if (!Number.isFinite(request.qty) || request.qty <= 0) {
      return fail(`invalid qty for product ${request.productId}`);
    }
    if (!request.reason.trim()) {
      return fail(`missing reason for product ${request.productId}`);
    }

    const orderLine = order.lines.find((line) => line.productId === request.productId);
    if (!orderLine) return fail(`product ${request.productId} is not on this order`);

    const alreadyRequested = requestedByProduct.get(request.productId) ?? 0;
    const remaining = remainingReturnableQty(order, priorReturns, request.productId);
    if (alreadyRequested + request.qty > remaining) {
      return fail(`qty exceeds remaining returnable (${remaining}) for product ${request.productId}`);
    }
    requestedByProduct.set(request.productId, alreadyRequested + request.qty);

    const netUnitPrice = netUnitPriceOf(orderLine);
    lines.push({
      productId: request.productId,
      qty: request.qty,
      reason: request.reason.trim(),
      disposition: request.disposition,
      unitPrice: roundVND(netUnitPrice),
    });
  }

  return {
    valid: true,
    lines,
    refundAmount: sum(lines.map((line) => line.unitPrice * line.qty)),
    restockLines: lines.filter((line) => line.disposition === 'restock'),
    damagedLines: lines.filter((line) => line.disposition === 'damaged'),
  };
}

/** Unit price of an order line after its own line discount. */
function netUnitPriceOf(line: Order['lines'][number]): number {
  const gross = line.unitPrice;
  if (!line.lineDiscount || line.qty <= 0) return gross;
  if (line.lineDiscount.type === 'percent') {
    return gross * (1 - line.lineDiscount.value / 100);
  }
  return Math.max(0, gross - line.lineDiscount.value / line.qty);
}

export interface DispositionSplit {
  restockQty: number;
  damagedQty: number;
  restockValue: number;
  damagedValue: number;
}

/** Quantity and value going each way, for the confirmation summary. */
export function dispositionSplit(lines: readonly ReturnLine[]): DispositionSplit {
  const restock = lines.filter((line) => line.disposition === 'restock');
  const damaged = lines.filter((line) => line.disposition === 'damaged');
  return {
    restockQty: restock.reduce((total, line) => total + line.qty, 0),
    damagedQty: damaged.reduce((total, line) => total + line.qty, 0),
    restockValue: sum(restock.map((line) => line.unitPrice * line.qty)),
    damagedValue: sum(damaged.map((line) => line.unitPrice * line.qty)),
  };
}

export interface ExchangeResult {
  /** Value coming back. */
  returnValue: number;
  /** Value going out on the replacement lines. */
  replacementValue: number;
  /** Net movement: positive means the customer pays, negative means they are refunded. */
  net: number;
  /** What the customer has to hand over now; 0 when they are owed money. */
  amountDue: number;
  /** What the till hands back now; 0 when the customer owes. */
  refundDue: number;
}

/**
 * Nets a return against the replacement lines it was swapped for. One transaction, one
 * number: the cashier either takes money or gives it, never both.
 */
export function netExchangeAmount(returnValue: number, replacementValue: number): ExchangeResult {
  const back = Math.max(0, roundVND(returnValue));
  const out = Math.max(0, roundVND(replacementValue));
  const net = roundVND(out - back);
  return {
    returnValue: back,
    replacementValue: out,
    net,
    amountDue: net > 0 ? net : 0,
    refundDue: net < 0 ? -net : 0,
  };
}

export interface WriteOffInput {
  orgId: string;
  storeId: string;
  staffId: string;
  returnId: string;
  createdAt?: Date;
}

/**
 * The write-off rows a return's damaged lines produce. Stock is reduced by the write-off, not
 * by the return, so damaged goods never come back into sellable stock.
 */
export function writeOffsForReturn(
  lines: readonly ReturnLine[],
  { orgId, storeId, staffId, returnId, createdAt = new Date() }: WriteOffInput,
): WriteOff[] {
  return lines
    .filter((line) => line.disposition === 'damaged')
    .map((line, index) => ({
      id: `writeoff-${returnId}-${index + 1}`,
      orgId,
      storeId,
      productId: line.productId,
      qty: line.qty,
      reason: line.reason,
      refId: returnId,
      staffId,
      createdAt,
    }));
}

/** Total value written off in a period, for the shrinkage figure on the inventory report. */
export function writeOffValue(
  writeOffs: readonly WriteOff[],
  costFor: (productId: string) => number,
): number {
  return sum(writeOffs.map((entry) => costFor(entry.productId) * entry.qty));
}
