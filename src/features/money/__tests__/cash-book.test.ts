import type { CashBookEntry, CashBookKind } from '../../../domain/types';
import {
  affectsDrawer,
  cashBookRows,
  cashBookTotals,
  cashDirection,
  cashNet,
  drawerEntries,
  entriesInRange,
  openingBalanceAt,
  signedCashAmount,
} from '../lib/cash-book';

function entry(
  id: string,
  kind: CashBookKind,
  amount: number,
  minutes: number,
  extra: Partial<CashBookEntry> = {},
): CashBookEntry {
  return {
    id,
    orgId: 'org-1',
    storeId: 'store-1',
    kind,
    amount,
    staffId: 'staff-1',
    createdAt: new Date(Date.UTC(2026, 8, 13, 8, minutes)),
    ...extra,
  };
}

describe('cash direction', () => {
  it('puts sales, cash in and collections into the drawer', () => {
    expect(cashDirection('sale')).toBe(1);
    expect(cashDirection('in')).toBe(1);
    expect(cashDirection('collection')).toBe(1);
  });

  it('takes refunds, cash out, deposits and supplier payments out of it', () => {
    expect(cashDirection('refund')).toBe(-1);
    expect(cashDirection('out')).toBe(-1);
    expect(cashDirection('deposit')).toBe(-1);
    expect(cashDirection('supplier_payment')).toBe(-1);
  });

  it('signs the amount and floors a negative one at zero', () => {
    expect(signedCashAmount({ kind: 'sale', amount: 1000 })).toBe(1000);
    expect(signedCashAmount({ kind: 'deposit', amount: 1000 })).toBe(-1000);
    expect(signedCashAmount({ kind: 'sale', amount: -1000 })).toBe(0);
  });
});

describe('drawer entries', () => {
  it('keeps a deposit but drops a collection settled through the bank', () => {
    expect(affectsDrawer({ kind: 'deposit', bankAccountId: 'bank-1' })).toBe(true);
    expect(affectsDrawer({ kind: 'collection', bankAccountId: 'bank-1' })).toBe(false);
    expect(affectsDrawer({ kind: 'collection', bankAccountId: undefined })).toBe(true);
  });

  it('filters to one branch, oldest first', () => {
    const rows = drawerEntries(
      [
        entry('c-2', 'sale', 200, 30),
        entry('c-1', 'sale', 100, 10),
        entry('c-3', 'collection', 500, 40, { bankAccountId: 'bank-1' }),
        entry('c-4', 'sale', 900, 50, { storeId: 'store-2' }),
      ],
      'store-1',
    );
    expect(rows.map((row) => row.id)).toEqual(['c-1', 'c-2']);
  });
});

describe('running balance', () => {
  const entries = [
    entry('c-1', 'in', 2_000_000, 15),
    entry('c-2', 'out', 150_000, 30),
    entry('c-3', 'sale', 5_820_000, 45),
    entry('c-4', 'deposit', 5_000_000, 60, { bankAccountId: 'bank-1' }),
  ];

  it('accumulates oldest first and lists newest first', () => {
    const rows = cashBookRows(entries, 1_500_000);
    expect(rows.map((row) => row.entry.id)).toEqual(['c-4', 'c-3', 'c-2', 'c-1']);
    expect(rows.map((row) => row.balance)).toEqual([4_170_000, 9_170_000, 3_350_000, 3_500_000]);
  });

  it('closes where the totals say it closes', () => {
    const totals = cashBookTotals(entries, 1_500_000);
    expect(totals).toEqual({
      opening: 1_500_000,
      inflow: 7_820_000,
      outflow: 5_150_000,
      closing: 4_170_000,
    });
    expect(cashNet(entries) + totals.opening).toBe(totals.closing);
  });

  it('starts from zero when no opening figure is given', () => {
    expect(cashBookRows([entry('c-1', 'sale', 1_000, 5)])[0].balance).toBe(1_000);
  });
});

describe('range', () => {
  const entries = [
    entry('c-1', 'sale', 1_000, 10),
    entry('c-2', 'sale', 2_000, 30),
    entry('c-3', 'sale', 4_000, 50),
  ];
  const start = new Date(Date.UTC(2026, 8, 13, 8, 20));
  const end = new Date(Date.UTC(2026, 8, 13, 8, 50));

  it('is half open: the start is in, the end is out', () => {
    expect(entriesInRange(entries, start, end).map((row) => row.id)).toEqual(['c-2']);
  });

  it('carries everything before the start into the opening balance', () => {
    expect(openingBalanceAt(entries, start)).toBe(1_000);
  });
});
