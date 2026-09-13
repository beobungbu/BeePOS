/**
 * Bridges POS checkout actions to the phase-0-owned stores (order/inventory/customer/ledger).
 * Per the plan's file-ownership rule, phase 1 never edits those store files directly;
 * every cross-store side effect of a completed sale goes through this module instead,
 * calling only their existing public setters (addOrder, adjustStock, addPoints, updateShift,
 * addEntry).
 */

import { shiftSummary } from '../../domain/pos';
import { baseQtyOf } from './lib/wholesale';
import { loyaltyPointsForOrder } from './lib/loyalty';
import type { LedgerEntry, Order } from '../../domain/types';
import { useCustomerStore } from '../../data/customer-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useLedgerStore } from '../../data/ledger-store';
import { useOrderStore } from '../../data/order-store';
import { usePricingStore } from '../../data/pricing-store';

export interface SubmitOrderOptions {
  shiftId?: string;
}

/**
 * Finalizes an order: appends it to order-store, decrements stock for every line, awards
 * loyalty points (net of any points redeemed as payment), and refreshes the open shift's
 * running totals if one is active.
 *
 * Two things are deliberately different for a wholesale order. Stock does not move here: the
 * goods leave when a delivery note is marked delivered, which may be days later and may
 * happen in two trips. And no loyalty points are awarded: a company account buys on a
 * contract price, and paying it a retail loyalty rate on top would double-discount it.
 */
export function submitOrder(order: Order, options: SubmitOrderOptions = {}): void {
  useOrderStore.getState().addOrder(order);

  const wholesale = order.channel === 'wholesale';

  if (!wholesale) {
    for (const line of order.lines) {
      // Base units, not selling units: one case of 24 takes 24 off the shelf.
      useInventoryStore.getState().adjustStock(line.productId, order.storeId, -baseQtyOf(line));
    }
  }

  // Cash taken over the counter is drawer cash, whichever channel rang it up, so the branch
  // cash book sees it the moment the bill is paid. Keyed by the order, so a screen that
  // re-submits cannot book the takings twice.
  const cashTaken = order.payments
    .filter((payment) => payment.method === 'cash')
    .reduce((total, payment) => total + payment.amount, 0);
  if (cashTaken > 0) {
    useLedgerStore.getState().postCashBook({
      orgId: order.orgId,
      storeId: order.storeId,
      kind: 'sale',
      amount: cashTaken,
      ref: `order-${order.id}`,
      staffId: order.cashierId,
      createdAt: new Date(order.createdAt),
    });
  }

  if (order.customerId && !wholesale) {
    const customer = useCustomerStore.getState().customers.find((item) => item.id === order.customerId);
    const rule = usePricingStore.getState().loyaltyRule;
    // The tier is read before the sale is booked: the bill earns at the rate the buyer stood
    // on when it was rung up, not at the one it may have just promoted them to.
    const points = loyaltyPointsForOrder(order, customer?.tier ?? 'bronze', rule);
    useCustomerStore
      .getState()
      .addPoints(order.customerId, points.earned - points.redeemed, order.total, order.id);
  }

  if (options.shiftId) {
    const shift = useOrderStore.getState().shifts.find((item) => item.id === options.shiftId);
    if (shift) {
      const summary = shiftSummary(shift, useOrderStore.getState().orders);
      useOrderStore.getState().updateShift({
        ...shift,
        orderCount: summary.orderCount,
        revenue: summary.revenue,
        expectedCash: summary.expectedCash,
      });
    }
  }
}

/**
 * Books the receivable an on-account order creates.
 *
 * The order carries no payment, because none was taken: what the buyer owes lives in the
 * ledger, where the collection screen and the aging table read it. The entry is stamped with
 * the branch the order was sold at, so the per-branch debt report can find it.
 */
export function recordOnAccountInvoice(order: Order): LedgerEntry | undefined {
  if (!order.customerId || order.total <= 0) return undefined;

  const entry: LedgerEntry = {
    id: `ledger-ar-${order.id}`,
    orgId: order.orgId,
    party: 'customer',
    partyId: order.customerId,
    storeId: order.storeId,
    kind: 'invoice',
    refType: 'order',
    refId: order.id,
    amount: order.total,
    dueDate: order.dueDate,
    createdAt: new Date(order.createdAt),
    note: order.code,
  };

  useLedgerStore.getState().addEntry(entry);
  return entry;
}

/**
 * Takes the goods of a delivered note off the branch's shelves.
 *
 * Delivery note quantities are already in base units (the note is a picking list), so no unit
 * conversion happens here. Called when a note is marked delivered, which is the moment a
 * wholesale order's stock actually moves.
 */
export function releaseDeliveredStock(
  storeId: string,
  lines: readonly { productId: string; qty: number }[],
): void {
  for (const line of lines) {
    if (line.qty <= 0) continue;
    useInventoryStore.getState().adjustStock(line.productId, storeId, -line.qty);
  }
}
