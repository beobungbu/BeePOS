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
} from '../domain/types';
import { balanceFor } from '../domain/ledger';
import {
  bankAccounts as seedBankAccounts,
  cashBook as seedCashBook,
  ledgerEntries as seedLedgerEntries,
} from './seed';

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
  upsertBankAccount: (account: BankAccount) => void;
  removeBankAccount: (accountId: string) => void;
  /**
   * Records a payment against a party and the matching cash-book row in one step, and returns
   * the ledger entry so the caller can reference it. A non-positive amount is ignored.
   */
  settle: (input: SettlementInput) => LedgerEntry | null;
  /** Books a credit note, the ledger side of a return on a delivered wholesale order. */
  addCreditNote: (input: Omit<SettlementInput, 'bankAccountId'> & { refId?: string }) => LedgerEntry | null;
}

function nextId(prefix: string, existing: readonly { id: string }[]): string {
  return `${prefix}-${existing.length + 1}-${Date.now()}`;
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  entries: seedLedgerEntries,
  bankAccounts: seedBankAccounts,
  cashBook: seedCashBook,

  addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),

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
      refType: 'manual',
      amount: input.amount,
      createdAt,
      note: input.note,
    };

    const cashKind: CashBookKind =
      input.party === 'customer' ? 'collection' : 'supplier_payment';

    const cashEntry: CashBookEntry = {
      id: `cash-${entry.id}`,
      orgId: input.orgId,
      storeId: input.storeId,
      kind: cashKind,
      amount: input.amount,
      refId: entry.id,
      bankAccountId: input.bankAccountId,
      staffId: input.staffId,
      createdAt,
    };

    set((state) => ({
      entries: [...state.entries, entry],
      cashBook: [...state.cashBook, cashEntry],
    }));
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
}));

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
