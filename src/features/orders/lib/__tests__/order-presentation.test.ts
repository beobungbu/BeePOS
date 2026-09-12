import type { Order } from '../../../../domain/types';
import type { OrderStats } from '../../../../domain/orders';
import { fill } from '../fill';
import {
  averageOrderValue,
  formatDate,
  formatDateTime,
  formatTime,
  isCancelled,
  isoDay,
  itemCount,
  pageRange,
  paymentSummary,
  rangeForPreset,
} from '../order-presentation';

const TODAY = new Date(2026, 8, 12, 14, 32); // 12/09/2026 14:32 local

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    code: 'HD20260912-0018',
    storeId: 'store-1',
    cashierId: 'staff-1',
    lines: [
      { productId: 'p1', qty: 2, unitPrice: 9_000 },
      { productId: 'p2', qty: 5, unitPrice: 4_500 },
    ],
    subtotal: 40_500,
    discountTotal: 0,
    taxTotal: 0,
    total: 40_500,
    payments: [{ method: 'cash', amount: 40_500 }],
    status: 'paid',
    createdAt: new Date(2026, 8, 12, 14, 32).toISOString(),
    ...overrides,
  };
}

describe('date presets', () => {
  it('reads the local calendar day, not the UTC one', () => {
    expect(isoDay(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01');
  });

  it('today is a single day range', () => {
    expect(rangeForPreset('today', TODAY)).toEqual({ fromDate: '2026-09-12', toDate: '2026-09-12' });
  });

  it('7 days is inclusive of today, so it spans 7 calendar days', () => {
    expect(rangeForPreset('days7', TODAY)).toEqual({ fromDate: '2026-09-06', toDate: '2026-09-12' });
  });

  it('30 days spans 30 calendar days and crosses the month boundary', () => {
    expect(rangeForPreset('days30', TODAY)).toEqual({ fromDate: '2026-08-14', toDate: '2026-09-12' });
  });

  it('custom keeps the range the caller already holds', () => {
    const current = { fromDate: '2026-01-01', toDate: '2026-02-01' };
    expect(rangeForPreset('custom', TODAY, current)).toEqual(current);
  });
});

describe('stats and pagination', () => {
  const stats = (over: Partial<OrderStats> = {}): OrderStats => ({
    orderCount: 18,
    revenue: 3_482_000,
    refundCount: 1,
    refundAmount: 42_000,
    ...over,
  });

  it('averages revenue over the order count', () => {
    expect(averageOrderValue(stats())).toBe(193_444);
  });

  it('does not divide by zero on an empty result set', () => {
    expect(averageOrderValue(stats({ orderCount: 0, revenue: 0 }))).toBe(0);
  });

  it('reports the 1-based inclusive range of a full page', () => {
    expect(pageRange(1, 10, 18)).toEqual({ from: 1, to: 10 });
  });

  it('clamps the last page to the total', () => {
    expect(pageRange(2, 10, 18)).toEqual({ from: 11, to: 18 });
  });

  it('reports an empty range when nothing matched', () => {
    expect(pageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });
});

describe('formats from the copy rules', () => {
  it('formats dates and times', () => {
    const iso = new Date(2026, 8, 12, 14, 32).toISOString();
    expect(formatDate(iso)).toBe('12/09/2026');
    expect(formatTime(iso)).toBe('14:32');
    expect(formatDateTime(iso)).toBe('12/09/2026 14:32');
  });

  it('returns an empty string for an unparseable timestamp instead of "Invalid Date"', () => {
    expect(formatDate('not-a-date')).toBe('');
    expect(formatTime('not-a-date')).toBe('');
  });
});

describe('order summaries', () => {
  it('counts units, not lines', () => {
    expect(itemCount(makeOrder())).toBe(7);
  });

  it('joins distinct payment methods once each', () => {
    const order = makeOrder({
      payments: [
        { method: 'cash', amount: 20_000 },
        { method: 'cash', amount: 10_000 },
        { method: 'transfer', amount: 10_500 },
      ],
    });
    expect(paymentSummary(order, (method) => method)).toBe('cash, transfer');
  });

  it('marks only voided orders as cancelled', () => {
    expect(isCancelled(makeOrder({ status: 'void' }))).toBe(true);
    expect(isCancelled(makeOrder({ status: 'partial_refund' }))).toBe(false);
  });
});

describe('fill', () => {
  it('substitutes every placeholder', () => {
    expect(fill('Hiển thị {from} đến {to} trong {total} đơn', { from: 1, to: 10, total: 18 })).toBe(
      'Hiển thị 1 đến 10 trong 18 đơn',
    );
  });

  it('leaves an unknown placeholder untouched rather than printing "undefined"', () => {
    expect(fill('{a} {b}', { a: 'x' })).toBe('x {b}');
  });
});
