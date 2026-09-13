import type { CostHistory, GoodsReceipt } from '../../../domain/types';
import { costHistoryRows, onHandBeforeFromAverages } from '../lib/cost-history-rows';

function history(unitCost: number, source: CostHistory['source'], day: number, refId?: string): CostHistory {
  return {
    productId: 'product-1',
    storeId: 'store-1',
    unitCost,
    source,
    refId,
    createdAt: new Date(Date.UTC(2026, 7, day)),
  };
}

function receipt(id: string, qty: number, unitCost: number): GoodsReceipt {
  return {
    id,
    orgId: 'org-1',
    storeId: 'store-1',
    supplierId: 'supplier-1',
    lines: [{ productId: 'product-1', qty, unitCost }],
    status: 'received',
    createdAt: new Date(Date.UTC(2026, 7, 12)).toISOString(),
  };
}

describe('onHandBeforeFromAverages', () => {
  it('recovers the stock the mockup blends 240 units into', () => {
    expect(
      onHandBeforeFromAverages({ qtyIn: 240, unitCostIn: 6_400, averageBefore: 6_200, averageAfter: 6_343 }),
    ).toBe(96);
  });

  it('refuses to divide when the two averages are a dong apart', () => {
    expect(
      onHandBeforeFromAverages({ qtyIn: 240, unitCostIn: 6_500, averageBefore: 6_500, averageAfter: 6_500 }),
    ).toBeUndefined();
  });

  it('refuses a result that is not a plausible quantity', () => {
    expect(
      onHandBeforeFromAverages({ qtyIn: 10, unitCostIn: 6_000, averageBefore: 6_000, averageAfter: 6_002 }),
    ).toBeUndefined();
    expect(
      onHandBeforeFromAverages({ qtyIn: 0, unitCostIn: 6_000, averageBefore: 5_000, averageAfter: 5_500 }),
    ).toBeUndefined();
  });
});

describe('costHistoryRows', () => {
  const rows = costHistoryRows(
    [history(6_200, 'seed', 1), history(6_343, 'receipt', 12, 'receipt-1'), history(6_500, 'manual', 20)],
    [receipt('receipt-1', 240, 6_400)],
    'product-1',
  );

  it('chains the average of each row onto the next', () => {
    expect(rows.map((row) => [row.averageBefore, row.averageAfter])).toEqual([
      [undefined, 6_200],
      [6_200, 6_343],
      [6_343, 6_500],
    ]);
  });

  it('reads quantity and purchase price off the receipt the row names', () => {
    expect(rows[1].qtyIn).toBe(240);
    expect(rows[1].unitCostIn).toBe(6_400);
    expect(rows[1].onHandBefore).toBe(96);
  });

  it('opens from nothing and leaves a manual row without receipt figures', () => {
    expect(rows[0].onHandBefore).toBe(0);
    expect(rows[2].qtyIn).toBeUndefined();
    expect(rows[2].unitCostIn).toBeUndefined();
  });

  it('leaves receipt figures out when the receipt is missing', () => {
    const orphan = costHistoryRows([history(6_200, 'seed', 1), history(6_400, 'receipt', 12, 'gone')], [], 'product-1');
    expect(orphan[1].qtyIn).toBeUndefined();
    expect(orphan[1].onHandBefore).toBeUndefined();
  });
});
