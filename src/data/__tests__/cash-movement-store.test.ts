/**
 * A cash movement, from the submit the cashier presses to the three figures that have to move
 * because of it: the shift's "Thu khác", the expected drawer, and the row the cash sheet and
 * the Z report list.
 *
 * Written after P7-04, where a cash-in appeared to save and the till reconciled as if it had
 * never happened (`reports/w-n-native-report.md`). The cause was the screen, not the store,
 * and the reason that took a device to find is that nothing here was pinned: these cases are
 * what would have said "the recording path is sound, look at the form" in one run.
 *
 * Every assertion goes through what a screen actually reads (`movementsInShift`,
 * `shiftSummary`), never through `movements[0]`: a movement written with a shift or a chain id
 * the summary does not read back is exactly the defect, and it would pass an identity check.
 */

import { movementsInShift, shiftSummary } from '../../domain/pos';
import type { Shift } from '../../domain/types';
import { recordCashMovement, useCashMovementStore } from '../cash-movement-store';
import { useOrgStore } from '../org-store';
import { useSessionStore } from '../session-store';

const ORG = 'org-1';
const STORE = 'store-1';
const STAFF = 'staff-1';
const SHIFT_ID = 'shift-test-1';

const shift: Shift = {
  id: SHIFT_ID,
  orgId: ORG,
  storeId: STORE,
  registerId: 'store-1-reg-1',
  cashierId: STAFF,
  openedAt: '2026-09-13T01:00:00.000Z',
  openingCash: 500_000,
  expectedCash: 500_000,
  orderCount: 0,
  revenue: 0,
};

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

function signOut(): void {
  useSessionStore.setState({ session: null, staff: null, store: null });
}

function cashIn(amount: number, note = '') {
  return recordCashMovement({
    shiftId: SHIFT_ID,
    type: 'in',
    amount,
    reason: 'deposit',
    note,
    reasonLabel: 'Nộp tiền',
  });
}

beforeEach(() => {
  useCashMovementStore.setState({ movements: [], notes: {} });
  signIn();
});

afterEach(() => {
  useCashMovementStore.setState({ movements: [], notes: {} });
  signOut();
});

describe('recordCashMovement', () => {
  it('books a cash-in the shift summary reads back, under the chain and shift it was taken for', () => {
    const result = cashIn(500_000, 'Nộp tiền đầu giờ');
    expect(result.ok).toBe(true);

    const movements = useCashMovementStore.getState().movements;
    const inShift = movementsInShift(SHIFT_ID, movements);
    expect(inShift).toHaveLength(1);
    expect(inShift[0]).toMatchObject({ orgId: ORG, storeId: STORE, staffId: STAFF, amount: 500_000 });

    const summary = shiftSummary(shift, [], movements);
    expect(summary.cashIn).toBe(500_000);
    expect(summary.cashInCount).toBe(1);
    // The drawer the cashier will count at close: float plus what was paid in.
    expect(summary.expectedCash).toBe(1_000_000);
  });

  it('takes a cash-out off the expected drawer and counts it separately from a cash-in', () => {
    cashIn(500_000);
    const out = recordCashMovement({
      shiftId: SHIFT_ID,
      type: 'out',
      amount: 200_000,
      reason: 'withdraw',
      note: '',
      reasonLabel: 'Rút tiền',
    });
    expect(out.ok).toBe(true);

    const summary = shiftSummary(shift, [], useCashMovementStore.getState().movements);
    expect(summary.cashIn).toBe(500_000);
    expect(summary.cashOut).toBe(200_000);
    expect(summary.cashOutCount).toBe(1);
    expect(summary.expectedCash).toBe(800_000);
  });

  it('keeps the note beside the movement, and stores nothing for an empty one', () => {
    const withNote = cashIn(300_000, '  Nộp tiền  ');
    const withoutNote = cashIn(100_000, '   ');
    if (!withNote.ok || !withoutNote.ok) throw new Error('both movements are valid');

    const { notes } = useCashMovementStore.getState();
    expect(notes[withNote.movement.id]).toBe('Nộp tiền');
    expect(notes).not.toHaveProperty(withoutNote.movement.id);
  });

  it('refuses a zero or negative amount and writes nothing', () => {
    expect(cashIn(0)).toEqual({ ok: false, reason: 'invalid_amount' });
    expect(cashIn(-50_000)).toEqual({ ok: false, reason: 'invalid_amount' });
    expect(useCashMovementStore.getState().movements).toHaveLength(0);
  });

  it('refuses to book anything with no cashier at the till', () => {
    signOut();
    expect(cashIn(500_000)).toEqual({ ok: false, reason: 'no_session' });
    expect(useCashMovementStore.getState().movements).toHaveLength(0);
  });

  it('leaves another shift on the same till untouched', () => {
    cashIn(500_000);
    const otherShift: Shift = { ...shift, id: 'shift-test-2', openingCash: 0, expectedCash: 0 };

    const movements = useCashMovementStore.getState().movements;
    expect(movementsInShift(otherShift.id, movements)).toHaveLength(0);
    expect(shiftSummary(otherShift, [], movements).cashIn).toBe(0);
  });
});
