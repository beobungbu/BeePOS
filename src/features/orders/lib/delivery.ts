/**
 * What is still owed on a wholesale order, line by line.
 *
 * Partial delivery is the normal case in wholesale, so "how much of this order has actually
 * arrived" is a question every screen around the order asks. Kept pure and in one place so
 * the order detail, the delivery note dialog and the status rules cannot disagree.
 */

import { baseQtyOf } from '../../pos/lib/wholesale';
import type { DeliveryNote, Order, OrderLine } from '../../../domain/types';

export interface DeliveryProgressLine {
  line: OrderLine;
  /** Ordered quantity in base units, which is what a delivery note counts. */
  orderedQty: number;
  deliveredQty: number;
  /** Never negative: over-delivering a line reads as nothing left, not as a debt the other way. */
  remainingQty: number;
  /** Money value of the line, so the strip can split the order into delivered and pending. */
  lineTotal: number;
}

export interface DeliveryProgress {
  lines: DeliveryProgressLine[];
  deliveredValue: number;
  pendingValue: number;
  /** True when every ordered unit has been delivered. */
  complete: boolean;
}

/** Delivered quantities per product, counting delivered notes only. */
export function deliveredQtyFor(
  notes: readonly DeliveryNote[],
  orderId: string,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const note of notes) {
    if (note.orderId !== orderId || note.status !== 'delivered') continue;
    for (const line of note.lines) {
      totals[line.productId] = (totals[line.productId] ?? 0) + line.qty;
    }
  }
  return totals;
}

/**
 * Progress of an order against its delivery notes.
 *
 * Value is apportioned by the fraction of the line that has arrived, so an order half
 * delivered by quantity is half delivered by money, which is the figure the stat strip and
 * the sentence under the table both quote.
 */
export function deliveryProgress(order: Order, notes: readonly DeliveryNote[]): DeliveryProgress {
  const delivered = deliveredQtyFor(notes, order.id);
  let deliveredValue = 0;
  let pendingValue = 0;

  const lines = order.lines.map((line) => {
    const orderedQty = baseQtyOf(line);
    const deliveredQty = Math.min(delivered[line.productId] ?? 0, orderedQty);
    const remainingQty = Math.max(0, orderedQty - deliveredQty);
    const lineTotal = line.unitPrice * line.qty;
    const share = orderedQty > 0 ? deliveredQty / orderedQty : 0;
    deliveredValue += Math.round(lineTotal * share);
    pendingValue += Math.round(lineTotal * (1 - share));
    return { line, orderedQty, deliveredQty, remainingQty, lineTotal };
  });

  return {
    lines,
    deliveredValue,
    pendingValue,
    complete: lines.every((line) => line.remainingQty === 0),
  };
}

/** The pending note quantities a new delivery note should default to: everything still owed. */
export function defaultNoteLines(progress: DeliveryProgress): { productId: string; qty: number }[] {
  return progress.lines
    .filter((line) => line.remainingQty > 0)
    .map((line) => ({ productId: line.line.productId, qty: line.remainingQty }));
}

/** Sequence number for the next delivery note of an order: `PGH<yyyymmdd>-<seq>`. */
export function nextDeliveryNoteCode(
  notes: readonly DeliveryNote[],
  orderId: string,
  at: Date,
): string {
  const year = at.getFullYear();
  const month = String(at.getMonth() + 1).padStart(2, '0');
  const day = String(at.getDate()).padStart(2, '0');
  const count = notes.filter((note) => note.orderId === orderId).length + 1;
  return `PGH${year}${month}${day}-${String(count).padStart(4, '0')}`;
}
