/**
 * Reading a branch's cash book: direction, running balance and the totals above it.
 *
 * The running balance is the drawer, which is why a collection or a supplier payment settled
 * through the bank is not in here at all: the spec says a transfer "never touches the drawer",
 * and a row that moves no cash but sits inside a running balance column is how a cash count
 * stops reconciling. A deposit is the one banked row that belongs, because the cash left the
 * till on its way to the bank.
 */

import { roundVND } from '../../../domain/money';
import type { CashBookEntry, CashBookKind } from '../../../domain/types';

/** Kinds that put money into the drawer. */
export const CASH_IN_KINDS: readonly CashBookKind[] = ['sale', 'in', 'collection'];
/** Kinds that take money out of it. */
export const CASH_OUT_KINDS: readonly CashBookKind[] = ['refund', 'out', 'deposit', 'supplier_payment'];

/** Every kind, in the order the filter offers them. */
export const CASH_BOOK_KINDS: readonly CashBookKind[] = [...CASH_IN_KINDS, ...CASH_OUT_KINDS];

/** Which way a kind moves the drawer: +1 in, -1 out. */
export function cashDirection(kind: CashBookKind): 1 | -1 {
  return CASH_OUT_KINDS.includes(kind) ? -1 : 1;
}

/** Whether the entry moved notes in the till rather than money between bank accounts. */
export function affectsDrawer(entry: Pick<CashBookEntry, 'kind' | 'bankAccountId'>): boolean {
  return entry.kind === 'deposit' || !entry.bankAccountId;
}

/** The entry's effect on the drawer, signed. */
export function signedCashAmount(entry: Pick<CashBookEntry, 'kind' | 'amount'>): number {
  return cashDirection(entry.kind) * Math.max(0, entry.amount);
}

/** One branch's drawer movements, oldest first. */
export function drawerEntries(
  entries: readonly CashBookEntry[],
  storeId: string,
): CashBookEntry[] {
  return entries
    .filter((entry) => entry.storeId === storeId && affectsDrawer(entry))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/** Sum of the drawer effect of a set of entries. */
export function cashNet(entries: readonly CashBookEntry[]): number {
  return roundVND(entries.reduce((total, entry) => total + signedCashAmount(entry), 0));
}

export interface CashBookRow {
  entry: CashBookEntry;
  /** Signed effect on the drawer. */
  delta: number;
  /** Drawer balance after this row. */
  balance: number;
}

/**
 * Rows with the running balance the manager reads back against a cash count, newest first.
 * `opening` is the drawer before the first entry given, so a filtered day still reconciles.
 */
export function cashBookRows(
  entries: readonly CashBookEntry[],
  opening = 0,
): CashBookRow[] {
  const oldestFirst = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  let balance = roundVND(opening);
  const rows = oldestFirst.map((entry) => {
    const delta = signedCashAmount(entry);
    balance = roundVND(balance + delta);
    return { entry, delta, balance };
  });
  return rows.reverse();
}

export interface CashBookTotals {
  opening: number;
  inflow: number;
  outflow: number;
  closing: number;
}

/** The four figures above the table: opening, money in, money out, closing. */
export function cashBookTotals(
  entries: readonly CashBookEntry[],
  opening = 0,
): CashBookTotals {
  const inflow = roundVND(
    entries.filter((entry) => cashDirection(entry.kind) === 1).reduce((total, entry) => total + Math.max(0, entry.amount), 0),
  );
  const outflow = roundVND(
    entries.filter((entry) => cashDirection(entry.kind) === -1).reduce((total, entry) => total + Math.max(0, entry.amount), 0),
  );
  return { opening: roundVND(opening), inflow, outflow, closing: roundVND(opening + inflow - outflow) };
}

/** Entries inside a half-open range, as the period filter hands it over. */
export function entriesInRange(
  entries: readonly CashBookEntry[],
  start: Date,
  end: Date,
): CashBookEntry[] {
  return entries.filter(
    (entry) => entry.createdAt.getTime() >= start.getTime() && entry.createdAt.getTime() < end.getTime(),
  );
}

/** Drawer balance carried into a range: everything before it. */
export function openingBalanceAt(entries: readonly CashBookEntry[], start: Date): number {
  return cashNet(entries.filter((entry) => entry.createdAt.getTime() < start.getTime()));
}
