/**
 * The order status machine, in one place.
 *
 * Retail rings straight into `paid`. Wholesale walks `quote -> confirmed -> delivering ->
 * completed -> paid`, because the money and the goods move at different moments and the
 * receivables ledger needs to know which of the two has happened. Both branches can end in
 * `cancelled` (the sale never happened) or, once money has changed hands, `void` and the
 * refund states.
 */

import type { OrderStatus } from './types';

/** Every status an order may move to from a given one. An empty list is a terminal state. */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  // A quote is an offer: accept it or drop it.
  quote: ['confirmed', 'cancelled'],
  // Confirmed stock can ship, or be handed over on the spot, or be paid for up front.
  confirmed: ['delivering', 'completed', 'paid', 'cancelled'],
  // Goods on the road can arrive or be recalled; they cannot go back to "not yet sent".
  delivering: ['completed', 'cancelled'],
  // Delivered but not settled: the invoice is now collectable, and returnable.
  completed: ['paid', 'partial_refund', 'refunded'],
  // Settled. A mistake found inside the void window undoes it; anything later is a refund.
  paid: ['partial_refund', 'refunded', 'void'],
  // More of the same order can come back, up to the whole of it.
  partial_refund: ['partial_refund', 'refunded'],
  refunded: [],
  void: [],
  cancelled: [],
};

/** Statuses that still expect work: they show on the open-orders list. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  'quote',
  'confirmed',
  'delivering',
  'completed',
];

/** Statuses that recognise revenue. `completed` counts: the goods are with the customer. */
export const REVENUE_ORDER_STATUSES: readonly OrderStatus[] = [
  'completed',
  'paid',
  'partial_refund',
];

/** Whether `to` is a legal next status from `from`. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** The statuses reachable from `from`, in the order the UI should offer them. */
export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return [...ORDER_TRANSITIONS[from]];
}

/** True when no move out of `status` is possible. */
export function isTerminal(status: OrderStatus): boolean {
  return ORDER_TRANSITIONS[status].length === 0;
}

/** True while the order still owes someone goods or money. */
export function isOpen(status: OrderStatus): boolean {
  return OPEN_ORDER_STATUSES.includes(status);
}

/** True when the order's value belongs in revenue reports. */
export function isRevenue(status: OrderStatus): boolean {
  return REVENUE_ORDER_STATUSES.includes(status);
}

/**
 * Returns `to` when the move is legal, and throws otherwise. Callers that mutate an order
 * should go through this so an impossible status can never be written.
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid order transition: "${from}" cannot become "${to}"`);
  }
  return to;
}
