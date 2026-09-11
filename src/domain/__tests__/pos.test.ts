import {
  addOrIncrementLine,
  applyOrderDiscount,
  calcCart,
  calcChange,
  calcLine,
  nextOrderCode,
  pointsEarned,
  pointsToVnd,
  setLineQty,
  shiftSummary,
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
