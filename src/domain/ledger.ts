/**
 * Receivables and payables, off one entry table.
 *
 * Sign convention, for both parties: `invoice` and `debit_note` raise what the party owes us,
 * `payment` and `credit_note` lower it. On the supplier side "owes us" reads as "we owe them",
 * which is the same number with the same sign, so one set of functions serves both screens.
 *
 * Aging needs to know which invoice a payment settled. A collection screen that lets the
 * cashier pick one records it as the payment's `refId`, and that allocation is honoured
 * exactly. A payment that names nothing - a cashier taking 2.000.000 đ off a customer with
 * four open bills - is applied oldest-invoice-first (FIFO by due date, then by creation),
 * which is both what a shop actually does and the only allocation reproducible from the data.
 */

import { roundVND, sum } from './money';
import type { Customer, LedgerEntry, LedgerParty } from './types';

/** How an entry moves the balance: +1 raises it, -1 lowers it. */
export function entrySign(entry: Pick<LedgerEntry, 'kind'>): 1 | -1 {
  return entry.kind === 'invoice' || entry.kind === 'debit_note' ? 1 : -1;
}

/** The entry's effect on the balance, signed. */
export function signedAmount(entry: Pick<LedgerEntry, 'kind' | 'amount'>): number {
  return entrySign(entry) * Math.max(0, entry.amount);
}

/** Entries for one party, oldest first. */
export function entriesFor(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  partyId: string,
): LedgerEntry[] {
  return entries
    .filter((entry) => entry.party === party && entry.partyId === partyId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Entries raised at one branch. Composable with every reader below
 * (`balances(entriesForStore(entries, storeId), 'customer')`) rather than an extra argument on
 * each of them, because most screens want the chain figure and only the branch debt report
 * wants this one. Entries with no branch are chain-level and are left out.
 */
export function entriesForStore(
  entries: readonly LedgerEntry[],
  storeId: string,
): LedgerEntry[] {
  return entries.filter((entry) => entry.storeId === storeId);
}

/** What the party still owes: positive means outstanding, negative means in credit. */
export function balanceFor(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  partyId: string,
): number {
  return sum(entriesFor(entries, party, partyId).map(signedAmount));
}

export interface PartyBalance {
  party: LedgerParty;
  partyId: string;
  balance: number;
  /** Portion of the balance whose due date has passed. */
  overdue: number;
  /** Due date of the oldest unsettled invoice, when there is one. */
  oldestDueDate?: Date;
  entryCount: number;
}

/** Balance and overdue amount for every party of a side that has any entry at all. */
export function balances(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date = new Date(),
): PartyBalance[] {
  const partyIds = [...new Set(entries.filter((entry) => entry.party === party).map((entry) => entry.partyId))];
  return partyIds
    .map((partyId) => {
      const open = openInvoices(entries, party, partyId);
      const overdueRows = open.filter((row) => isOverdue(row.dueDate, now));
      const withDue = open.filter((row) => row.dueDate !== undefined);
      return {
        party,
        partyId,
        balance: balanceFor(entries, party, partyId),
        overdue: sum(overdueRows.map((row) => row.openAmount)),
        oldestDueDate: withDue.length > 0 ? withDue[0].dueDate : undefined,
        entryCount: entriesFor(entries, party, partyId).length,
      };
    })
    .sort((a, b) => b.balance - a.balance);
}

function isOverdue(dueDate: Date | undefined, now: Date): boolean {
  if (!dueDate) return false;
  return dueDate.getTime() < now.getTime();
}

/** An invoice with however much of it is still unpaid after FIFO allocation. */
export interface OpenInvoice {
  entry: LedgerEntry;
  dueDate?: Date;
  /** Face value. */
  amount: number;
  /** What is left on it: 0 < openAmount <= amount. */
  openAmount: number;
}

function dueOrCreated(entry: LedgerEntry): number {
  return (entry.dueDate ?? entry.createdAt).getTime();
}

/**
 * The party's unsettled invoices, oldest due first.
 *
 * Credits are applied in two passes: first the ones that name an invoice through `refId`,
 * against that invoice alone, and then whatever is left over oldest-invoice-first. Overpaying
 * a named invoice does not strand the excess; it falls through to the FIFO pass with the rest.
 */
export function openInvoices(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  partyId: string,
): OpenInvoice[] {
  const rows = entriesFor(entries, party, partyId);
  const charges = rows
    .filter((entry) => entrySign(entry) === 1)
    .sort((a, b) => dueOrCreated(a) - dueOrCreated(b) || a.createdAt.getTime() - b.createdAt.getTime())
    .map((entry) => ({
      entry,
      dueDate: entry.dueDate,
      amount: Math.max(0, entry.amount),
      openAmount: Math.max(0, entry.amount),
    }));

  const chargeById = new Map(charges.map((charge) => [charge.entry.id, charge]));
  const credits = rows.filter((entry) => entrySign(entry) === -1);

  let credit = 0;
  for (const entry of credits) {
    const amount = Math.max(0, entry.amount);
    const target = entry.refId ? chargeById.get(entry.refId) : undefined;
    if (!target) {
      credit = roundVND(credit + amount);
      continue;
    }
    const applied = Math.min(amount, target.openAmount);
    target.openAmount = roundVND(target.openAmount - applied);
    credit = roundVND(credit + (amount - applied));
  }

  for (const charge of charges) {
    if (credit <= 0) break;
    const applied = Math.min(credit, charge.openAmount);
    charge.openAmount = roundVND(charge.openAmount - applied);
    credit = roundVND(credit - applied);
  }

  return charges.filter((charge) => charge.openAmount > 0);
}

/** Days past due; negative while the invoice is still within its term. */
export function daysOverdue(dueDate: Date | undefined, now: Date = new Date()): number {
  if (!dueDate) return 0;
  return Math.floor((now.getTime() - dueDate.getTime()) / 86_400_000);
}

/**
 * The four buckets the collections screen ages a balance into, plus what is not yet due.
 * A bucket name says how many days past the due date the money is.
 */
export interface Aging {
  /** Not yet due. */
  current: number;
  /** 1 to 30 days past due. */
  d1to30: number;
  /** 31 to 60. */
  d31to60: number;
  /** 61 to 90. */
  d61to90: number;
  /** More than 90. */
  over90: number;
  total: number;
}

const EMPTY_AGING: Aging = {
  current: 0,
  d1to30: 0,
  d31to60: 0,
  d61to90: 0,
  over90: 0,
  total: 0,
};

/** The bucket a number of days past due falls in. */
export function agingBucketFor(days: number): Exclude<keyof Aging, 'total'> {
  if (days <= 0) return 'current';
  if (days <= 30) return 'd1to30';
  if (days <= 60) return 'd31to60';
  if (days <= 90) return 'd61to90';
  return 'over90';
}

/** Ages one party's open invoices. */
export function agingFor(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  partyId: string,
  now: Date = new Date(),
): Aging {
  const open = openInvoices(entries, party, partyId);
  const result: Aging = { ...EMPTY_AGING };
  for (const row of open) {
    const bucket = agingBucketFor(daysOverdue(row.dueDate, now));
    result[bucket] = roundVND(result[bucket] + row.openAmount);
  }
  result.total = roundVND(
    result.current + result.d1to30 + result.d31to60 + result.d61to90 + result.over90,
  );
  return result;
}

/** Ages every party of a side together: the debt summary report's single row. */
export function agingTotals(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date = new Date(),
): Aging {
  const partyIds = [...new Set(entries.filter((entry) => entry.party === party).map((entry) => entry.partyId))];
  return partyIds.reduce<Aging>((total, partyId) => {
    const aging = agingFor(entries, party, partyId, now);
    return {
      current: roundVND(total.current + aging.current),
      d1to30: roundVND(total.d1to30 + aging.d1to30),
      d31to60: roundVND(total.d31to60 + aging.d31to60),
      d61to90: roundVND(total.d61to90 + aging.d61to90),
      over90: roundVND(total.over90 + aging.over90),
      total: roundVND(total.total + aging.total),
    };
  }, { ...EMPTY_AGING });
}

/** Parties with anything past due, worst first. */
export function overdueParties(
  entries: readonly LedgerEntry[],
  party: LedgerParty,
  now: Date = new Date(),
): PartyBalance[] {
  return balances(entries, party, now)
    .filter((row) => row.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue);
}

export interface CreditCheck {
  allowed: boolean;
  /** Current outstanding balance. */
  balance: number;
  limit: number;
  /** Headroom left before the limit, floored at 0. */
  available: number;
  /** What the balance would be if the order went on account. */
  projected: number;
}

/**
 * Whether a customer may take `amount` on account.
 *
 * No limit means no credit: a shop that has not agreed a limit with a buyer is not extending
 * one, and defaulting the other way would let any walk-in leave without paying.
 */
export function creditCheck(
  customer: Pick<Customer, 'id' | 'creditLimit'>,
  entries: readonly LedgerEntry[],
  amount: number,
): CreditCheck {
  const balance = balanceFor(entries, 'customer', customer.id);
  const limit = Math.max(0, customer.creditLimit ?? 0);
  const projected = roundVND(balance + Math.max(0, amount));
  return {
    allowed: limit > 0 && projected <= limit,
    balance,
    limit,
    available: Math.max(0, roundVND(limit - balance)),
    projected,
  };
}

/** The due date of an invoice raised now under a payment term. */
export function dueDateFor(createdAt: Date, paymentTermDays: number | undefined): Date | undefined {
  if (!paymentTermDays || paymentTermDays <= 0) return undefined;
  return new Date(createdAt.getTime() + paymentTermDays * 86_400_000);
}
