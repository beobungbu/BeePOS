import type { StockLevel } from '../../../domain/types';
import { totalMinLevel, totalStock } from '../product-list-utils';

const LEVELS: StockLevel[] = [
  { productId: 'p1', storeId: 's1', onHand: 12, reserved: 2, minLevel: 5 },
  { productId: 'p1', storeId: 's2', onHand: 3, reserved: 0, minLevel: 4 },
  { productId: 'p2', storeId: 's1', onHand: 40, reserved: 0, minLevel: 10 },
];

describe('totalStock', () => {
  it('sums on-hand across every store for one product', () => {
    expect(totalStock('p1', LEVELS)).toBe(15);
  });

  it('is zero for a product with no stock rows', () => {
    expect(totalStock('missing', LEVELS)).toBe(0);
  });
});

describe('totalMinLevel', () => {
  it('sums the per-store reorder thresholds for one product', () => {
    expect(totalMinLevel('p1', LEVELS)).toBe(9);
  });

  it('is zero for a product with no stock rows, so the badge stays neutral', () => {
    expect(totalMinLevel('missing', LEVELS)).toBe(0);
  });
});
