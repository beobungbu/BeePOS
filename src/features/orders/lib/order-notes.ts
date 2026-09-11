/**
 * Deterministic per-order note generator. `Order` (src/domain/types.ts, phase-0-owned) has
 * no `note` field, so notes live keyed by orderId in `useOrderStore.notes` instead of on
 * the order itself, keeping the shared type untouched.
 */

import type { Order } from '../../../domain/types';

const SAMPLE_NOTES = [
  'Khách quen, giao hàng tận nơi',
  'Đổi trả trong 3 ngày nếu lỗi',
  'Thanh toán trước, nhận hàng sau',
  'Khách yêu cầu xuất hoá đơn VAT',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** About 1 in 7 orders gets a canned note; the rest have none. */
export function buildOrderNotes(orders: Order[]): Record<string, string> {
  const notes: Record<string, string> = {};
  orders.forEach((order) => {
    const hash = hashString(order.id);
    if (hash % 7 === 0) {
      notes[order.id] = SAMPLE_NOTES[hash % SAMPLE_NOTES.length];
    }
  });
  return notes;
}
