import {
  activeCartOf,
  addOrIncrementLine,
  applyOrderDiscount,
  calcCart,
  calcChange,
  calcLine,
  cartId,
  closeCart,
  initialCartSet,
  makeCart,
  MAX_OPEN_CARTS,
  nextCartOrdinal,
  nextOrderCode,
  openCart,
  pointsEarned,
  pointsToVnd,
  setLineQty,
  shiftSummary,
  switchCart,
  updateActiveCart,
  type CartSet,
  type PricedCartLine,
} from '../pos';
import type { Order, Shift } from '../types';

describe('applyOrderDiscount', () => {
  it('computes a percent discount', () => {
    expect(applyOrderDiscount(100000, { type: 'percent', value: 10 })).toBe(10000);
  });

  it('computes an amount discount', () => {
    expect(applyOrderDiscount(100000, { type: 'amount', value: 15000 })).toBe(15000);
  });

  it('clamps a discount greater than the base to the base', () => {
    expect(applyOrderDiscount(50000, { type: 'amount', value: 999999 })).toBe(50000);
  });

  it('returns 0 when there is no discount', () => {
    expect(applyOrderDiscount(50000, undefined)).toBe(0);
  });

  it('never returns a negative amount', () => {
    expect(applyOrderDiscount(50000, { type: 'amount', value: -100 })).toBe(0);
  });
});

describe('calcLine', () => {
  const base: PricedCartLine = { productId: 'p1', qty: 2, unitPrice: 10000, taxRate: 0.1 };

  it('computes subtotal, tax, and total with no discount', () => {
    const result = calcLine(base);
    expect(result.subtotal).toBe(20000);
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(2000);
    expect(result.total).toBe(22000);
  });

  it('applies a line discount before tax', () => {
    const line: PricedCartLine = { ...base, lineDiscount: { type: 'percent', value: 50 } };
    const result = calcLine(line);
    expect(result.discount).toBe(10000);
    expect(result.taxable).toBe(10000);
    expect(result.tax).toBe(1000);
    expect(result.total).toBe(11000);
  });

  it('clamps a line discount larger than the line subtotal', () => {
    const line: PricedCartLine = { ...base, lineDiscount: { type: 'amount', value: 999999 } };
    const result = calcLine(line);
    expect(result.discount).toBe(20000);
    expect(result.taxable).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('calcCart', () => {
  const lines: PricedCartLine[] = [
    { productId: 'p1', qty: 2, unitPrice: 10000, taxRate: 0.1 },
    { productId: 'p2', qty: 1, unitPrice: 50000, taxRate: 0 },
  ];

  it('sums subtotal/discount/tax/total with no order discount', () => {
    const result = calcCart(lines);
    expect(result.subtotal).toBe(70000);
    expect(result.discountTotal).toBe(0);
    expect(result.taxTotal).toBe(2000);
    expect(result.total).toBe(72000);
  });

  it('applies a 10% order discount proportionally to tax', () => {
    const result = calcCart(lines, { type: 'percent', value: 10 });
    expect(result.discountTotal).toBe(7000);
    expect(result.taxTotal).toBe(1800);
    expect(result.total).toBe(64800);
  });

  it('clamps an order discount larger than the cart total', () => {
    const result = calcCart(lines, { type: 'amount', value: 999999 });
    expect(result.discountTotal).toBe(70000);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('returns zeros for an empty cart', () => {
    const result = calcCart([]);
    expect(result).toEqual({ subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 });
  });
});

describe('calcChange', () => {
  it('returns the difference when tendered exceeds the amount due', () => {
    expect(calcChange(45000, 50000)).toBe(5000);
  });

  it('returns 0 when tendered is less than or equal to the amount due', () => {
    expect(calcChange(45000, 45000)).toBe(0);
    expect(calcChange(45000, 30000)).toBe(0);
  });
});

describe('pointsEarned / pointsToVnd', () => {
  it('earns 1 point per 10,000 VND, floored', () => {
    expect(pointsEarned(45000)).toBe(4);
    expect(pointsEarned(9999)).toBe(0);
  });

  it('returns 0 points for non-positive spend', () => {
    expect(pointsEarned(0)).toBe(0);
    expect(pointsEarned(-100)).toBe(0);
  });

  it('converts points to VND at 1,000 VND per point', () => {
    expect(pointsToVnd(12)).toBe(12000);
  });

  it('returns 0 VND for non-positive points', () => {
    expect(pointsToVnd(0)).toBe(0);
    expect(pointsToVnd(-5)).toBe(0);
  });
});

describe('nextOrderCode', () => {
  const day = new Date(2026, 8, 11); // 2026-09-11

  it('starts sequence at 001 when no codes exist yet', () => {
    expect(nextOrderCode('HN01', day, [])).toBe('HD-HN01-20260911-001');
  });

  it('increments after the highest existing sequence for that store/day', () => {
    const existing = ['HD-HN01-20260911-001', 'HD-HN01-20260911-002', 'HD-HN02-20260911-005'];
    expect(nextOrderCode('HN01', day, existing)).toBe('HD-HN01-20260911-003');
  });

  it('ignores codes from other stores or other days', () => {
    const existing = ['HD-HN02-20260911-009', 'HD-HN01-20260910-007'];
    expect(nextOrderCode('HN01', day, existing)).toBe('HD-HN01-20260911-001');
  });
});

describe('addOrIncrementLine / setLineQty', () => {
  it('adds a new line for a product not yet in the cart', () => {
    const lines = addOrIncrementLine([], 'p1', 10000);
    expect(lines).toEqual([{ productId: 'p1', qty: 1, unitPrice: 10000 }]);
  });

  it('increments qty when the product is already in the cart', () => {
    const lines = addOrIncrementLine([{ productId: 'p1', qty: 1, unitPrice: 10000 }], 'p1', 10000);
    expect(lines).toEqual([{ productId: 'p1', qty: 2, unitPrice: 10000 }]);
  });

  it('setLineQty updates the quantity of the matching line', () => {
    const lines = setLineQty([{ productId: 'p1', qty: 1, unitPrice: 10000 }], 'p1', 5);
    expect(lines[0].qty).toBe(5);
  });

  it('setLineQty removes the line when qty is 0 or less', () => {
    const initial = [{ productId: 'p1', qty: 1, unitPrice: 10000 }];
    expect(setLineQty(initial, 'p1', 0)).toEqual([]);
    expect(setLineQty(initial, 'p1', -1)).toEqual([]);
  });
});

describe('shiftSummary', () => {
  const shift: Shift = {
    id: 'shift-1',
    storeId: 'store-1',
    cashierId: 'staff-1',
    openedAt: '2026-09-11T08:00:00.000Z',
    openingCash: 500000,
    expectedCash: 500000,
    orderCount: 0,
    revenue: 0,
  };

  const orders: Order[] = [
    {
      id: 'o1',
      code: 'HD-HN01-20260911-001',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 100000,
      discountTotal: 0,
      taxTotal: 0,
      total: 100000,
      payments: [{ method: 'cash', amount: 100000 }],
      status: 'paid',
      createdAt: '2026-09-11T09:00:00.000Z',
    },
    {
      id: 'o2',
      code: 'HD-HN01-20260911-002',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 50000,
      discountTotal: 0,
      taxTotal: 0,
      total: 50000,
      payments: [{ method: 'transfer', amount: 50000 }],
      status: 'paid',
      createdAt: '2026-09-11T10:00:00.000Z',
    },
    {
      id: 'o3',
      code: 'HD-HN01-20260910-001',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 999999,
      discountTotal: 0,
      taxTotal: 0,
      total: 999999,
      payments: [{ method: 'cash', amount: 999999 }],
      status: 'paid',
      createdAt: '2026-09-10T10:00:00.000Z',
    },
  ];

  it('sums only orders within the shift window for its store/cashier', () => {
    const summary = shiftSummary(shift, orders);
    expect(summary.orderCount).toBe(2);
    expect(summary.revenue).toBe(150000);
    expect(summary.cashRevenue).toBe(100000);
    expect(summary.expectedCash).toBe(600000);
  });

  it('leaves variance null while the shift is still open', () => {
    expect(shiftSummary(shift, orders).variance).toBeNull();
  });

  it('computes variance once the shift is closed', () => {
    const closed: Shift = { ...shift, closedAt: '2026-09-11T18:00:00.000Z', closingCash: 590000 };
    expect(shiftSummary(closed, orders).variance).toBe(-10000);
  });
});

describe('open order set', () => {
  const STORE = 'store-1';

  function setWith(ordinals: number[], activeOrdinal = ordinals[0]): CartSet {
    return {
      carts: ordinals.map((ordinal) => makeCart(STORE, ordinal)),
      activeCartId: cartId(STORE, activeOrdinal),
    };
  }

  it('starts with a single empty active order', () => {
    const state = initialCartSet(STORE);
    expect(state.carts).toHaveLength(1);
    expect(state.carts[0].ordinal).toBe(1);
    expect(state.activeCartId).toBe(state.carts[0].id);
  });

  it('gives a new order the smallest unused ordinal', () => {
    expect(nextCartOrdinal([])).toBe(1);
    expect(nextCartOrdinal(setWith([1, 2, 3]).carts)).toBe(4);
    expect(nextCartOrdinal(setWith([1, 3, 4]).carts)).toBe(2);
  });

  it('opens an order and activates it', () => {
    const next = openCart(initialCartSet(STORE), STORE);
    expect(next).not.toBeNull();
    expect(next!.carts).toHaveLength(2);
    expect(next!.carts[1].ordinal).toBe(2);
    expect(next!.activeCartId).toBe(next!.carts[1].id);
  });

  it('refuses to open a ninth order', () => {
    const full = setWith([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(full.carts).toHaveLength(MAX_OPEN_CARTS);
    expect(openCart(full, STORE)).toBeNull();
  });

  it('switches to an open order and ignores an unknown id', () => {
    const state = setWith([1, 2, 3]);
    expect(switchCart(state, cartId(STORE, 3)).activeCartId).toBe(cartId(STORE, 3));
    expect(switchCart(state, 'cart-missing')).toBe(state);
  });

  it('activates the next order when the active one closes', () => {
    const state = setWith([1, 2, 3], 2);
    const next = closeCart(state, cartId(STORE, 2));
    expect(next.carts.map((cart) => cart.ordinal)).toEqual([1, 3]);
    expect(next.activeCartId).toBe(cartId(STORE, 3));
  });

  it('activates the previous order when the last one closes', () => {
    const state = setWith([1, 2, 3], 3);
    const next = closeCart(state, cartId(STORE, 3));
    expect(next.activeCartId).toBe(cartId(STORE, 2));
  });

  it('keeps the active order when another one closes', () => {
    const state = setWith([1, 2, 3], 1);
    const next = closeCart(state, cartId(STORE, 3));
    expect(next.carts.map((cart) => cart.ordinal)).toEqual([1, 2]);
    expect(next.activeCartId).toBe(cartId(STORE, 1));
  });

  it('leaves one empty order behind when the last order closes', () => {
    const state = initialCartSet(STORE);
    const withLines: CartSet = {
      ...state,
      carts: [{ ...state.carts[0], lines: [{ productId: 'p1', qty: 2, unitPrice: 9000 }] }],
    };
    const next = closeCart(withLines, state.activeCartId);
    expect(next.carts).toHaveLength(1);
    expect(next.carts[0].lines).toEqual([]);
    expect(next.activeCartId).toBe(next.carts[0].id);
  });

  it('ignores closing an unknown order', () => {
    const state = setWith([1, 2]);
    expect(closeCart(state, 'cart-missing')).toBe(state);
  });

  it('updates only the active order', () => {
    const state = setWith([1, 2], 2);
    const next = updateActiveCart(state, (cart) => ({ ...cart, note: 'giao tận nơi' }));
    expect(next.carts[0].note).toBeUndefined();
    expect(next.carts[1].note).toBe('giao tận nơi');
    expect(activeCartOf(next).note).toBe('giao tận nơi');
  });

  it('falls back to the first order when the active id is stale', () => {
    const state: CartSet = { ...setWith([1, 2]), activeCartId: 'cart-missing' };
    expect(activeCartOf(state).ordinal).toBe(1);
  });
});
