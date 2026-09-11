/**
 * Bridges POS checkout actions to the phase-0-owned stores (order/inventory/customer).
 * Per the plan's file-ownership rule, phase 1 never edits those store files directly;
 * every cross-store side effect of a completed sale goes through this module instead,
 * calling only their existing public setters (addOrder, adjustStock, addPoints, updateShift).
 */

import { pointsEarned, shiftSummary } from '../../domain/pos';
import type { Order } from '../../domain/types';
import { useCustomerStore } from '../../data/customer-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useOrderStore } from '../../data/order-store';

/**
 * Finalizes a paid order: appends it to order-store, decrements stock for every line,
 * awards loyalty points (net of any points redeemed as payment), and refreshes the
 * open shift's running totals if one is active.
 */
export function submitOrder(order: Order, options: { shiftId?: string } = {}): void {
  useOrderStore.getState().addOrder(order);

  for (const line of order.lines) {
    useInventoryStore.getState().adjustStock(line.productId, order.storeId, -line.qty);
  }

  if (order.customerId) {
    const pointsPayment = order.payments.find((payment) => payment.method === 'points');
    const redeemedPoints = pointsPayment ? Math.round(pointsPayment.amount / 1000) : 0;
    const earnedPoints = pointsEarned(order.total);
    useCustomerStore.getState().addPoints(order.customerId, earnedPoints - redeemedPoints, order.total);
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
