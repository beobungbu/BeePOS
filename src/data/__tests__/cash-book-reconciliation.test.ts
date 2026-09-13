/**
 * The till and the branch cash book are the same money.
 *
 * Before this, `ledger-store.cashBook` was written only by a collection, a supplier payment
 * and a bank deposit: a cash sale and a drawer movement went to `cash-movement-store` and the
 * money area never saw them, so the Z report and `/money/cashbook` were two private ledgers
 * that could not be reconciled (`reports/w-e-e2e-perf-report.md` 5.1).
 *
 * Every till event now goes through `postCashBook`, so this asks the two the same question and
 * expects the same four figures: what the shift sold in cash, what was paid in, what was taken
 * out, and what the drawer should hold.
 */

import { shiftSummary, zReportTotals } from '../../domain/pos';
import type { Order, Shift } from '../../domain/types';
import { tillCashTotals } from '../../features/money/lib/cash-book';
import { submitOrder } from '../../features/pos/adapters';
import { recordCashMovement, useCashMovementStore } from '../cash-movement-store';
import { useLedgerStore } from '../ledger-store';
import { useOrderStore } from '../order-store';
import { useOrgStore } from '../org-store';
import { useSessionStore } from '../session-store';
import { useShiftStore } from '../shift-store';

const ORG = 'org-1';
const STORE = 'store-1';
const STAFF = 'staff-1';
const SHIFT_ID = 'shift-cashbook-1';
const OPENING_CASH = 500_000;

const shift: Shift = {
  id: SHIFT_ID,
  orgId: ORG,
  storeId: STORE,
  registerId: 'store-1-reg-1',
  cashierId: STAFF,
  openedAt: '2026-09-13T01:00:00.000Z',
  openingCash: OPENING_CASH,
  expectedCash: OPENING_CASH,
  orderCount: 0,
  revenue: 0,
};

/** A counter sale inside the shift window, settled in notes. */
function cashSale(id: string, total: number): Order {
  return {
    id,
    orgId: ORG,
    code: `HD-TEST-${id}`,
    storeId: STORE,
    cashierId: STAFF,
    lines: [
      {
        productId: 'product-1',
        qty: 1,
        unitPrice: total,
        unitCostSnapshot: Math.round(total * 0.7),
        priceSource: 'list',
      },
    ],
    subtotal: total,
    discountTotal: 0,
    taxTotal: 0,
    total,
    payments: [{ method: 'cash', amount: total }],
    status: 'paid',
    createdAt: '2026-09-13T02:00:00.000Z',
    channel: 'retail',
  };
}

function signIn(): void {
  const { stores, staff } = useOrgStore.getState();
  const store = stores.find((item) => item.id === STORE);
  const member = staff.find((item) => item.id === STAFF);
  if (!store || !member) throw new Error('the seeded branch and cashier are the fixture');
  useSessionStore.setState({
    session: {
      token: 'session-test',
      orgId: ORG,
      userId: 'user-1',
      staffId: STAFF,
      storeId: STORE,
      issuedAt: new Date(shift.openedAt),
      expiresAt: new Date('2026-12-31T00:00:00.000Z'),
    },
    staff: member,
    store,
  });
}

/** The store's own state, emptied of the seed so only what this file books is counted. */
function resetStores(): void {
  useLedgerStore.setState({ entries: [], cashBook: [] });
  useOrderStore.setState({ orders: [], shifts: [shift], refunds: [] });
  useCashMovementStore.setState({ movements: [], notes: {} });
}

beforeEach(() => {
  resetStores();
  signIn();
});

afterEach(() => {
  useSessionStore.setState({ session: null, staff: null, store: null });
});

describe('the cash book sees live till cash', () => {
  it('books a cash sale, a cash-in and a cash-out as drawer rows', () => {
    submitOrder(cashSale('order-cash-1', 300_000), { shiftId: SHIFT_ID });
    recordCashMovement({
      shiftId: SHIFT_ID,
      type: 'in',
      amount: 250_000,
      reason: 'deposit',
      note: '',
      reasonLabel: 'Nộp tiền',
    });
    recordCashMovement({
      shiftId: SHIFT_ID,
      type: 'out',
      amount: 100_000,
      reason: 'petty',
      note: '',
      reasonLabel: 'Chi vặt',
    });

    const totals = tillCashTotals(useLedgerStore.getState().cashBook, STORE);
    expect(totals).toEqual({
      cashSales: 300_000,
      refunds: 0,
      cashIn: 250_000,
      cashOut: 100_000,
      net: 450_000,
    });
  });

  it('agrees with the Z report of the same shift, figure for figure', () => {
    submitOrder(cashSale('order-cash-2', 420_000), { shiftId: SHIFT_ID });
    recordCashMovement({
      shiftId: SHIFT_ID,
      type: 'in',
      amount: 80_000,
      reason: 'other',
      note: '',
      reasonLabel: 'Thu khác',
    });

    const { orders, shifts, refunds } = useOrderStore.getState();
    const current = shifts.find((item) => item.id === SHIFT_ID) as Shift;
    const z = zReportTotals({
      shift: current,
      orders,
      refunds,
      movements: useCashMovementStore.getState().movements,
    });
    const book = tillCashTotals(useLedgerStore.getState().cashBook, STORE);

    expect(book.cashSales).toBe(z.cashRevenue);
    expect(book.cashIn).toBe(z.cashIn);
    expect(book.cashOut).toBe(z.cashOut);
    // The drawer the Z report expects is the float plus what the cash book says moved.
    expect(z.expectedCash).toBe(OPENING_CASH + book.net);
  });

  it('books one row per document however often the sale is submitted', () => {
    const order = cashSale('order-cash-3', 150_000);
    submitOrder(order, { shiftId: SHIFT_ID });
    submitOrder(order, { shiftId: SHIFT_ID });

    const rows = useLedgerStore.getState().cashBook.filter((entry) => entry.kind === 'sale');
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(150_000);
  });

  it('books no drawer row for a sale that took no cash', () => {
    const onAccount = cashSale('order-cash-4', 200_000);
    submitOrder({ ...onAccount, payments: [] }, { shiftId: SHIFT_ID });
    expect(useLedgerStore.getState().cashBook).toHaveLength(0);
  });

  it('carries the hand-over at close out of the drawer, leaving the float behind', () => {
    submitOrder(cashSale('order-cash-5', 300_000), { shiftId: SHIFT_ID });
    const expected = shiftSummary(
      shift,
      useOrderStore.getState().orders,
      useCashMovementStore.getState().movements,
    ).expectedCash;

    useShiftStore.getState().closeShift(SHIFT_ID, expected);

    const deposits = useLedgerStore.getState().cashBook.filter((entry) => entry.kind === 'deposit');
    expect(deposits).toHaveLength(1);
    expect(deposits[0].amount).toBe(expected - OPENING_CASH);

    // A hand-over is branch money, not till money: it must not move the four figures the Z
    // report of the shift that just closed prints.
    expect(tillCashTotals(useLedgerStore.getState().cashBook, STORE).net).toBe(300_000);
  });

  it('leaves another branch out of the figures', () => {
    submitOrder(cashSale('order-cash-6', 90_000), { shiftId: SHIFT_ID });
    expect(tillCashTotals(useLedgerStore.getState().cashBook, 'store-2').net).toBe(0);
  });
});
