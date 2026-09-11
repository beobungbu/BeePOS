/**
 * Derives a plausible `PointMovement[]` timeline from seed orders/refunds so the customer
 * detail "Điểm" tab has real history instead of a flat balance. One 'earned' movement per
 * paid order attached to the customer, one 'adjust' movement per refund against those
 * orders, and a single reconciling 'adjust' so the derived total matches the seeded
 * `customer.points` exactly.
 */

import type { Customer, Order } from '../../../domain/types';
import { POINTS_PER_VND, type Refund } from '../../../domain/orders';
import type { PointMovement } from '../../../domain/customers';

export function buildSeedPointHistory(customers: Customer[], orders: Order[], refunds: Refund[]): PointMovement[] {
  const movements: PointMovement[] = [];

  customers.forEach((customer) => {
    const customerOrders = orders
      .filter((order) => order.customerId === customer.id && order.status !== 'void')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    let derivedBalance = 0;

    customerOrders.forEach((order) => {
      const earned = Math.floor(order.total / POINTS_PER_VND);
      derivedBalance += earned;
      movements.push({
        id: `pm-${order.id}`,
        customerId: customer.id,
        kind: 'earned',
        points: earned,
        note: `Tích điểm từ đơn ${order.code}`,
        createdAt: order.createdAt,
        orderId: order.id,
      });

      refunds
        .filter((refund) => refund.orderId === order.id)
        .forEach((refund) => {
          derivedBalance -= refund.pointsDeducted;
          movements.push({
            id: `pm-${refund.id}`,
            customerId: customer.id,
            kind: 'adjust',
            points: -refund.pointsDeducted,
            note: `Trừ điểm do hoàn tiền đơn ${order.code}`,
            createdAt: refund.createdAt,
            orderId: order.id,
          });
        });
    });

    const reconciliation = customer.points - derivedBalance;
    if (reconciliation !== 0) {
      movements.push({
        id: `pm-adjust-${customer.id}`,
        customerId: customer.id,
        kind: 'adjust',
        points: reconciliation,
        note: 'Điều chỉnh số dư ban đầu',
        createdAt: customer.createdAt,
      });
    }
  });

  return movements.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
