/**
 * The arithmetic a purchase order screen would otherwise redo in three places: what was
 * ordered, what has arrived, what is still owed, and what a line's badge should say.
 */

import { sum } from '../../../domain/money';
import type { PurchaseOrder, PurchaseOrderLine } from '../../../domain/types';

export interface PurchaseOrderTotals {
  orderedQty: number;
  receivedQty: number;
  outstandingQty: number;
  orderedValue: number;
  receivedValue: number;
  outstandingValue: number;
}

/** Units still to come on one line. Never negative, even after an over-receive. */
export function outstandingOf(line: PurchaseOrderLine): number {
  return Math.max(0, line.qty - line.receivedQty);
}

/** Works off any object carrying lines, so a draft that is not an order yet can be totalled. */
export function purchaseOrderTotals(order: { lines: readonly PurchaseOrderLine[] }): PurchaseOrderTotals {
  const orderedQty = sum(order.lines.map((line) => line.qty));
  const receivedQty = sum(order.lines.map((line) => Math.min(line.qty, line.receivedQty)));
  const orderedValue = sum(order.lines.map((line) => line.qty * line.unitCost));
  const receivedValue = sum(order.lines.map((line) => Math.min(line.qty, line.receivedQty) * line.unitCost));
  return {
    orderedQty,
    receivedQty,
    outstandingQty: orderedQty - receivedQty,
    orderedValue,
    receivedValue,
    outstandingValue: orderedValue - receivedValue,
  };
}

export type PurchaseOrderLineState = 'full' | 'partial' | 'none';

/** Complete, part delivered, or nothing yet: the badge the spec puts on every line. */
export function lineState(line: PurchaseOrderLine): PurchaseOrderLineState {
  if (line.receivedQty >= line.qty) return 'full';
  return line.receivedQty > 0 ? 'partial' : 'none';
}

/** Whether a purchase order may still be edited: only a draft may. */
export function isEditable(order: PurchaseOrder | undefined): boolean {
  return !order || order.status === 'draft';
}

/** Whether a purchase order may still take a delivery. */
export function canReceive(order: PurchaseOrder): boolean {
  return (order.status === 'sent' || order.status === 'partial') && purchaseOrderTotals(order).outstandingQty > 0;
}

/**
 * `PO-HN01-20260913-001`: branch, day, running number.
 *
 * The branch is in the code because a purchase order is raised by one shop and a supplier
 * reads the code off the delivery note to know where the goods go; a chain-wide sequence would
 * make two shops' orders on the same day differ by a digit. The number runs per branch and
 * per day, so it is derivable from the documents already on file rather than from a counter.
 */
export function purchaseOrderCodePrefix(storeCode: string, at: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `PO-${storeCode}-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-`;
}

export function nextPurchaseOrderCode(
  existing: readonly PurchaseOrder[],
  storeCode: string,
  at: Date = new Date(),
): string {
  const prefix = purchaseOrderCodePrefix(storeCode, at);
  const used = existing
    .filter((order) => order.code.startsWith(prefix))
    .map((order) => Number(order.code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));
  const next = used.length > 0 ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

/** The quantities keyed by product that a receive form starts with: everything outstanding. */
export function defaultReceiveQuantities(order: PurchaseOrder): Record<string, number> {
  return Object.fromEntries(order.lines.map((line) => [line.productId, outstandingOf(line)]));
}
