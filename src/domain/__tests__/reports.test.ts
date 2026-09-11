import type { Order, Product, Staff, Store } from '../types';
import {
  averageBasket,
  cashierPerformance,
  deltaPercent,
  filterOrders,
  grossProfit,
  paymentMix,
  periodRange,
  previousPeriod,
  revenueByDay,
  revenueByStore,
  topProducts,
  totalRefunds,
  totalRevenue,
} from '../reports';

const NOW = new Date('2026-09-11T09:00:00.000Z');

const stores: Store[] = [
  { id: 'store-1', code: 'HN01', name: 'Store 1', address: '', phone: '', isActive: true },
  { id: 'store-2', code: 'HN02', name: 'Store 2', address: '', phone: '', isActive: true },
];

const staff: Staff[] = [
  { id: 'staff-1', name: 'An', role: 'cashier', storeIds: ['store-1'], pin: '1234' },
  { id: 'staff-2', name: 'Binh', role: 'cashier', storeIds: ['store-2'], pin: '1234' },
];

const products: Product[] = [
  {
    id: 'p1',
    sku: 'p1',
    barcode: '1',
    name: 'Sữa tươi',
    categoryId: 'c1',
    unit: 'hộp',
    costPrice: 10_000,
    salePrice: 15_000,
    taxRate: 0.08,
    isActive: true,
  },
  {
    id: 'p2',
    sku: 'p2',
    barcode: '2',
    name: 'Bánh mì',
    categoryId: 'c1',
    unit: 'cái',
    costPrice: 5_000,
    salePrice: 8_000,
    taxRate: 0.08,
    isActive: true,
  },
];

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: 'order-1',
    code: 'HD001',
    storeId: 'store-1',
    cashierId: 'staff-1',
    lines: [{ productId: 'p1', qty: 2, unitPrice: 15_000 }],
    subtotal: 30_000,
    discountTotal: 0,
    taxTotal: 0,
    total: 30_000,
    payments: [{ method: 'cash', amount: 30_000 }],
    status: 'paid',
    createdAt: '2026-09-11T10:00:00.000Z',
    ...overrides,
  };
}

describe('periodRange', () => {
  it('returns a 1-day window for today', () => {
    const range = periodRange('today', NOW);
    expect(range.start).toBe('2026-09-11T00:00:00.000Z');
    expect(range.end).toBe('2026-09-12T00:00:00.000Z');
  });

  it('returns a 7-day window ending tomorrow (today inclusive)', () => {
    const range = periodRange('7d', NOW);
    expect(range.start).toBe('2026-09-05T00:00:00.000Z');
    expect(range.end).toBe('2026-09-12T00:00:00.000Z');
  });

  it('returns a 30-day window', () => {
    const range = periodRange('30d', NOW);
    expect(range.start).toBe('2026-08-13T00:00:00.000Z');
  });

  it('uses custom start/end (inclusive) when provided', () => {
    const range = periodRange(
      'custom',
      NOW,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-03T00:00:00.000Z'),
    );
    expect(range.start).toBe('2026-09-01T00:00:00.000Z');
    expect(range.end).toBe('2026-09-04T00:00:00.000Z');
  });

  it('falls back to today when custom is missing bounds', () => {
    const range = periodRange('custom', NOW);
    expect(range.start).toBe('2026-09-11T00:00:00.000Z');
  });
});

describe('previousPeriod', () => {
  it('returns the immediately preceding window of the same duration', () => {
    const range = periodRange('today', NOW);
    const previous = previousPeriod(range);
    expect(previous.end).toBe(range.start);
    expect(previous.start).toBe('2026-09-10T00:00:00.000Z');
  });
});

describe('filterOrders', () => {
  const orders = [
    makeOrder({ id: 'a', storeId: 'store-1', createdAt: '2026-09-11T10:00:00.000Z' }),
    makeOrder({ id: 'b', storeId: 'store-2', createdAt: '2026-09-11T11:00:00.000Z' }),
    makeOrder({ id: 'c', storeId: 'store-1', createdAt: '2026-09-01T10:00:00.000Z' }),
  ];
  const range = periodRange('today', NOW);

  it('filters by date range', () => {
    expect(filterOrders(orders, range).map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('filters by store when provided', () => {
    expect(filterOrders(orders, range, 'store-1').map((o) => o.id)).toEqual(['a']);
  });
});

describe('totalRevenue and totalRefunds', () => {
  it('sums only paid/partial_refund orders as revenue', () => {
    const orders = [
      makeOrder({ id: 'a', status: 'paid', total: 100_000 }),
      makeOrder({ id: 'b', status: 'partial_refund', total: 50_000 }),
      makeOrder({ id: 'c', status: 'void', total: 20_000 }),
      makeOrder({ id: 'd', status: 'refunded', total: 30_000 }),
    ];
    expect(totalRevenue(orders)).toBe(150_000);
    expect(totalRefunds(orders)).toBe(30_000);
  });
});

describe('averageBasket', () => {
  it('divides revenue by the number of revenue-recognized orders', () => {
    const orders = [
      makeOrder({ id: 'a', total: 100_000 }),
      makeOrder({ id: 'b', total: 200_000 }),
      makeOrder({ id: 'c', status: 'void', total: 999_999 }),
    ];
    expect(averageBasket(orders)).toBe(150_000);
  });

  it('returns 0 for no revenue orders', () => {
    expect(averageBasket([makeOrder({ status: 'void' })])).toBe(0);
  });
});

describe('grossProfit', () => {
  it('subtracts cost of goods sold from revenue', () => {
    const order = makeOrder({
      lines: [{ productId: 'p1', qty: 2, unitPrice: 15_000 }],
      total: 30_000,
    });
    // revenue 30_000 - cogs (10_000 * 2) = 10_000
    expect(grossProfit([order], products)).toBe(10_000);
  });
});

describe('deltaPercent', () => {
  it('computes percent change', () => {
    expect(deltaPercent(120, 100)).toBe(20);
    expect(deltaPercent(80, 100)).toBe(-20);
  });

  it('handles a zero previous value', () => {
    expect(deltaPercent(0, 0)).toBe(0);
    expect(deltaPercent(50, 0)).toBe(100);
  });
});

describe('revenueByDay', () => {
  it('zero-fills days with no orders and sums revenue per day', () => {
    const range = periodRange('custom', NOW, new Date('2026-09-10'), new Date('2026-09-11'));
    const orders = [makeOrder({ createdAt: '2026-09-11T10:00:00.000Z', total: 40_000 })];
    const days = revenueByDay(orders, range);
    expect(days).toEqual([
      { date: '2026-09-10', revenue: 0 },
      { date: '2026-09-11', revenue: 40_000 },
    ]);
  });
});

describe('revenueByStore', () => {
  it('computes revenue share per store', () => {
    const orders = [
      makeOrder({ id: 'a', storeId: 'store-1', total: 75_000 }),
      makeOrder({ id: 'b', storeId: 'store-2', total: 25_000 }),
    ];
    const result = revenueByStore(orders, stores);
    expect(result).toEqual([
      { storeId: 'store-1', storeName: 'Store 1', orders: 1, revenue: 75_000, sharePercent: 75 },
      { storeId: 'store-2', storeName: 'Store 2', orders: 1, revenue: 25_000, sharePercent: 25 },
    ]);
  });
});

describe('topProducts', () => {
  it('ranks products by net revenue descending', () => {
    const orders = [
      makeOrder({
        lines: [
          { productId: 'p1', qty: 1, unitPrice: 15_000 },
          { productId: 'p2', qty: 5, unitPrice: 8_000 },
        ],
      }),
    ];
    const result = topProducts(orders, products, 10);
    expect(result[0].productId).toBe('p2');
    expect(result[0].revenue).toBe(40_000);
    expect(result[1].productId).toBe('p1');
  });

  it('respects the limit', () => {
    const orders = [
      makeOrder({
        lines: [
          { productId: 'p1', qty: 1, unitPrice: 15_000 },
          { productId: 'p2', qty: 1, unitPrice: 8_000 },
        ],
      }),
    ];
    expect(topProducts(orders, products, 1)).toHaveLength(1);
  });
});

describe('paymentMix', () => {
  it('sums amounts per payment method with share percent', () => {
    const orders = [
      makeOrder({ payments: [{ method: 'cash', amount: 60_000 }], total: 60_000 }),
      makeOrder({ payments: [{ method: 'transfer', amount: 40_000 }], total: 40_000 }),
    ];
    const result = paymentMix(orders);
    expect(result).toEqual([
      { method: 'cash', amount: 60_000, sharePercent: 60 },
      { method: 'transfer', amount: 40_000, sharePercent: 40 },
    ]);
  });
});

describe('cashierPerformance', () => {
  it('groups revenue orders by cashier', () => {
    const orders = [
      makeOrder({ cashierId: 'staff-1', total: 100_000 }),
      makeOrder({ cashierId: 'staff-1', total: 50_000 }),
      makeOrder({ cashierId: 'staff-2', total: 30_000 }),
    ];
    const result = cashierPerformance(orders, staff);
    expect(result[0]).toEqual({
      cashierId: 'staff-1',
      name: 'An',
      orders: 2,
      revenue: 150_000,
      averageBasket: 75_000,
    });
    expect(result[1].cashierId).toBe('staff-2');
  });
});
