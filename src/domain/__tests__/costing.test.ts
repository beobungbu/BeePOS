import type { CostHistory, GoodsReceipt, Order, OrderLine } from '../types';
import {
  cogsFor,
  costHistoryFromReceipt,
  costSnapshotFor,
  grossMarginPercent,
  grossProfitFor,
  inventoryValuation,
  latestCost,
  lineCogs,
  receiptCostUpdates,
  weightedAverageCost,
} from '../costing';

describe('weightedAverageCost', () => {
  it('blends two lots by quantity', () => {
    // 10 at 10.000 plus 10 at 20.000 averages 15.000.
    expect(weightedAverageCost({ qty: 10, unitCost: 10_000 }, { qty: 10, unitCost: 20_000 })).toBe(
      15_000,
    );
  });

  it('takes the incoming cost when nothing was on hand', () => {
    expect(weightedAverageCost({ qty: 0, unitCost: 5000 }, { qty: 20, unitCost: 12_000 })).toBe(
      12_000,
    );
  });

  it('keeps the current cost when nothing arrives', () => {
    expect(weightedAverageCost({ qty: 10, unitCost: 9000 }, { qty: 0, unitCost: 99_000 })).toBe(
      9000,
    );
  });

  it('does not let a negative on-hand invert the average', () => {
    expect(weightedAverageCost({ qty: -50, unitCost: 1000 }, { qty: 10, unitCost: 8000 })).toBe(
      8000,
    );
  });

  it('rounds to whole dong', () => {
    expect(weightedAverageCost({ qty: 3, unitCost: 1000 }, { qty: 1, unitCost: 1001 })).toBe(1000);
  });
});

describe('receiptCostUpdates', () => {
  const receipt: GoodsReceipt = {
    id: 'receipt-1',
    orgId: 'org-1',
    storeId: 'store-1',
    supplierId: 'supplier-1',
    lines: [
      { productId: 'p1', qty: 10, unitCost: 20_000 },
      { productId: 'p2', qty: 5, unitCost: 4000 },
    ],
    status: 'received',
    createdAt: '2026-09-01T00:00:00.000Z',
  };

  it('blends each line against what the store already held', () => {
    const updates = receiptCostUpdates({
      receipt,
      onHandFor: () => 10,
      costFor: (productId) => (productId === 'p1' ? 10_000 : 4000),
    });
    expect(updates).toEqual([
      { productId: 'p1', storeId: 'store-1', previousCost: 10_000, unitCost: 15_000, qty: 10 },
      { productId: 'p2', storeId: 'store-1', previousCost: 4000, unitCost: 4000, qty: 5 },
    ]);
  });

  it('folds two lines of the same product into one blended update', () => {
    const doubled: GoodsReceipt = {
      ...receipt,
      lines: [
        { productId: 'p1', qty: 10, unitCost: 20_000 },
        { productId: 'p1', qty: 10, unitCost: 30_000 },
      ],
    };
    const updates = receiptCostUpdates({
      receipt: doubled,
      onHandFor: () => 0,
      costFor: () => 0,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ qty: 20, unitCost: 25_000 });
  });

  it('turns updates into dated history rows pointing back at the receipt', () => {
    const at = new Date('2026-09-01T00:00:00.000Z');
    const rows = costHistoryFromReceipt(
      receipt,
      [{ productId: 'p1', storeId: 'store-1', previousCost: 0, unitCost: 15_000, qty: 10 }],
      at,
    );
    expect(rows).toEqual([
      {
        productId: 'p1',
        storeId: 'store-1',
        unitCost: 15_000,
        source: 'receipt',
        refId: 'receipt-1',
        createdAt: at,
      },
    ]);
  });
});

describe('latestCost', () => {
  const history: CostHistory[] = [
    { productId: 'p1', unitCost: 9000, source: 'seed', createdAt: new Date('2026-08-01') },
    { productId: 'p1', unitCost: 10_000, source: 'manual', createdAt: new Date('2026-08-20') },
    {
      productId: 'p1',
      storeId: 'store-2',
      unitCost: 12_000,
      source: 'receipt',
      createdAt: new Date('2026-08-10'),
    },
  ];

  it('takes the newest chain-wide row when no branch is given', () => {
    expect(latestCost(history, 'p1')).toBe(10_000);
  });

  it("prefers a branch's own cost over the chain's, even when the chain row is newer", () => {
    expect(latestCost(history, 'p1', 'store-2')).toBe(12_000);
  });

  it('falls back to the chain cost for a branch that buys at the chain price', () => {
    expect(latestCost(history, 'p1', 'store-1')).toBe(10_000);
  });

  it('is undefined for a product with no history', () => {
    expect(latestCost(history, 'p9')).toBeUndefined();
  });

  it('falls back to the catalogue cost through costSnapshotFor', () => {
    expect(costSnapshotFor({ id: 'p9', costPrice: 4321 }, history)).toBe(4321);
    expect(costSnapshotFor({ id: 'p1', costPrice: 4321 }, history)).toBe(10_000);
  });
});

describe('cogsFor', () => {
  function line(overrides: Partial<OrderLine> = {}): OrderLine {
    return {
      productId: 'p1',
      qty: 2,
      unitPrice: 15_000,
      unitCostSnapshot: 10_000,
      priceSource: 'list',
      ...overrides,
    };
  }

  it('multiplies the snapshot by the quantity', () => {
    expect(lineCogs(line())).toBe(20_000);
  });

  it('counts a case line in base units', () => {
    expect(lineCogs(line({ qty: 2, unit: 'thùng', unitFactor: 24 }))).toBe(480_000);
  });

  it('sums the lines of an order', () => {
    const order = { lines: [line(), line({ productId: 'p2', qty: 1, unitCostSnapshot: 5000 })] };
    expect(cogsFor(order)).toBe(25_000);
  });

  it('uses the snapshot, not the product cost, so margin cannot be rewritten later', () => {
    const order: Pick<Order, 'lines' | 'total'> = {
      lines: [line({ unitCostSnapshot: 10_000 })],
      total: 33_000,
    };
    expect(grossProfitFor(order)).toBe(13_000);
    expect(grossMarginPercent(order)).toBe(39.4);
  });

  it('reports a zero margin on a zero-value order', () => {
    expect(grossMarginPercent({ lines: [], total: 0 })).toBe(0);
  });
});

describe('inventoryValuation', () => {
  it('values stock at the cost currently in force', () => {
    const levels = [
      { productId: 'p1', storeId: 'store-1', onHand: 10 },
      { productId: 'p2', storeId: 'store-1', onHand: 4 },
    ];
    const products = [
      { id: 'p1', costPrice: 9000 },
      { id: 'p2', costPrice: 5000 },
    ];
    const history: CostHistory[] = [
      { productId: 'p1', unitCost: 11_000, source: 'receipt', createdAt: new Date('2026-09-01') },
    ];
    // p1 at its receipt cost, p2 falling back to the catalogue cost.
    expect(inventoryValuation(levels, products, history)).toBe(130_000);
  });

  it('ignores negative stock and unknown products', () => {
    expect(
      inventoryValuation(
        [
          { productId: 'p1', storeId: 's', onHand: -5 },
          { productId: 'ghost', storeId: 's', onHand: 10 },
        ],
        [{ id: 'p1', costPrice: 1000 }],
      ),
    ).toBe(0);
  });
});
