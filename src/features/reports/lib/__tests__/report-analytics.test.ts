import type {
  Category,
  CostHistory,
  LedgerEntry,
  Order,
  Product,
  Staff,
  StockLevel,
  Store,
} from '../../../../domain/types';
import {
  costAsOf,
  debtSummary,
  revenueByCategory,
  revenueByHour,
  salesByRep,
  skusInStock,
  slowMovingValue,
  valuationAt,
  valuationByStore,
  valuationSeries,
} from '../report-analytics';
import { percentLabel } from '../format';

const ORG = 'org-1';
const NOW = new Date('2026-09-11T09:00:00.000Z');

const stores: Store[] = [
  { id: 'store-1', orgId: ORG, code: 'HN01', name: 'Cầu Giấy', address: '', phone: '', isActive: true },
  { id: 'store-2', orgId: ORG, code: 'HN02', name: 'Long Biên', address: '', phone: '', isActive: true },
];

const categories: Category[] = [
  { id: 'cat-milk', orgId: ORG, name: 'Sữa' },
  { id: 'cat-noodle', orgId: ORG, name: 'Mì' },
];

const products: Product[] = [
  {
    id: 'p1',
    orgId: ORG,
    sku: 'SU-001',
    barcode: '1',
    name: 'Sữa tươi',
    categoryId: 'cat-milk',
    unit: 'hộp',
    costPrice: 6_000,
    salePrice: 10_000,
    taxRate: 0.08,
    isActive: true,
  },
  {
    id: 'p2',
    orgId: ORG,
    sku: 'MI-001',
    barcode: '2',
    name: 'Mì gói',
    categoryId: 'cat-noodle',
    unit: 'gói',
    costPrice: 3_000,
    salePrice: 5_000,
    taxRate: 0.08,
    isActive: true,
  },
];

const staff: Staff[] = [
  { id: 'staff-1', orgId: ORG, name: 'An', role: 'cashier', storeIds: ['store-1'], pin: '1' },
  { id: 'staff-7', orgId: ORG, name: 'Hải', role: 'manager', storeIds: ['store-1'], pin: '1' },
];

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: 'order-1',
    orgId: ORG,
    code: 'HD001',
    storeId: 'store-1',
    cashierId: 'staff-1',
    lines: [{ productId: 'p1', qty: 2, unitPrice: 10_000, unitCostSnapshot: 6_000, priceSource: 'list' }],
    subtotal: 20_000,
    discountTotal: 0,
    taxTotal: 0,
    total: 20_000,
    payments: [{ method: 'cash', amount: 20_000 }],
    status: 'paid',
    createdAt: '2026-09-11T10:00:00.000Z',
    channel: 'retail',
    ...overrides,
  };
}

describe('revenueByCategory', () => {
  it('splits revenue by the category of each sold product and shares add to 100', () => {
    const orders = [
      makeOrder({ id: 'o1' }),
      makeOrder({
        id: 'o2',
        lines: [{ productId: 'p2', qty: 4, unitPrice: 5_000, unitCostSnapshot: 3_000, priceSource: 'list' }],
        total: 20_000,
      }),
    ];

    const rows = revenueByCategory(orders, products, categories);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.revenue)).toEqual([20_000, 20_000]);
    expect(rows.reduce((total, row) => total + row.sharePercent, 0)).toBe(100);
  });

  it('keeps a line whose product left the catalogue in an other bucket', () => {
    const orders = [
      makeOrder({
        lines: [{ productId: 'gone', qty: 1, unitPrice: 9_000, unitCostSnapshot: 0, priceSource: 'list' }],
      }),
    ];
    const rows = revenueByCategory(orders, products, categories, 'Khác');
    expect(rows).toEqual([
      { categoryId: 'other', name: 'Khác', revenue: 9_000, qty: 1, sharePercent: 100 },
    ]);
  });

  it('ignores orders that are not revenue', () => {
    expect(revenueByCategory([makeOrder({ status: 'void' })], products, categories)).toEqual([]);
  });
});

describe('revenueByHour', () => {
  it('fills the gap hours inside the trading day and marks the peak', () => {
    const early = '2026-09-11T08:00:00.000Z';
    const late = '2026-09-11T10:00:00.000Z';
    const orders = [
      makeOrder({ id: 'o1', createdAt: early, total: 10_000 }),
      makeOrder({ id: 'o2', createdAt: late, total: 50_000 }),
    ];
    // Hours are read off the device clock, so the expectation is derived the same way rather
    // than hard coded: the test then says the same thing in every timezone.
    const first = new Date(early).getHours();
    const last = new Date(late).getHours();

    const hours = revenueByHour(orders);
    expect(hours.map((hour) => hour.hour)).toEqual([first, first + 1, last]);
    expect(hours[1]).toMatchObject({ revenue: 0, orders: 0, isPeak: false });
    expect(hours[2]).toMatchObject({ revenue: 50_000, isPeak: true });
  });

  it('is empty when nothing sold', () => {
    expect(revenueByHour([])).toEqual([]);
  });
});

describe('salesByRep', () => {
  it('credits the sales rep when the order names one, the cashier otherwise', () => {
    const orders = [
      makeOrder({ id: 'o1' }),
      makeOrder({ id: 'o2', salesRepId: 'staff-7', channel: 'wholesale', total: 60_000 }),
    ];

    const rows = salesByRep(orders, staff);
    expect(rows.map((row) => row.name)).toEqual(['Hải', 'An']);
    expect(rows[0]).toMatchObject({ orders: 1, wholesaleOrders: 1, revenue: 60_000, profit: 48_000 });
    expect(rows[1]).toMatchObject({ orders: 1, wholesaleOrders: 0, revenue: 20_000, profit: 8_000 });
  });
});

const history: CostHistory[] = [
  { productId: 'p1', unitCost: 5_000, source: 'seed', createdAt: new Date('2026-07-01T00:00:00.000Z') },
  { productId: 'p1', storeId: 'store-1', unitCost: 6_000, source: 'receipt', createdAt: new Date('2026-09-01T00:00:00.000Z') },
  { productId: 'p2', unitCost: 3_000, source: 'seed', createdAt: new Date('2026-07-01T00:00:00.000Z') },
];

const levels: StockLevel[] = [
  { productId: 'p1', storeId: 'store-1', onHand: 10, reserved: 0, minLevel: 5 },
  { productId: 'p2', storeId: 'store-2', onHand: 4, reserved: 0, minLevel: 5 },
];

describe('costAsOf', () => {
  it('takes the branch row over the chain row once it exists', () => {
    expect(costAsOf(history, 'p1', 'store-1', new Date('2026-09-10T00:00:00.000Z'))).toBe(6_000);
  });

  it('falls back to the chain row before the branch had one', () => {
    expect(costAsOf(history, 'p1', 'store-1', new Date('2026-08-01T00:00:00.000Z'))).toBe(5_000);
  });

  it('is zero when nothing was known yet', () => {
    expect(costAsOf(history, 'p1', 'store-1', new Date('2026-01-01T00:00:00.000Z'))).toBe(0);
  });
});

describe('valuation', () => {
  it('values stock at the cost in force on the date', () => {
    expect(valuationAt(levels, products, history, NOW)).toBe(10 * 6_000 + 4 * 3_000);
    expect(valuationAt(levels, products, history, new Date('2026-08-01T00:00:00.000Z'))).toBe(
      10 * 5_000 + 4 * 3_000,
    );
  });

  it('narrows to one branch', () => {
    expect(valuationAt(levels, products, history, NOW, 'store-2')).toBe(12_000);
  });

  it('returns one point per week plus today, oldest first', () => {
    const series = valuationSeries(levels, products, history, NOW, 3);
    expect(series).toHaveLength(4);
    expect(series[3].isCurrent).toBe(true);
    expect(series[0].date < series[3].date).toBe(true);
  });

  it('compares each branch against 30 days back and the changes add up', () => {
    const rows = valuationByStore(levels, products, history, stores, NOW, 30);
    expect(rows[0]).toMatchObject({ storeCode: 'HN01', current: 60_000, previous: 50_000, change: 10_000 });
    expect(rows[1].change).toBe(0);
    expect(rows.reduce((total, row) => total + row.change, 0)).toBe(10_000);
  });

  it('counts only products that carry stock', () => {
    expect(skusInStock(levels)).toBe(2);
    expect(skusInStock(levels, 'store-1')).toBe(1);
  });

  it('values what has not sold in the window as slow moving', () => {
    const orders = [makeOrder({ createdAt: '2026-09-10T10:00:00.000Z' })];
    // p1 sold inside the window, p2 did not.
    expect(slowMovingValue(levels, products, history, orders, NOW, 60)).toBe(12_000);
  });
});

describe('debtSummary', () => {
  const entries: LedgerEntry[] = [
    {
      id: 'ar-1',
      orgId: ORG,
      storeId: 'store-1',
      party: 'customer',
      partyId: 'c1',
      kind: 'invoice',
      refType: 'order',
      amount: 20_000_000,
      dueDate: new Date('2026-08-01T00:00:00.000Z'),
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
    },
    {
      id: 'ar-2',
      orgId: ORG,
      storeId: 'store-2',
      party: 'customer',
      partyId: 'c2',
      kind: 'invoice',
      refType: 'order',
      amount: 5_000_000,
      dueDate: new Date('2026-10-01T00:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    },
    {
      id: 'ap-1',
      orgId: ORG,
      storeId: 'store-1',
      party: 'supplier',
      partyId: 's1',
      kind: 'invoice',
      refType: 'receipt',
      amount: 7_000_000,
      dueDate: new Date('2026-09-30T00:00:00.000Z'),
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    },
  ];
  const customerNames = new Map([
    ['c1', 'Minh Long'],
    ['c2', 'Hồng Phát'],
  ]);
  const supplierNames = new Map([['s1', 'An Phát']]);

  it('totals both sides and names the overdue one', () => {
    const summary = debtSummary(entries, customerNames, supplierNames, NOW);
    expect(summary.receivable).toBe(25_000_000);
    expect(summary.receivableOverdue).toBe(20_000_000);
    expect(summary.payable).toBe(7_000_000);
    expect(summary.payableOverdue).toBe(0);
    expect(summary.customers[0]).toMatchObject({ name: 'Minh Long', overdue: 20_000_000 });
    expect(summary.receivableAging.total).toBe(25_000_000);
  });

  it('narrows to the documents raised at one branch', () => {
    const summary = debtSummary(entries, customerNames, supplierNames, NOW, 'store-2');
    expect(summary.receivable).toBe(5_000_000);
    expect(summary.payable).toBe(0);
  });
});

describe('percentLabel', () => {
  it('writes the Vietnamese decimal comma and drops a trailing zero', () => {
    expect(percentLabel(24.6)).toBe('24,6 %');
    expect(percentLabel(25)).toBe('25 %');
    expect(percentLabel(-6.3)).toBe('-6,3 %');
  });
});
