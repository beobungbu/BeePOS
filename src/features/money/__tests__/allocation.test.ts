import type { LedgerEntry } from '../../../domain/types';
import { openInvoices } from '../../../domain/ledger';
import { allocatePayment, overdueAmount, quickAmounts } from '../lib/allocation';

const NOW = new Date(Date.UTC(2026, 8, 13, 9, 0));

function invoice(id: string, amount: number, dueDaysAgo: number): LedgerEntry {
  return {
    id,
    orgId: 'org-1',
    party: 'customer',
    partyId: 'customer-41',
    kind: 'invoice',
    refType: 'manual',
    amount,
    dueDate: new Date(NOW.getTime() - dueDaysAgo * 86_400_000),
    createdAt: new Date(NOW.getTime() - (dueDaysAgo + 30) * 86_400_000),
  };
}

const ENTRIES = [
  invoice('inv-old', 19_400_000, 57),
  invoice('inv-mid', 14_400_000, 23),
  invoice('inv-new', 18_600_000, -3),
];
const OPEN = openInvoices(ENTRIES, 'customer', 'customer-41');
const BALANCE = 52_400_000;

describe('allocatePayment', () => {
  it('clears the oldest bill first and spills onto the next', () => {
    const result = allocatePayment(OPEN, 20_000_000, BALANCE, undefined, NOW);
    expect(result.lines.map((line) => [line.entryId, line.applied])).toEqual([
      ['inv-old', 19_400_000],
      ['inv-mid', 600_000],
    ]);
    expect(result.allocated).toBe(20_000_000);
    expect(result.unapplied).toBe(0);
    expect(result.balanceAfter).toBe(32_400_000);
  });

  it('settles the invoice the cashier picked before the older one', () => {
    const result = allocatePayment(OPEN, 15_000_000, BALANCE, 'inv-mid', NOW);
    expect(result.lines[0].entryId).toBe('inv-mid');
    expect(result.lines[0].applied).toBe(14_400_000);
    expect(result.lines[1]).toEqual(expect.objectContaining({ entryId: 'inv-old', applied: 600_000 }));
  });

  it('reports the days each slice is past due', () => {
    const result = allocatePayment(OPEN, 20_000_000, BALANCE, undefined, NOW);
    expect(result.lines[0].daysOverdue).toBe(57);
    expect(result.lines[1].daysOverdue).toBe(23);
  });

  it('holds an overpayment as credit instead of inventing an invoice', () => {
    const result = allocatePayment(OPEN, 60_000_000, BALANCE, undefined, NOW);
    expect(result.allocated).toBe(52_400_000);
    expect(result.unapplied).toBe(7_600_000);
    expect(result.balanceAfter).toBe(-7_600_000);
  });

  it('allocates nothing for a zero or negative amount', () => {
    expect(allocatePayment(OPEN, 0, BALANCE, undefined, NOW).lines).toEqual([]);
    expect(allocatePayment(OPEN, -5, BALANCE, undefined, NOW).allocated).toBe(0);
  });
});

describe('overdueAmount', () => {
  it('counts only what is past its due date', () => {
    expect(overdueAmount(OPEN, NOW)).toBe(33_800_000);
  });
});

describe('quickAmounts', () => {
  it('offers the balance, the overdue part and a round number', () => {
    expect(quickAmounts(52_400_000, 33_800_000)).toEqual([52_400_000, 33_800_000, 10_000_000]);
  });

  it('drops a zero overdue and anything above the balance', () => {
    expect(quickAmounts(5_000_000, 0)).toEqual([5_000_000]);
  });

  it('never offers the same figure twice', () => {
    expect(quickAmounts(10_000_000, 10_000_000)).toEqual([10_000_000]);
  });
});
