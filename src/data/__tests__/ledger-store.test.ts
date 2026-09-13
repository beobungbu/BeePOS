/**
 * The two ledger writes whose sign is easy to get backwards, pinned against the balance they
 * are supposed to produce rather than against the `kind` string they happen to store.
 *
 * A supplier return and a customer credit note both *lower* a balance. The entry kinds that do
 * that are not the ones the paperwork is named after (`src/domain/ledger.ts` sign convention),
 * so the assertions here are on `balanceFor`: a future rename that keeps the balance right is
 * fine, and one that flips it fails here instead of on a supplier's statement.
 */

import { useLedgerStore } from '../ledger-store';
import { balanceFor } from '../../domain/ledger';
import type { LedgerEntry, ReturnRecord } from '../../domain/types';

const ORG = 'org-1';
const STORE = 'store-1';
const SUPPLIER = 'supplier-9';
const CUSTOMER = 'customer-41';

function invoice(party: 'customer' | 'supplier', partyId: string, amount: number): LedgerEntry {
  return {
    id: `ledger-test-${party}-${partyId}`,
    orgId: ORG,
    party,
    partyId,
    storeId: STORE,
    kind: 'invoice',
    refType: 'manual',
    amount,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };
}

function returnRecord(refundAmount: number): ReturnRecord {
  return {
    id: 'return-test-1',
    orgId: ORG,
    storeId: STORE,
    orderId: 'order-test-1',
    lines: [],
    refundAmount,
    staffId: 'staff-1',
    createdAt: new Date('2026-09-13T00:00:00.000Z'),
  };
}

function resetLedger(entries: LedgerEntry[]): void {
  useLedgerStore.setState({ entries, bankAccounts: [], cashBook: [] });
}

describe('createSupplierDebitNote', () => {
  beforeEach(() => resetLedger([invoice('supplier', SUPPLIER, 10_000_000)]));

  it('lowers what the chain owes the supplier by the value of the goods sent back', () => {
    const entry = useLedgerStore.getState().createSupplierDebitNote({
      orgId: ORG,
      storeId: STORE,
      supplierId: SUPPLIER,
      amount: 2_500_000,
      staffId: 'staff-1',
      refId: 'supplier-return-1',
    });

    expect(entry).not.toBeNull();
    expect(balanceFor(useLedgerStore.getState().entries, 'supplier', SUPPLIER)).toBe(7_500_000);
  });

  it('keeps the return it answers on the entry, and books it at the branch it left from', () => {
    const entry = useLedgerStore.getState().createSupplierDebitNote({
      orgId: ORG,
      storeId: STORE,
      supplierId: SUPPLIER,
      amount: 1_000_000,
      staffId: 'staff-1',
      refId: 'supplier-return-7',
    });

    expect(entry).toMatchObject({ party: 'supplier', refId: 'supplier-return-7', storeId: STORE });
  });

  it('ignores a zero or negative value rather than raising an entry that moves nothing', () => {
    const before = useLedgerStore.getState().entries.length;
    const input = { orgId: ORG, storeId: STORE, supplierId: SUPPLIER, staffId: 'staff-1' };

    expect(useLedgerStore.getState().createSupplierDebitNote({ ...input, amount: 0 })).toBeNull();
    expect(useLedgerStore.getState().createSupplierDebitNote({ ...input, amount: -5 })).toBeNull();
    expect(useLedgerStore.getState().entries).toHaveLength(before);
    expect(balanceFor(useLedgerStore.getState().entries, 'supplier', SUPPLIER)).toBe(10_000_000);
  });
});

describe('createCreditNote', () => {
  beforeEach(() => resetLedger([invoice('customer', CUSTOMER, 20_000_000)]));

  it('credits the whole value of the goods on a plain return', () => {
    useLedgerStore.getState().createCreditNote(CUSTOMER, returnRecord(3_000_000));

    expect(balanceFor(useLedgerStore.getState().entries, 'customer', CUSTOMER)).toBe(17_000_000);
  });

  it('credits only the net still owed back when the return is half of an exchange', () => {
    // 3.000.000 đ of goods came back, 1.200.000 đ of goods went out in their place, so the
    // buyer is owed 1.800.000 đ. Crediting the gross would hand them the replacement free.
    const record = returnRecord(3_000_000);
    useLedgerStore.getState().createCreditNote(CUSTOMER, record, 1_800_000);

    expect(balanceFor(useLedgerStore.getState().entries, 'customer', CUSTOMER)).toBe(18_200_000);
  });
});
