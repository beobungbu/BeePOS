/**
 * What a collection or a supplier payment actually settles, worked out before it is written.
 *
 * The ledger already decides this on read (`openInvoices`: a named invoice first, then oldest
 * due first). The dialog has to show the same answer *before* the money is taken, so this
 * mirrors that rule rather than inventing a second one. Keep the two in step: a dialog that
 * promises one allocation and a ledger that books another is worse than no preview.
 */

import { daysOverdue, type OpenInvoice } from '../../../domain/ledger';
import { roundVND } from '../../../domain/money';

export interface AllocationLine {
  /** Ledger id of the invoice this slice of the payment lands on. */
  entryId: string;
  dueDate?: Date;
  /** Days past due, negative while still inside the term. */
  daysOverdue: number;
  /** What was open on the invoice before this payment. */
  openAmount: number;
  /** How much of the payment goes to it. */
  applied: number;
}

export interface PaymentAllocation {
  lines: AllocationLine[];
  /** Total put against invoices. */
  allocated: number;
  /** Money taken that no open invoice needs; it sits on the account as credit. */
  unapplied: number;
  balanceBefore: number;
  balanceAfter: number;
}

/**
 * Splits `amount` across the open invoices: the one named by `invoiceEntryId` first, then the
 * rest oldest due first. A payment larger than the debt leaves the excess in `unapplied`.
 */
export function allocatePayment(
  open: readonly OpenInvoice[],
  amount: number,
  balanceBefore: number,
  invoiceEntryId?: string,
  now: Date = new Date(),
): PaymentAllocation {
  const payment = Number.isFinite(amount) ? Math.max(0, roundVND(amount)) : 0;
  const named = invoiceEntryId ? open.filter((row) => row.entry.id === invoiceEntryId) : [];
  const rest = open.filter((row) => row.entry.id !== invoiceEntryId);
  const ordered = [...named, ...rest];

  let left = payment;
  const lines: AllocationLine[] = [];
  for (const row of ordered) {
    if (left <= 0) break;
    const applied = Math.min(left, row.openAmount);
    if (applied <= 0) continue;
    left = roundVND(left - applied);
    lines.push({
      entryId: row.entry.id,
      dueDate: row.dueDate,
      daysOverdue: daysOverdue(row.dueDate, now),
      openAmount: row.openAmount,
      applied,
    });
  }

  return {
    lines,
    allocated: roundVND(payment - left),
    unapplied: left,
    balanceBefore: roundVND(balanceBefore),
    balanceAfter: roundVND(balanceBefore - payment),
  };
}

/** Total still open across a party's invoices that are past due. */
export function overdueAmount(open: readonly OpenInvoice[], now: Date = new Date()): number {
  return roundVND(
    open
      .filter((row) => daysOverdue(row.dueDate, now) > 0)
      .reduce((total, row) => total + row.openAmount, 0),
  );
}

/**
 * The quick chips under the amount field: pay it all, pay what is overdue, and a round number
 * below both. Zero and duplicate offers are dropped, so the row never shows the same figure
 * twice or a chip that does nothing.
 */
export function quickAmounts(balance: number, overdue: number, round = 10_000_000): number[] {
  return [balance, overdue, round]
    .map((value) => roundVND(value))
    .filter((value, index, all) => value > 0 && value <= balance && all.indexOf(value) === index);
}
