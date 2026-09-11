import type { Customer, Order } from '../types';
import {
  applyRefund,
  canVoid,
  filterOrders,
  orderStats,
  refundPlan,
  sortOrders,
  type Refund,
} from '../orders';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    code: 'HD20260911-0001',
    storeId: 'store-1',
    cashierId: 'staff-6',
    customerId: 'customer-1',
    lines: [
      { productId: 'product-1', qty: 2, unitPrice: 10_000 },
      { productId: 'product-2', qty: 1, unitPrice: 20_000 },
    ],
    subtotal: 40_000,
    discountTotal: 0,
    taxTotal: 4_000,
    total: 44_000,
    payments: [{ method: 'cash', amount: 44_000 }],
    status: 'paid',
    createdAt: '2026-09-10T09:00:00.000Z',
    ...overrides,
  };
}

const customers: Customer[] = [
  {
    id: 'customer-1',
    name: 'Nguyễn Văn An',
    phone: '0912345678',
    points: 100,
    tier: 'bronze',
    totalSpent: 500_000,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('filterOrders', () => {
  const orders = [
    makeOrder({ id: 'a', storeId: 'store-1', status: 'paid', createdAt: '2026-09-01T00:00:00.000Z' }),
    makeOrder({ id: 'b', storeId: 'store-2', status: 'refunded', createdAt: '2026-09-05T00:00:00.000Z' }),
    makeOrder({
      id: 'c',
      storeId: 'store-1',
      status: 'paid',
      customerId: undefined,
      code: 'HD20260908-0009',
      createdAt: '2026-09-08T00:00:00.000Z',
    }),
  ];

  it('filters by storeId', () => {
    expect(filterOrders(orders, { storeId: 'store-1' }, customers).map((o) => o.id)).toEqual(['a', 'c']);
  });

  it('filters by status', () => {
    expect(filterOrders(orders, { status: 'refunded' }, customers).map((o) => o.id)).toEqual(['b']);
  });

  it('filters by inclusive date range', () => {
    const result = filterOrders(orders, { fromDate: '2026-09-05', toDate: '2026-09-08' }, customers);
    expect(result.map((o) => o.id)).toEqual(['b', 'c']);
  });

  it('matches search against order code', () => {
    expect(filterOrders(orders, { search: '0009' }, customers).map((o) => o.id)).toEqual(['c']);
  });

  it('matches search against attached customer phone', () => {
    expect(filterOrders(orders, { search: '912345' }, customers).map((o) => o.id)).toEqual(['a', 'b']);
  });

  it('combines multiple filters', () => {
    const result = filterOrders(orders, { storeId: 'store-1', status: 'paid' }, customers);
    expect(result.map((o) => o.id)).toEqual(['a', 'c']);
  });
});

describe('sortOrders', () => {
  const orders = [
    makeOrder({ id: 'a', total: 30_000, createdAt: '2026-09-01T00:00:00.000Z' }),
    makeOrder({ id: 'b', total: 10_000, createdAt: '2026-09-03T00:00:00.000Z' }),
    makeOrder({ id: 'c', total: 20_000, createdAt: '2026-09-02T00:00:00.000Z' }),
  ];

  it('sorts by total ascending', () => {
    expect(sortOrders(orders, 'total', 'ascending').map((o) => o.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by time descending without mutating the input', () => {
    const sorted = sortOrders(orders, 'time', 'descending');
    expect(sorted.map((o) => o.id)).toEqual(['b', 'c', 'a']);
    expect(orders.map((o) => o.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('orderStats', () => {
  it('aggregates order count, revenue, and matching refunds', () => {
    const orders = [
      makeOrder({ id: 'a', status: 'paid', total: 44_000 }),
      makeOrder({ id: 'b', status: 'partial_refund', total: 44_000 }),
      makeOrder({ id: 'c', status: 'void', total: 44_000 }),
    ];
    const refunds: Refund[] = [
      { id: 'r1', orderId: 'b', createdAt: '2026-09-10T10:00:00.000Z', lines: [], method: 'cash', reason: 'x', amount: 10_000, pointsDeducted: 1 },
      { id: 'r2', orderId: 'unrelated', createdAt: '2026-09-10T10:00:00.000Z', lines: [], method: 'cash', reason: 'x', amount: 5_000, pointsDeducted: 0 },
    ];
    const stats = orderStats(orders, refunds);
    expect(stats.orderCount).toBe(3);
    expect(stats.revenue).toBe(88_000);
    expect(stats.refundCount).toBe(1);
    expect(stats.refundAmount).toBe(10_000);
  });
});

describe('refundPlan', () => {
  it('rejects an empty request', () => {
    const order = makeOrder();
    const plan = refundPlan({ order, requestLines: [], priorRefunds: [] });
    expect(plan.valid).toBe(false);
  });

  it('rejects a product not on the order', () => {
    const order = makeOrder();
    const plan = refundPlan({ order, requestLines: [{ productId: 'missing', qty: 1 }], priorRefunds: [] });
    expect(plan.valid).toBe(false);
    expect(plan.error).toMatch(/not on this order/);
  });

  it('rejects qty exceeding what was sold', () => {
    const order = makeOrder();
    const plan = refundPlan({ order, requestLines: [{ productId: 'product-1', qty: 5 }], priorRefunds: [] });
    expect(plan.valid).toBe(false);
  });

  it('computes a proportional amount for a single line, including tax', () => {
    const order = makeOrder();
    // product-1: qty 2 @ 10_000 = 20_000 gross; blended rate 44_000/40_000 = 1.1
    const plan = refundPlan({ order, requestLines: [{ productId: 'product-1', qty: 1 }], priorRefunds: [] });
    expect(plan.valid).toBe(true);
    expect(plan.amount).toBe(11_000);
    expect(plan.pointsToDeduct).toBe(1);
  });

  it('caps remaining qty against prior refunds on the same product', () => {
    const order = makeOrder();
    const priorRefunds: Refund[] = [
      { id: 'r1', orderId: order.id, createdAt: order.createdAt, lines: [{ productId: 'product-1', qty: 1, amount: 11_000 }], method: 'cash', reason: 'x', amount: 11_000, pointsDeducted: 1 },
    ];
    const plan = refundPlan({ order, requestLines: [{ productId: 'product-1', qty: 2 }], priorRefunds });
    expect(plan.valid).toBe(false);
  });

  it('allows a full-order refund across all lines', () => {
    const order = makeOrder();
    const plan = refundPlan({
      order,
      requestLines: [
        { productId: 'product-1', qty: 2 },
        { productId: 'product-2', qty: 1 },
      ],
      priorRefunds: [],
    });
    expect(plan.valid).toBe(true);
    expect(plan.amount).toBe(order.total);
  });
});

describe('applyRefund', () => {
  it('returns partial_refund when less than the order total has been refunded', () => {
    const order = makeOrder({ total: 44_000 });
    expect(applyRefund(order, 0, 11_000)).toBe('partial_refund');
  });

  it('returns refunded once cumulative refunds reach the order total', () => {
    const order = makeOrder({ total: 44_000 });
    expect(applyRefund(order, 33_000, 11_000)).toBe('refunded');
  });
});

describe('canVoid', () => {
  it('allows voiding a paid order with no refunds within the window', () => {
    const order = makeOrder({ status: 'paid', createdAt: '2026-09-11T08:55:00.000Z' });
    const now = new Date('2026-09-11T09:00:00.000Z');
    expect(canVoid(order, false, now)).toBe(true);
  });

  it('blocks voiding after the window elapses', () => {
    const order = makeOrder({ status: 'paid', createdAt: '2026-09-11T08:00:00.000Z' });
    const now = new Date('2026-09-11T09:00:00.000Z');
    expect(canVoid(order, false, now)).toBe(false);
  });

  it('blocks voiding an order that already has refunds', () => {
    const order = makeOrder({ status: 'paid', createdAt: '2026-09-11T08:59:00.000Z' });
    const now = new Date('2026-09-11T09:00:00.000Z');
    expect(canVoid(order, true, now)).toBe(false);
  });

  it('blocks voiding a non-paid order', () => {
    const order = makeOrder({ status: 'partial_refund', createdAt: '2026-09-11T08:59:00.000Z' });
    const now = new Date('2026-09-11T09:00:00.000Z');
    expect(canVoid(order, false, now)).toBe(false);
  });
});
