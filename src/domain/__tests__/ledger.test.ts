import type { LedgerEntry } from '../types';
import {
  agingBucketFor,
  agingFor,
  agingTotals,
  balanceFor,
  balances,
  creditCheck,
  daysOverdue,
  dueDateFor,
  entriesForStore,
  entrySign,
  openInvoices,
  overdueParties,
  signedAmount,
} from '../ledger';

const NOW = new Date('2026-09-11T00:00:00.000Z');

function day(offset: number): Date {
  return new Date(NOW.getTime() + offset * 86_400_000);
}

function entry(overrides: Partial<LedgerEntry> & Pick<LedgerEntry, 'id' | 'kind' | 'amount'>): LedgerEntry {
  return {
    orgId: 'org-1',
    party: 'customer',
    partyId: 'c1',
    refType: 'manual',
    createdAt: day(-60),
    ...overrides,
  } as LedgerEntry;
}

describe('signs', () => {
  it('raises the balance for invoices and debit notes', () => {
    expect(entrySign({ kind: 'invoice' })).toBe(1);
    expect(entrySign({ kind: 'debit_note' })).toBe(1);
  });

  it('lowers it for payments and credit notes', () => {
    expect(signedAmount({ kind: 'payment', amount: 1000 })).toBe(-1000);
    expect(signedAmount({ kind: 'credit_note', amount: 1000 })).toBe(-1000);
  });

  it('ignores a negative amount rather than flipping the direction', () => {
    expect(signedAmount({ kind: 'invoice', amount: -500 })).toBe(0);
  });
});

describe('balanceFor', () => {
  const entries: LedgerEntry[] = [
    entry({ id: 'a', kind: 'invoice', amount: 100_000 }),
    entry({ id: 'b', kind: 'payment', amount: 30_000 }),
    entry({ id: 'c', kind: 'credit_note', amount: 10_000 }),
    entry({ id: 'd', kind: 'invoice', amount: 50_000, partyId: 'c2' }),
    entry({ id: 'e', kind: 'invoice', amount: 70_000, party: 'supplier', partyId: 'c1' }),
  ];

  it('nets one party on one side only', () => {
    expect(balanceFor(entries, 'customer', 'c1')).toBe(60_000);
    expect(balanceFor(entries, 'supplier', 'c1')).toBe(70_000);
  });

  it('is zero for a party with no entries', () => {
    expect(balanceFor(entries, 'customer', 'nobody')).toBe(0);
  });
});

describe('entriesForStore', () => {
  const entries: LedgerEntry[] = [
    entry({ id: 'a', kind: 'invoice', amount: 10_000, storeId: 'store-1' }),
    entry({ id: 'b', kind: 'invoice', amount: 20_000, storeId: 'store-2' }),
    entry({ id: 'c', kind: 'invoice', amount: 30_000 }),
  ];

  it('narrows to one branch and leaves chain-level entries out', () => {
    expect(entriesForStore(entries, 'store-1').map((row) => row.id)).toEqual(['a']);
  });

  it('composes with the readers rather than changing their signatures', () => {
    expect(balanceFor(entriesForStore(entries, 'store-2'), 'customer', 'c1')).toBe(20_000);
    expect(balanceFor(entries, 'customer', 'c1')).toBe(60_000);
  });
});

describe('openInvoices', () => {
  it('applies credit to the oldest due invoice first', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'old', kind: 'invoice', amount: 40_000, dueDate: day(-40) }),
      entry({ id: 'new', kind: 'invoice', amount: 60_000, dueDate: day(-5) }),
      entry({ id: 'pay', kind: 'payment', amount: 50_000 }),
    ];
    const open = openInvoices(entries, 'customer', 'c1');
    expect(open).toHaveLength(1);
    expect(open[0].entry.id).toBe('new');
    expect(open[0].openAmount).toBe(50_000);
  });

  it('applies a payment that names an invoice to that invoice', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'old', kind: 'invoice', amount: 40_000, dueDate: day(-40) }),
      entry({ id: 'new', kind: 'invoice', amount: 60_000, dueDate: day(-5) }),
      entry({ id: 'pay', kind: 'payment', amount: 20_000, refId: 'new' }),
    ];
    const open = openInvoices(entries, 'customer', 'c1');
    expect(open.map((row) => [row.entry.id, row.openAmount])).toEqual([
      ['old', 40_000],
      ['new', 40_000],
    ]);
  });

  it('lets an overpayment of a named invoice fall through to the rest', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'old', kind: 'invoice', amount: 40_000, dueDate: day(-40) }),
      entry({ id: 'new', kind: 'invoice', amount: 10_000, dueDate: day(-5) }),
      entry({ id: 'pay', kind: 'payment', amount: 30_000, refId: 'new' }),
    ];
    const open = openInvoices(entries, 'customer', 'c1');
    expect(open.map((row) => [row.entry.id, row.openAmount])).toEqual([['old', 20_000]]);
  });

  it('leaves nothing open when credit outruns the invoices', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'i', kind: 'invoice', amount: 10_000, dueDate: day(-1) }),
      entry({ id: 'p', kind: 'payment', amount: 40_000 }),
    ];
    expect(openInvoices(entries, 'customer', 'c1')).toEqual([]);
  });
});

describe('aging', () => {
  it('maps days past due to buckets at the boundaries', () => {
    expect(agingBucketFor(0)).toBe('current');
    expect(agingBucketFor(1)).toBe('d1to30');
    expect(agingBucketFor(30)).toBe('d1to30');
    expect(agingBucketFor(31)).toBe('d31to60');
    expect(agingBucketFor(60)).toBe('d31to60');
    expect(agingBucketFor(61)).toBe('d61to90');
    expect(agingBucketFor(90)).toBe('d61to90');
    expect(agingBucketFor(91)).toBe('over90');
  });

  it('counts days from the due date', () => {
    expect(daysOverdue(day(-10), NOW)).toBe(10);
    expect(daysOverdue(day(5), NOW)).toBe(-5);
    expect(daysOverdue(undefined, NOW)).toBe(0);
  });

  it('spreads open invoices across buckets and totals them', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'a', kind: 'invoice', amount: 10_000, dueDate: day(5) }),
      entry({ id: 'b', kind: 'invoice', amount: 20_000, dueDate: day(-15) }),
      entry({ id: 'c', kind: 'invoice', amount: 30_000, dueDate: day(-45) }),
      entry({ id: 'd', kind: 'invoice', amount: 40_000, dueDate: day(-120) }),
    ];
    expect(agingFor(entries, 'customer', 'c1', NOW)).toEqual({
      current: 10_000,
      d1to30: 20_000,
      d31to60: 30_000,
      d61to90: 0,
      over90: 40_000,
      total: 100_000,
    });
  });

  it('adds up every party of a side', () => {
    const entries: LedgerEntry[] = [
      entry({ id: 'a', kind: 'invoice', amount: 10_000, dueDate: day(-2) }),
      entry({ id: 'b', kind: 'invoice', amount: 25_000, dueDate: day(-2), partyId: 'c2' }),
    ];
    expect(agingTotals(entries, 'customer', NOW).d1to30).toBe(35_000);
  });
});

describe('balances and overdueParties', () => {
  const entries: LedgerEntry[] = [
    entry({ id: 'a', kind: 'invoice', amount: 100_000, dueDate: day(-10) }),
    entry({ id: 'b', kind: 'payment', amount: 40_000 }),
    entry({ id: 'c', kind: 'invoice', amount: 20_000, dueDate: day(30), partyId: 'c2' }),
  ];

  it('reports balance, overdue amount and the oldest due date', () => {
    const [first] = balances(entries, 'customer', NOW);
    expect(first.partyId).toBe('c1');
    expect(first.balance).toBe(60_000);
    expect(first.overdue).toBe(60_000);
    expect(first.oldestDueDate).toEqual(day(-10));
  });

  it('leaves a party whose invoice is not yet due out of the overdue list', () => {
    expect(overdueParties(entries, 'customer', NOW).map((row) => row.partyId)).toEqual(['c1']);
  });
});

describe('creditCheck', () => {
  const entries: LedgerEntry[] = [entry({ id: 'a', kind: 'invoice', amount: 60_000 })];

  it('allows an order that stays inside the limit', () => {
    const result = creditCheck({ id: 'c1', creditLimit: 100_000 }, entries, 30_000);
    expect(result).toEqual({
      allowed: true,
      balance: 60_000,
      limit: 100_000,
      available: 40_000,
      projected: 90_000,
    });
  });

  it('refuses one that would cross it', () => {
    expect(creditCheck({ id: 'c1', creditLimit: 100_000 }, entries, 50_000).allowed).toBe(false);
  });

  it('refuses any credit when no limit was agreed', () => {
    expect(creditCheck({ id: 'c1', creditLimit: 0 }, entries, 1).allowed).toBe(false);
    expect(creditCheck({ id: 'c1' }, entries, 1).allowed).toBe(false);
  });
});

describe('dueDateFor', () => {
  it('adds the payment term', () => {
    expect(dueDateFor(NOW, 30)).toEqual(day(30));
  });

  it('has no due date without a term', () => {
    expect(dueDateFor(NOW, 0)).toBeUndefined();
    expect(dueDateFor(NOW, undefined)).toBeUndefined();
  });
});
