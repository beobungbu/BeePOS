/**
 * Freezing an open order into an `Order`.
 *
 * One builder for both ways an order leaves the till: the quote a wholesale buyer takes away
 * and the sale that is rung up. They differ by status and by whether any money was taken, and
 * nothing else, so a second copy of this arithmetic is how the two would start disagreeing
 * about a total.
 */

import { nextOrderCode, toOrderLines } from '../../../domain/pos';
import { dueDateFor } from '../../../domain/ledger';
import type { CartTotals } from '../../../domain/pos';
import type {
  Customer,
  Order,
  OrderStatus,
  Payment,
  Store,
  VatInvoiceInfo,
} from '../../../domain/types';
import type { PosCart } from '../../../data/cart-store';

export interface BuildOrderInput {
  cart: PosCart;
  store: Pick<Store, 'id' | 'code'>;
  orgId: string;
  cashierId: string;
  customer?: Customer;
  totals: CartTotals;
  payments: Payment[];
  status: OrderStatus;
  /** Codes already used at this branch, so the sequence never repeats. */
  existingCodes: string[];
  /** Weighted-average cost of a product at this branch, frozen onto every line. */
  costFor: (productId: string) => number;
  /** Set on an on-account order: the invoice falls due this many days out. */
  onAccount?: boolean;
  now?: Date;
}

/** The buyer's details as the VAT invoice needs them, defaulted from the customer record. */
export function vatInvoiceFor(customer: Customer | undefined): VatInvoiceInfo | undefined {
  if (!customer || customer.type !== 'company') return undefined;
  return {
    buyerName: customer.companyName ?? customer.name,
    taxCode: customer.taxCode ?? '',
    address: customer.deliveryAddress ?? '',
  };
}

/** True when the invoice block has everything a VAT invoice may not be printed without. */
export function vatInvoiceComplete(info: VatInvoiceInfo | undefined): boolean {
  return Boolean(info && info.buyerName.trim() && info.taxCode.trim() && info.address.trim());
}

export function buildOrder(input: BuildOrderInput): Order {
  const now = input.now ?? new Date();
  const wholesale = input.cart.wholesale === true;

  return {
    id: `order-${now.getTime()}`,
    orgId: input.orgId,
    code: nextOrderCode(input.store.code, now, input.existingCodes),
    storeId: input.store.id,
    cashierId: input.cashierId,
    customerId: input.cart.customerId,
    // The cost each line is measured against is frozen here: a later receipt may move the
    // product's weighted average, and this order's margin must not move with it.
    lines: toOrderLines(input.cart.lines, input.costFor),
    subtotal: input.totals.subtotal,
    discountTotal: input.totals.discountTotal,
    taxTotal: input.totals.taxTotal,
    total: input.totals.total,
    payments: input.payments,
    status: input.status,
    createdAt: now.toISOString(),
    channel: wholesale ? 'wholesale' : 'retail',
    ...(wholesale && input.cart.salesRepId ? { salesRepId: input.cart.salesRepId } : {}),
    ...(input.onAccount
      ? { dueDate: dueDateFor(now, input.customer?.paymentTermDays) }
      : {}),
    ...(wholesale && input.cart.vatInvoice ? { vatInvoice: input.cart.vatInvoice } : {}),
    ...(wholesale && input.customer?.deliveryAddress
      ? { deliveryAddress: input.customer.deliveryAddress }
      : {}),
  };
}
