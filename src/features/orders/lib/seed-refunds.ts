/**
 * Backfills plausible `Refund` records for seed orders already carrying a 'refunded' or
 * 'partial_refund' status (see src/data/seed/orders.ts), so the orders list stats, the
 * order detail timeline, and customer point history all have something real to show
 * without editing the phase-0-owned seed module itself.
 *
 * Reuses `refundPlan` so seeded amounts follow the exact same proportional-discount math
 * as a refund created interactively through the UI.
 */

import type { Order } from '../../../domain/types';
import { refundPlan, type Refund } from '../../../domain/orders';

const REASONS = ['Khách đổi ý', 'Sản phẩm lỗi', 'Giao nhầm hàng', 'Khách trả bớt số lượng'];

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function buildSeedRefunds(orders: Order[]): Refund[] {
  const refunds: Refund[] = [];

  orders.forEach((order, index) => {
    if (order.status !== 'refunded' && order.status !== 'partial_refund') return;

    const isFull = order.status === 'refunded';
    const linesToRefund = isFull ? order.lines : order.lines.slice(0, Math.max(1, Math.floor(order.lines.length / 2)));
    const requestLines = linesToRefund.map((line) => ({
      productId: line.productId,
      qty: isFull ? line.qty : Math.max(1, Math.floor(line.qty / 2)),
    }));

    const plan = refundPlan({ order, requestLines, priorRefunds: [] });
    if (!plan.valid) return;

    refunds.push({
      id: `refund-seed-${order.id}`,
      orderId: order.id,
      createdAt: addMinutes(order.createdAt, 30 + (index % 120)),
      lines: plan.lines,
      method: order.payments[0]?.method ?? 'cash',
      reason: REASONS[index % REASONS.length],
      amount: plan.amount,
      pointsDeducted: plan.pointsToDeduct,
    });
  });

  return refunds;
}
