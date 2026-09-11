import {
  applyMovement,
  availableQty,
  countVariance,
  lowStock,
  receiptTotals,
  stockStatus,
  transferTransition,
} from '../inventory';
import type { StockLevel } from '../types';

const level = (overrides: Partial<StockLevel> = {}): StockLevel => ({
  productId: 'product-1',
  storeId: 'store-1',
  onHand: 20,
  reserved: 5,
  minLevel: 10,
  ...overrides,
});

describe('availableQty', () => {
  it('subtracts reserved from on hand', () => {
    expect(availableQty(level({ onHand: 20, reserved: 5 }))).toBe(15);
  });

  it('floors at zero when reserved exceeds on hand', () => {
    expect(availableQty(level({ onHand: 3, reserved: 10 }))).toBe(0);
  });
});

describe('stockStatus', () => {
  it('is out when on hand is zero', () => {
    expect(stockStatus(level({ onHand: 0, minLevel: 5 }))).toBe('out');
  });

  it('is low when on hand is at or below the minimum', () => {
    expect(stockStatus(level({ onHand: 5, minLevel: 5 }))).toBe('low');
  });

  it('is ok when on hand is above the minimum', () => {
    expect(stockStatus(level({ onHand: 6, minLevel: 5 }))).toBe('ok');
  });
});

describe('lowStock', () => {
  it('returns only levels at or below their minimum', () => {
    const levels = [level({ productId: 'a', onHand: 3, minLevel: 5 }), level({ productId: 'b', onHand: 50, minLevel: 5 })];
    expect(lowStock(levels).map((l) => l.productId)).toEqual(['a']);
  });
});

describe('applyMovement', () => {
  it('increases on hand for the matching product and store', () => {
    const levels = [level({ productId: 'a', storeId: 's1', onHand: 10 })];
    const result = applyMovement(levels, { productId: 'a', storeId: 's1', delta: 5 });
    expect(result[0].onHand).toBe(15);
  });

  it('clamps at zero when the delta would go negative', () => {
    const levels = [level({ productId: 'a', storeId: 's1', onHand: 3 })];
    const result = applyMovement(levels, { productId: 'a', storeId: 's1', delta: -10 });
    expect(result[0].onHand).toBe(0);
  });

  it('leaves non-matching rows untouched and does not mutate the input', () => {
    const levels = [level({ productId: 'a', storeId: 's1', onHand: 10 })];
    const result = applyMovement(levels, { productId: 'b', storeId: 's1', delta: 5 });
    expect(result[0].onHand).toBe(10);
    expect(levels[0].onHand).toBe(10);
  });

  it('can target the reserved field explicitly', () => {
    const levels = [level({ productId: 'a', storeId: 's1', reserved: 2 })];
    const result = applyMovement(levels, { productId: 'a', storeId: 's1', delta: 3, field: 'reserved' });
    expect(result[0].reserved).toBe(5);
  });
});

describe('receiptTotals', () => {
  it('sums quantity and cost across lines', () => {
    const totals = receiptTotals([
      { productId: 'a', qty: 10, unitCost: 1000 },
      { productId: 'b', qty: 5, unitCost: 2000 },
    ]);
    expect(totals).toEqual({ totalQty: 15, totalCost: 20000 });
  });

  it('returns zero totals for an empty line list', () => {
    expect(receiptTotals([])).toEqual({ totalQty: 0, totalCost: 0 });
  });
});

describe('transferTransition', () => {
  it('moves draft to sent', () => {
    expect(transferTransition('draft', 'send')).toBe('sent');
  });

  it('moves sent to received', () => {
    expect(transferTransition('sent', 'receive')).toBe('received');
  });

  it('rejects sending a transfer that is not in draft', () => {
    expect(() => transferTransition('sent', 'send')).toThrow(/Invalid transfer transition/);
  });

  it('rejects receiving a transfer that has not been sent', () => {
    expect(() => transferTransition('draft', 'receive')).toThrow(/Invalid transfer transition/);
  });

  it('rejects any transition from received', () => {
    expect(() => transferTransition('received', 'send')).toThrow();
    expect(() => transferTransition('received', 'receive')).toThrow();
  });
});

describe('countVariance', () => {
  it('is positive when counted exceeds expected', () => {
    expect(countVariance({ expected: 10, counted: 13 })).toBe(3);
  });

  it('is negative when counted is under expected', () => {
    expect(countVariance({ expected: 10, counted: 7 })).toBe(-3);
  });

  it('is zero when counted matches expected', () => {
    expect(countVariance({ expected: 10, counted: 10 })).toBe(0);
  });
});
