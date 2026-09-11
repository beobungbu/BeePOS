/**
 * Pure reporting/analytics domain logic for the chain dashboard (`/reports`).
 *
 * Modeling assumptions (no backend, seed data only):
 * - Revenue is recognized for orders with status `paid` or `partial_refund` (a partially
 *   refunded order still represents mostly-realized revenue). `void` orders never happened;
 *   `refunded` orders are excluded from revenue but their `total` is used as the refunded
 *   amount (the domain model has no separate refunded-amount field per order).
 * - Gross profit approximates cost of goods sold as `costPrice * qty` per line in
 *   revenue-recognized orders, ignoring how line/order discounts were distributed across
 *   lines (a common simplification when a real accounting engine is out of scope).
 */
import type { CartLine, Order, OrderStatus, PaymentMethod, Product, Staff, Store } from './types';
import { roundVND, sum } from './money';

export const REVENUE_STATUSES: readonly OrderStatus[] = ['paid', 'partial_refund'];

export type PeriodKey = 'today' | '7d' | '30d' | 'custom';

export interface PeriodRange {
  /** Inclusive ISO start instant. */
  start: string;
  /** Exclusive ISO end instant. */
  end: string;
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * Computes the [start, end) instant range for a period key, anchored to `now`.
 * `custom` requires `customStart`/`customEnd` (inclusive calendar days); falls back to
 * `today` when they are missing so callers always get a valid range.
 */
export function periodRange(
  key: PeriodKey,
  now: Date,
  customStart?: Date,
  customEnd?: Date,
): PeriodRange {
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  if (key === 'today') {
    return { start: todayStart.toISOString(), end: todayEnd.toISOString() };
  }
  if (key === '7d') {
    return { start: addDays(todayStart, -6).toISOString(), end: todayEnd.toISOString() };
  }
  if (key === '30d') {
    return { start: addDays(todayStart, -29).toISOString(), end: todayEnd.toISOString() };
  }
  if (customStart && customEnd) {
    const start = startOfDay(customStart);
    const end = addDays(startOfDay(customEnd), 1);
    return start <= end
      ? { start: start.toISOString(), end: end.toISOString() }
      : { start: end.toISOString(), end: addDays(start, 1).toISOString() };
  }
  return { start: todayStart.toISOString(), end: todayEnd.toISOString() };
}

/** Returns the immediately preceding range of the same duration, for delta comparisons. */
export function previousPeriod(range: PeriodRange): PeriodRange {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const durationMs = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - durationMs).toISOString(), end: range.start };
}

/** Filters orders to those created within `range` and (optionally) a single store. */
export function filterOrders(orders: Order[], range: PeriodRange, storeId?: string): Order[] {
  return orders.filter((order) => {
    if (storeId && order.storeId !== storeId) return false;
    return order.createdAt >= range.start && order.createdAt < range.end;
  });
}

function revenueOrders(orders: Order[]): Order[] {
  return orders.filter((order) => REVENUE_STATUSES.includes(order.status));
}

/** Net amount of one order line after its own line-level discount (before order discount). */
function lineNetAmount(line: CartLine): number {
  const gross = line.qty * line.unitPrice;
  if (!line.lineDiscount) return gross;
  return line.lineDiscount.type === 'percent'
    ? gross * (1 - line.lineDiscount.value / 100)
    : Math.max(0, gross - line.lineDiscount.value);
}

/** Total revenue (sum of `total`) across revenue-recognized orders. */
export function totalRevenue(orders: Order[]): number {
  return sum(revenueOrders(orders).map((order) => order.total));
}

/** Total refunded amount, approximated as the `total` of fully refunded orders. */
export function totalRefunds(orders: Order[]): number {
  return sum(orders.filter((order) => order.status === 'refunded').map((order) => order.total));
}

/** Average basket value (revenue / number of revenue-recognized orders). */
export function averageBasket(orders: Order[]): number {
  const paid = revenueOrders(orders);
  if (paid.length === 0) return 0;
  return roundVND(totalRevenue(paid) / paid.length);
}

/** Gross profit = revenue minus cost of goods sold, for revenue-recognized orders. */
export function grossProfit(orders: Order[], products: Product[]): number {
  const productById = new Map(products.map((product) => [product.id, product]));
  const revenue = totalRevenue(orders);
  const cogs = sum(
    revenueOrders(orders).flatMap((order) =>
      order.lines.map((line) => (productById.get(line.productId)?.costPrice ?? 0) * line.qty),
    ),
  );
  return roundVND(revenue - cogs);
}

/** Percent change from `previous` to `current`, rounded to one decimal place. */
export function deltaPercent(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export interface DayRevenue {
  /** Calendar day in `YYYY-MM-DD` (UTC). */
  date: string;
  revenue: number;
}

/** Revenue per calendar day across the whole range, zero-filled for days with no orders. */
export function revenueByDay(orders: Order[], range: PeriodRange): DayRevenue[] {
  const start = startOfDay(new Date(range.start));
  const end = new Date(range.end);
  const days: DayRevenue[] = [];
  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
    const dayEnd = addDays(cursor, 1);
    const dayOrders = revenueOrders(orders).filter(
      (order) => order.createdAt >= cursor.toISOString() && order.createdAt < dayEnd.toISOString(),
    );
    days.push({ date: cursor.toISOString().slice(0, 10), revenue: totalRevenue(dayOrders) });
  }
  return days;
}

export interface StoreRevenue {
  storeId: string;
  storeName: string;
  orders: number;
  revenue: number;
  /** Share of total revenue across all stores in this breakdown, 0..100. */
  sharePercent: number;
}

/** Revenue/order-count breakdown per store, with each store's share of total revenue. */
export function revenueByStore(orders: Order[], stores: Store[]): StoreRevenue[] {
  const total = totalRevenue(orders);
  return stores.map((store) => {
    const storeOrders = revenueOrders(orders.filter((order) => order.storeId === store.id));
    const revenue = totalRevenue(storeOrders);
    return {
      storeId: store.id,
      storeName: store.name,
      orders: storeOrders.length,
      revenue,
      sharePercent: total > 0 ? Math.round((revenue / total) * 1000) / 10 : 0,
    };
  });
}

export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

/** Top `limit` products by net revenue across revenue-recognized orders. */
export function topProducts(orders: Order[], products: Product[], limit = 10): TopProduct[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const totals = new Map<string, { qty: number; revenue: number }>();

  for (const order of revenueOrders(orders)) {
    for (const line of order.lines) {
      const entry = totals.get(line.productId) ?? { qty: 0, revenue: 0 };
      entry.qty += line.qty;
      entry.revenue += lineNetAmount(line);
      totals.set(line.productId, entry);
    }
  }

  return [...totals.entries()]
    .map(([productId, entry]) => ({
      productId,
      name: productById.get(productId)?.name ?? productId,
      qty: entry.qty,
      revenue: roundVND(entry.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export interface PaymentMixEntry {
  method: PaymentMethod;
  amount: number;
  sharePercent: number;
}

/** Payment method breakdown by amount collected across revenue-recognized orders. */
export function paymentMix(orders: Order[]): PaymentMixEntry[] {
  const totals = new Map<PaymentMethod, number>();
  for (const order of revenueOrders(orders)) {
    for (const payment of order.payments) {
      totals.set(payment.method, (totals.get(payment.method) ?? 0) + payment.amount);
    }
  }
  const total = sum([...totals.values()]);
  return [...totals.entries()]
    .map(([method, amount]) => ({
      method,
      amount: roundVND(amount),
      sharePercent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface CashierPerformance {
  cashierId: string;
  name: string;
  orders: number;
  revenue: number;
  averageBasket: number;
}

/** Per-cashier order count, revenue and average basket across revenue-recognized orders. */
export function cashierPerformance(orders: Order[], staff: Staff[]): CashierPerformance[] {
  const staffById = new Map(staff.map((member) => [member.id, member]));
  const grouped = new Map<string, Order[]>();
  for (const order of revenueOrders(orders)) {
    const list = grouped.get(order.cashierId) ?? [];
    list.push(order);
    grouped.set(order.cashierId, list);
  }
  return [...grouped.entries()]
    .map(([cashierId, cashierOrders]) => ({
      cashierId,
      name: staffById.get(cashierId)?.name ?? cashierId,
      orders: cashierOrders.length,
      revenue: totalRevenue(cashierOrders),
      averageBasket: averageBasket(cashierOrders),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
