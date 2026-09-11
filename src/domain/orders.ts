/**
 * Pure domain logic for orders and refunds. No React, no store, no BeeUI imports.
 *
 * `Order` (src/domain/types.ts, owned by phase 0) has no built-in refund ledger, so this
 * module also owns the `Refund` shape. Refund records live in `useOrderStore`'s `refunds`
 * array, keyed by `orderId`.
 */

import type { CartLine, Customer, Discount, Order, OrderStatus, PaymentMethod } from './types';
import { roundVND, sum } from './money';

/** How many VND earn/cost one loyalty point. Matches the rate baked into seed customer data. */
export const POINTS_PER_VND = 10_000;

/** How long after `createdAt` a paid, unrefunded order may still be voided. */
export const VOID_WINDOW_MS = 10 * 60 * 1000;

export interface RefundLine {
  productId: string;
  qty: number;
  /** Refunded amount for this line, proportional to the order's blended discount/tax rate. */
  amount: number;
}

export interface Refund {
  id: string;
  orderId: string;
  createdAt: string;
  lines: RefundLine[];
  method: PaymentMethod;
  reason: string;
  amount: number;
  pointsDeducted: number;
}

export interface OrderFilters {
  storeId?: string;
  cashierId?: string;
  status?: OrderStatus;
  /** Inclusive, `YYYY-MM-DD`. */
  fromDate?: string;
  /** Inclusive, `YYYY-MM-DD`. */
  toDate?: string;
  /** Matches order code or the attached customer's phone, case-insensitive. */
  search?: string;
}

/** Filters orders. `customers` resolves `order.customerId` to a phone number for search. */
export function filterOrders(orders: Order[], filters: OrderFilters, customers: Customer[]): Order[] {
  const search = filters.search?.trim().toLowerCase();
  const phoneById = new Map(customers.map((customer) => [customer.id, customer.phone]));

  return orders.filter((order) => {
    if (filters.storeId && order.storeId !== filters.storeId) return false;
    if (filters.cashierId && order.cashierId !== filters.cashierId) return false;
    if (filters.status && order.status !== filters.status) return false;
    if (filters.fromDate && order.createdAt.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && order.createdAt.slice(0, 10) > filters.toDate) return false;

    if (search) {
      const code = order.code.toLowerCase();
      const phone = order.customerId ? (phoneById.get(order.customerId) ?? '') : '';
      if (!code.includes(search) && !phone.toLowerCase().includes(search)) return false;
    }

    return true;
  });
}

export type OrderSortKey = 'time' | 'total';
export type SortDirection = 'ascending' | 'descending';

/** Returns a new array sorted by `key`; does not mutate `orders`. */
export function sortOrders(orders: Order[], key: OrderSortKey, direction: SortDirection): Order[] {
  const factor = direction === 'descending' ? -1 : 1;
  return [...orders].sort((a, b) => {
    const av = key === 'time' ? a.createdAt : a.total;
    const bv = key === 'time' ? b.createdAt : b.total;
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return 0;
  });
}

export interface OrderStats {
  orderCount: number;
  revenue: number;
  refundCount: number;
  refundAmount: number;
}

/** Aggregates stats over an already-filtered order list; `refunds` are matched by orderId. */
export function orderStats(orders: Order[], refunds: Refund[]): OrderStats {
  const orderIds = new Set(orders.map((order) => order.id));
  const relevantRefunds = refunds.filter((refund) => orderIds.has(refund.orderId));
  const revenue = sum(
    orders
      .filter((order) => order.status === 'paid' || order.status === 'partial_refund')
      .map((order) => order.total),
  );

  return {
    orderCount: orders.length,
    revenue,
    refundCount: relevantRefunds.length,
    refundAmount: sum(relevantRefunds.map((refund) => refund.amount)),
  };
}

/** Net amount for a cart line after its own line-level discount, before order-level discount/tax. */
export function lineNetAmount(line: CartLine): number {
  const gross = line.qty * line.unitPrice;
  return applyDiscount(gross, line.lineDiscount);
}

function applyDiscount(amount: number, discount?: Discount): number {
  if (!discount) return amount;
  return discount.type === 'percent'
    ? amount * (1 - discount.value / 100)
    : Math.max(0, amount - discount.value);
}

function refundedQtyByProduct(priorRefunds: Refund[], productId: string): number {
  return priorRefunds.reduce(
    (total, refund) =>
      total + refund.lines.filter((line) => line.productId === productId).reduce((s, l) => s + l.qty, 0),
    0,
  );
}

export interface RefundRequestLine {
  productId: string;
  qty: number;
}

export interface RefundPlanInput {
  order: Order;
  requestLines: RefundRequestLine[];
  /** Refunds already recorded against this order, used to cap remaining refundable qty. */
  priorRefunds: Refund[];
}

export interface RefundPlanResult {
  valid: boolean;
  error?: string;
  lines: RefundLine[];
  amount: number;
  pointsToDeduct: number;
}

/**
 * Validates a refund request and computes its amount. Each line's refund amount is the
 * line's net-of-line-discount value for the requested qty, scaled by the order's blended
 * discount+tax rate (`order.total / order.subtotal`) so order-level discounts and tax are
 * distributed proportionally across whatever lines are being refunded.
 */
export function refundPlan({ order, requestLines, priorRefunds }: RefundPlanInput): RefundPlanResult {
  if (requestLines.length === 0) {
    return { valid: false, error: 'no lines selected', lines: [], amount: 0, pointsToDeduct: 0 };
  }

  const blendedRate = order.subtotal > 0 ? order.total / order.subtotal : 0;
  const lines: RefundLine[] = [];

  for (const request of requestLines) {
    if (!Number.isFinite(request.qty) || request.qty <= 0) {
      return {
        valid: false,
        error: `invalid qty for product ${request.productId}`,
        lines: [],
        amount: 0,
        pointsToDeduct: 0,
      };
    }

    const orderLine = order.lines.find((line) => line.productId === request.productId);
    if (!orderLine) {
      return {
        valid: false,
        error: `product ${request.productId} is not on this order`,
        lines: [],
        amount: 0,
        pointsToDeduct: 0,
      };
    }

    const alreadyRefunded = refundedQtyByProduct(priorRefunds, request.productId);
    const remaining = orderLine.qty - alreadyRefunded;
    if (request.qty > remaining) {
      return {
        valid: false,
        error: `qty exceeds remaining refundable (${remaining}) for product ${request.productId}`,
        lines: [],
        amount: 0,
        pointsToDeduct: 0,
      };
    }

    const perUnitNet = lineNetAmount(orderLine) / orderLine.qty;
    const amount = roundVND(perUnitNet * request.qty * blendedRate);
    lines.push({ productId: request.productId, qty: request.qty, amount });
  }

  const amount = sum(lines.map((line) => line.amount));
  const pointsToDeduct = Math.floor(amount / POINTS_PER_VND);

  return { valid: true, lines, amount, pointsToDeduct };
}

/**
 * Resolves the order's next status after recording a refund of `newRefundAmount`, given
 * `priorRefundedAmount` already recorded. Full-value refunds become `refunded`, anything
 * less becomes `partial_refund`.
 */
export function applyRefund(order: Order, priorRefundedAmount: number, newRefundAmount: number): OrderStatus {
  const totalRefunded = priorRefundedAmount + newRefundAmount;
  return totalRefunded >= order.total ? 'refunded' : 'partial_refund';
}

/** A paid order with no refunds can be voided within `VOID_WINDOW_MS` of creation. */
export function canVoid(order: Order, hasRefunds: boolean, now: Date = new Date()): boolean {
  if (order.status !== 'paid') return false;
  if (hasRefunds) return false;
  return now.getTime() - new Date(order.createdAt).getTime() <= VOID_WINDOW_MS;
}
