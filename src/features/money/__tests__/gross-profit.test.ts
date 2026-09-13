import type { Order, OrderLine } from '../../../domain/types';
import {
  grossProfitTotals,
  lineBaseQty,
  lineRevenue,
  marginPercentOf,
  productGrossProfit,
} from '../lib/gross-profit';

function line(partial: Partial<OrderLine> & Pick<OrderLine, 'productId'>): OrderLine {
  return {
    qty: 1,
    unitPrice: 9_000,
    unitCostSnapshot: 6_500,
    priceSource: 'list',
    ...partial,
  };
}

function order(lines: OrderLine[]): Pick<Order, 'lines'> {
  return { lines };
}

describe('lineRevenue', () => {
  it('takes the line discount off and nothing else', () => {
    expect(lineRevenue(line({ productId: 'p1', qty: 10 }))).toBe(90_000);
    expect(
      lineRevenue(line({ productId: 'p1', qty: 10, lineDiscount: { type: 'percent', value: 10 } })),
    ).toBe(81_000);
    expect(
      lineRevenue(line({ productId: 'p1', qty: 10, lineDiscount: { type: 'amount', value: 20_000 } })),
    ).toBe(70_000);
  });
});

describe('lineBaseQty', () => {
  it('counts a case line in the units it holds', () => {
    expect(lineBaseQty(line({ productId: 'p1', qty: 10, unit: 'thùng', unitFactor: 24 }))).toBe(240);
    expect(lineBaseQty(line({ productId: 'p1', qty: 10 }))).toBe(10);
  });
});

describe('productGrossProfit', () => {
  it('measures profit against the cost frozen on the line, not a current one', () => {
    const rows = productGrossProfit([
      order([line({ productId: 'p1', qty: 96, unitPrice: 9_000, unitCostSnapshot: 6_500 })]),
    ]);
    expect(rows).toEqual([
      {
        productId: 'p1',
        qty: 96,
        revenue: 864_000,
        cogs: 624_000,
        profit: 240_000,
        marginPercent: 27.8,
      },
    ]);
  });

  it('adds a case line and a single line of the same product together', () => {
    const rows = productGrossProfit([
      order([
        line({ productId: 'p1', qty: 2, unit: 'thùng', unitFactor: 24, unitPrice: 200_000, unitCostSnapshot: 6_000 }),
        line({ productId: 'p1', qty: 5, unitPrice: 9_000, unitCostSnapshot: 6_000 }),
      ]),
    ]);
    expect(rows[0].qty).toBe(53);
    expect(rows[0].revenue).toBe(445_000);
    expect(rows[0].cogs).toBe(318_000);
  });

  it('sorts the best earner first', () => {
    const rows = productGrossProfit([
      order([
        line({ productId: 'small', qty: 1, unitPrice: 10_000, unitCostSnapshot: 9_000 }),
        line({ productId: 'big', qty: 10, unitPrice: 10_000, unitCostSnapshot: 5_000 }),
      ]),
    ]);
    expect(rows.map((row) => row.productId)).toEqual(['big', 'small']);
  });

  it('reads zero revenue as zero margin rather than dividing by it', () => {
    expect(marginPercentOf(0, 0)).toBe(0);
    const rows = productGrossProfit([order([line({ productId: 'free', qty: 1, unitPrice: 0, unitCostSnapshot: 0 })])]);
    expect(rows[0].marginPercent).toBe(0);
  });
});

describe('grossProfitTotals', () => {
  it('totals the rows it is given', () => {
    const rows = productGrossProfit([
      order([
        line({ productId: 'p1', qty: 10, unitPrice: 10_000, unitCostSnapshot: 6_000 }),
        line({ productId: 'p2', qty: 10, unitPrice: 20_000, unitCostSnapshot: 14_000 }),
      ]),
    ]);
    expect(grossProfitTotals(rows)).toEqual({
      revenue: 300_000,
      cogs: 200_000,
      profit: 100_000,
      marginPercent: 33.3,
    });
  });
});
