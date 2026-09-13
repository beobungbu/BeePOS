/**
 * Money that is owed and money that has moved: the receivables and payables ledger, the bank
 * accounts, and the cash book each branch keeps across shifts.
 *
 * The three belong together because a collection is all of them at once: it lowers a
 * customer's balance, it lands in a bank account or in the drawer, and it has to show on the
 * branch's cash book. Booking that in one action is what keeps the three reconciled.
 */

import { create } from 'zustand';
import type {
  BankAccount,
  CashBookEntry,
  CashBookKind,
  LedgerEntry,
  LedgerParty,
  ReturnRecord,
} from '../domain/types';
import { balanceFor } from '../domain/ledger';
import { demoSeed } from './chain-seed';
import {
  bankAccounts as seedBankAccounts,
  cashBook as seedCashBook,
  ledgerEntries as seedLedgerEntries,
} from './seed';

/**
 * One cash-book row, from whichever screen moved the money.
 *
 * `ref` is the document the row answers (an order id, a cash movement id, a payment entry
 * id). The row id is derived from it and a row whose id is already in the book is not written
 * again, so a screen that re-runs its side effects cannot double the drawer.
 */
export interface CashBookPost {
  orgId: string;
  storeId: string;
  kind: CashBookKind;
  amount: number;
  /** Stable key of the document this row answers; the row id is `cash-<ref>`. */
  ref: string;
  /** The document itself, for the screens that link back to it. Defaults to `ref`. */
  refId?: string;
  bankAccountId?: string;
  staffId: string;
  createdAt?: Date;
}

/** What a goods receipt bought on credit owes the partner. */
export interface SupplierInvoiceInput {
  orgId: string;
  storeId: string;
  supplierId: string;
  amount: number;
  /** The `GoodsReceipt` the bill is for; the entry id is derived from it. */
  receiptId: string;
  /** From the partner's payment terms; absent means the bill carries no due date. */
  dueDate?: Date;
  note?: string;
  createdAt?: Date;
}

/** Everything a collection or a supplier payment needs, minus what the store can derive. */
export interface SettlementInput {
  orgId: string;
  /** Branch the money moved at; stamped on both the ledger entry and the cash-book row. */
  storeId: string;
  party: LedgerParty;
  partyId: string;
  amount: number;
  staffId: string;
  /** Set when the money went through the bank rather than the drawer. */
  bankAccountId?: string;
  /**
   * Ledger id of the one invoice this payment settles. `openInvoices` honours it exactly and
   * spills any excess onto the next oldest bill, so a cashier who picks a bill gets that bill
   * cleared rather than the oldest one.
   */
  invoiceEntryId?: string;
  note?: string;
  createdAt?: Date;
}

/** A cash deposit carried from a branch drawer to one of the chain's bank accounts. */
export interface DepositInput {
  orgId: string;
  storeId: string;
  amount: number;
  bankAccountId: string;
  staffId: string;
  createdAt?: Date;
}

/** A note raised by hand: a discount granted after the fact, or a charge added to a bill. */
export interface ManualNoteInput {
  orgId: string;
  storeId: string;
  party: LedgerParty;
  partyId: string;
  kind: 'credit_note' | 'debit_note';
  amount: number;
  note?: string;
  createdAt?: Date;
}

/** Everything a supplier return's ledger entry needs; the return record carries the rest. */
export interface SupplierDebitNoteInput {
  orgId: string;
  storeId: string;
  supplierId: string;
  /** Value of the goods going back, at the cost they were received at. */
  amount: number;
  staffId: string;
  /** The `SupplierReturn` this note answers, so the payables screen can link back to it. */
  refId?: string;
  note?: string;
  createdAt?: Date;
}

interface LedgerState {
  entries: LedgerEntry[];
  bankAccounts: BankAccount[];
  cashBook: CashBookEntry[];
  addEntry: (entry: LedgerEntry) => void;
  removeEntry: (entryId: string) => void;
  addCashBookEntry: (entry: CashBookEntry) => void;
  /**
   * The one way cash reaches the book. Every till movement (a cash sale, a cash refund, a
   * drawer in or out, the hand-over at close) and every settlement goes through here, so the
   * cash book and the Z report are reading the same events rather than two private ledgers.
   *
   * Idempotent on `ref`: booking the same document twice leaves one row and returns it.
   * A non-positive amount books nothing.
   */
  postCashBook: (input: CashBookPost) => CashBookEntry | null;
  /**
   * The payables side of a goods receipt taken on credit: the chain owes the partner the
   * value of what arrived, due on their terms.
   *
   * Idempotent on the receipt, so confirming twice (or confirming and then using the
   * payables action on the same receipt) cannot raise the bill twice.
   */
  createSupplierInvoice: (input: SupplierInvoiceInput) => LedgerEntry | null;
  upsertBankAccount: (account: BankAccount) => void;
  removeBankAccount: (accountId: string) => void;
  /**
   * Records a payment against a party and the matching cash-book row in one step, and returns
   * the ledger entry so the caller can reference it. A non-positive amount is ignored.
   */
  settle: (input: SettlementInput) => LedgerEntry | null;
  /** Books a credit note, the ledger side of a return on a delivered wholesale order. */
  addCreditNote: (input: Omit<SettlementInput, 'bankAccountId'> & { refId?: string }) => LedgerEntry | null;
  /**
   * The payables side of a supplier return: goods go back, so what the chain owes the partner
   * comes down by their value.
   *
   * Named for the paperwork a Vietnamese shop actually issues (giấy báo nợ, a debit note to the
   * supplier) while booking the entry the ledger's sign convention needs. Those two disagree on
   * purpose: `entrySign` gives `debit_note` +1, which *raises* a balance, and on the supplier
   * side raising the balance means owing more. Booking a literal `debit_note` here would double
   * the payable instead of clearing it, which is why this call exists rather than each screen
   * choosing a `kind`.
   */
  createSupplierDebitNote: (input: SupplierDebitNoteInput) => LedgerEntry | null;
  /**
   * The ledger side of a return: lowers what the customer owes. The record carries the branch,
   * the org and the goods value, so nothing has to be recomputed here.
   *
   * `amount` defaults to the whole value of the goods that came back, which is right for a
   * plain return. On an exchange the caller passes the net still owed back after the
   * replacement goods are counted: the buyer took other stock away in part payment, so
   * crediting the gross would hand them the replacement for free.
   */
  createCreditNote: (customerId: string, record: ReturnRecord, amount?: number) => LedgerEntry | null;
  /** A credit or debit note typed in by a manager, against a customer or a supplier. */
  addManualNote: (input: ManualNoteInput) => LedgerEntry | null;
  /**
   * Cash carried from the branch drawer to a bank account. Money out of the till, so the cash
   * book gets an outflow row; no ledger entry, because nobody's debt moved.
   */
  deposit: (input: DepositInput) => CashBookEntry | null;
}

function nextId(prefix: string, existing: readonly { id: string }[]): string {
  return `${prefix}-${existing.length + 1}-${Date.now()}`;
}

/** Ledger id of the bill a goods receipt raises, so the same receipt can never raise two. */
export function supplierInvoiceId(receiptId: string): string {
  return `ledger-ap-${receiptId}`;
}

/** The ledger, the bank and the cash book a chain starts with: the seed, or nothing. */
export function ledgerSeedForActiveOrg(): Pick<
  LedgerState,
  'entries' | 'bankAccounts' | 'cashBook'
> {
  return {
    entries: demoSeed(seedLedgerEntries, []),
    bankAccounts: demoSeed(seedBankAccounts, []),
    cashBook: demoSeed(seedCashBook, []),
  };
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  ...ledgerSeedForActiveOrg(),

  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),

  postCashBook: (input) => {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    const id = `cash-${input.ref}`;
    const existing = get().cashBook.find((entry) => entry.id === id);
    if (existing) return existing;

    const entry: CashBookEntry = {
      id,
      orgId: input.orgId,
      storeId: input.storeId,
      kind: input.kind,
      amount: Math.round(input.amount),
      refId: input.refId ?? input.ref,
      bankAccountId: input.bankAccountId,
      staffId: input.staffId,
      createdAt: input.createdAt ?? new Date(),
    };
    set((state) => ({ cashBook: [...state.cashBook, entry] }));
    return entry;
  },

  createSupplierInvoice: (input) => {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    const id = supplierInvoiceId(input.receiptId);
    const existing = get().entries.find((entry) => entry.id === id);
    if (existing) return existing;

    const entry: LedgerEntry = {
      id,
      orgId: input.orgId,
      party: 'supplier',
      partyId: input.supplierId,
      storeId: input.storeId,
      kind: 'invoice',
      refType: 'receipt',
      refId: input.receiptId,
      amount: Math.round(input.amount),
      dueDate: input.dueDate,
      createdAt: input.createdAt ?? new Date(),
      note: input.note,
    };
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  removeEntry: (entryId) =>
    set((state) => ({ entries: state.entries.filter((entry) => entry.id !== entryId) })),

  addCashBookEntry: (entry) => set((state) => ({ cashBook: [...state.cashBook, entry] })),

  upsertBankAccount: (account) =>
    set((state) => {
      const exists = state.bankAccounts.some((item) => item.id === account.id);
      return {
        bankAccounts: exists
          ? state.bankAccounts.map((item) => (item.id === account.id ? account : item))
          : [...state.bankAccounts, account],
      };
    }),

  removeBankAccount: (accountId) =>
    set((state) => ({
      bankAccounts: state.bankAccounts.filter((account) => account.id !== accountId),
    })),

  settle: (input) => {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    const createdAt = input.createdAt ?? new Date();

    const entry: LedgerEntry = {
      id: nextId('ledger-pay', get().entries),
      orgId: input.orgId,
      party: input.party,
      partyId: input.partyId,
      storeId: input.storeId,
      kind: 'payment',
      // `refType` stays `manual` even when an invoice is named: `refId` on a credit holds the
      // ledger entry it settles, not a document, and `openInvoices` reads it that way.
      refType: 'manual',
      refId: input.invoiceEntryId,
      amount: input.amount,
      createdAt,
      note: input.note,
    };

    const cashKind: CashBookKind =
      input.party === 'customer' ? 'collection' : 'supplier_payment';

    set((state) => ({ entries: [...state.entries, entry] }));
    get().postCashBook({
      orgId: input.orgId,
      storeId: input.storeId,
      kind: cashKind,
      amount: input.amount,
      ref: entry.id,
      bankAccountId: input.bankAccountId,
      staffId: input.staffId,
      createdAt,
    });
    return entry;
  },

  addCreditNote: (input) => {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    const entry: LedgerEntry = {
      id: nextId('ledger-credit', get().entries),
      orgId: input.orgId,
      party: input.party,
      partyId: input.partyId,
      storeId: input.storeId,
      kind: 'credit_note',
      refType: 'return',
      refId: input.refId,
      amount: input.amount,
      createdAt: input.createdAt ?? new Date(),
      note: input.note,
    };
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  createSupplierDebitNote: (input) =>
    get().addCreditNote({
      orgId: input.orgId,
      storeId: input.storeId,
      party: 'supplier',
      partyId: input.supplierId,
      amount: input.amount,
      staffId: input.staffId,
      refId: input.refId,
      note: input.note,
      createdAt: input.createdAt,
    }),

  createCreditNote: (customerId, record, amount = record.refundAmount) =>
    get().addCreditNote({
      orgId: record.orgId,
      storeId: record.storeId,
      party: 'customer',
      partyId: customerId,
      amount,
      staffId: record.staffId,
      refId: record.id,
      createdAt: record.createdAt,
    }),

  addManualNote: (input) => {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    const entry: LedgerEntry = {
      id: nextId(input.kind === 'credit_note' ? 'ledger-credit' : 'ledger-debit', get().entries),
      orgId: input.orgId,
      party: input.party,
      partyId: input.partyId,
      storeId: input.storeId,
      kind: input.kind,
      refType: 'manual',
      amount: input.amount,
      createdAt: input.createdAt ?? new Date(),
      note: input.note,
    };
    set((state) => ({ entries: [...state.entries, entry] }));
    return entry;
  },

  deposit: (input) => {
    if (!input.bankAccountId) return null;
    return get().postCashBook({
      orgId: input.orgId,
      storeId: input.storeId,
      kind: 'deposit',
      amount: input.amount,
      // A deposit answers no document of its own, so the ref is minted here; the count keeps
      // two deposits booked in the same millisecond apart.
      ref: `deposit-${get().cashBook.length + 1}-${Date.now()}`,
      bankAccountId: input.bankAccountId,
      staffId: input.staffId,
      createdAt: input.createdAt,
    });
  },
}));

/** Id for a bank account added from the money area. */
export function makeBankAccountId(): string {
  return `bank-${Date.now()}`;
}

/** A party's current balance, read straight off the store. */
export function balanceOf(party: LedgerParty, partyId: string): number {
  return balanceFor(useLedgerStore.getState().entries, party, partyId);
}

/** The cash book of one branch, newest first. */
export function cashBookForStore(entries: CashBookEntry[], storeId: string): CashBookEntry[] {
  return entries
    .filter((entry) => entry.storeId === storeId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Money in minus money out on a branch's cash book. */
export function cashBookNet(entries: readonly CashBookEntry[]): number {
  const OUTFLOWS: readonly CashBookKind[] = ['refund', 'out', 'deposit', 'supplier_payment'];
  return entries.reduce(
    (total, entry) => total + (OUTFLOWS.includes(entry.kind) ? -entry.amount : entry.amount),
    0,
  );
}
