/**
 * A goods receipt taken on credit raises a bill the payables screen can then pay down.
 *
 * Until now nothing in the app raised one: confirming a receipt wrote no ledger entry, so
 * every supplier invoice in the chain came from the seed and the payables ledger could only
 * ever go down (`reports/w-e-e2e-perf-report.md` 5.2). The cases here pin the three things
 * that makes the bill safe to raise from two screens: it lands on the payables, it carries the
 * partner's due date, and the same receipt can never raise it twice.
 */

import { balanceFor, dueDateFor, openInvoices } from '../../domain/ledger';
import { supplierInvoiceId, useLedgerStore } from '../ledger-store';

const ORG = 'org-1';
const STORE = 'store-1';
const SUPPLIER = 'supplier-2';
const RECEIPT = 'receipt-test-1';
const AMOUNT = 12_000_000;

function raise(amount = AMOUNT, dueDate?: Date) {
  return useLedgerStore.getState().createSupplierInvoice({
    orgId: ORG,
    storeId: STORE,
    supplierId: SUPPLIER,
    amount,
    receiptId: RECEIPT,
    dueDate,
    note: 'Cty CP Phân phối Miền Bắc',
  });
}

beforeEach(() => {
  useLedgerStore.setState({ entries: [], cashBook: [] });
});

describe('a supplier bill on credit', () => {
  it('raises what the chain owes the partner, against the receipt it came from', () => {
    const entry = raise();
    expect(entry).not.toBeNull();
    expect(entry).toMatchObject({
      party: 'supplier',
      partyId: SUPPLIER,
      kind: 'invoice',
      refType: 'receipt',
      refId: RECEIPT,
      storeId: STORE,
      amount: AMOUNT,
    });

    const entries = useLedgerStore.getState().entries;
    expect(balanceFor(entries, 'supplier', SUPPLIER)).toBe(AMOUNT);
    // What the payables settlement dialog offers to pay.
    expect(openInvoices(entries, 'supplier', SUPPLIER)).toHaveLength(1);
  });

  it('carries the due date the partner terms give it', () => {
    const confirmedAt = new Date('2026-09-13T02:00:00.000Z');
    const due = dueDateFor(confirmedAt, 30);
    const entry = raise(AMOUNT, due);
    expect(entry?.dueDate).toEqual(due);
  });

  it('leaves the bill without a due date when the partner gives no terms', () => {
    const entry = raise(AMOUNT, dueDateFor(new Date(), undefined));
    expect(entry?.dueDate).toBeUndefined();
  });

  it('raises one bill however many screens ask for it', () => {
    const first = raise();
    // The same receipt, confirmed twice or confirmed and then billed from the detail screen.
    const second = raise();
    expect(second?.id).toBe(first?.id);
    expect(useLedgerStore.getState().entries).toHaveLength(1);
    expect(balanceFor(useLedgerStore.getState().entries, 'supplier', SUPPLIER)).toBe(AMOUNT);
    expect(first?.id).toBe(supplierInvoiceId(RECEIPT));
  });

  it('books nothing for a receipt worth nothing', () => {
    expect(raise(0)).toBeNull();
    expect(useLedgerStore.getState().entries).toHaveLength(0);
  });

  it('is paid down by the payables screen like any other bill', () => {
    raise();
    useLedgerStore.getState().settle({
      orgId: ORG,
      storeId: STORE,
      party: 'supplier',
      partyId: SUPPLIER,
      amount: 4_000_000,
      staffId: 'staff-1',
    });

    const { entries, cashBook } = useLedgerStore.getState();
    expect(balanceFor(entries, 'supplier', SUPPLIER)).toBe(AMOUNT - 4_000_000);
    // Paid in notes, so the drawer is down by it as well.
    expect(cashBook.filter((row) => row.kind === 'supplier_payment')).toHaveLength(1);
  });
});

describe('a receipt paid at the door', () => {
  it('takes the money out of the drawer and leaves the payables alone', () => {
    const row = useLedgerStore.getState().postCashBook({
      orgId: ORG,
      storeId: STORE,
      kind: 'supplier_payment',
      amount: AMOUNT,
      ref: `receipt-${RECEIPT}`,
      refId: RECEIPT,
      staffId: 'staff-1',
    });

    expect(row?.amount).toBe(AMOUNT);
    expect(useLedgerStore.getState().entries).toHaveLength(0);
    expect(balanceFor(useLedgerStore.getState().entries, 'supplier', SUPPLIER)).toBe(0);
  });

  it('pays once however often the confirm is pressed', () => {
    const post = () =>
      useLedgerStore.getState().postCashBook({
        orgId: ORG,
        storeId: STORE,
        kind: 'supplier_payment',
        amount: AMOUNT,
        ref: `receipt-${RECEIPT}`,
        staffId: 'staff-1',
      });
    post();
    post();
    expect(useLedgerStore.getState().cashBook).toHaveLength(1);
  });
});
