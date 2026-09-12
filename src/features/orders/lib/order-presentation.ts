/**
 * Pure presentation rules for the orders screens: the date presets behind the filter chips,
 * the derived stat the mockup shows next to revenue and the
 * pagination footer range. Dates and times are formatted by `src/lib/datetime.ts`,
 * which every screen shares. No React, no store, no BeeUI.
 */

import type { Order } from '../../../domain/types';
import type { OrderStats } from '../../../domain/orders';

export type DatePreset = 'today' | 'days7' | 'days30' | 'custom';

/** Presets offered as chips on phone and as a select from tablet up, in display order. */
export const DATE_PRESETS: Exclude<DatePreset, 'custom'>[] = ['today', 'days7', 'days30'];

/** Local calendar day as `YYYY-MM-DD`; `toISOString()` would shift by the UTC offset. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Inclusive `fromDate`/`toDate` for a preset. `custom` keeps whatever the caller already
 * holds, so switching to it never silently widens or narrows the current range.
 */
export function rangeForPreset(
  preset: DatePreset,
  today: Date,
  current?: { fromDate: string; toDate: string },
): { fromDate: string; toDate: string } {
  const toDate = isoDay(today);
  if (preset === 'custom') return current ?? { fromDate: toDate, toDate };
  const backDays = preset === 'today' ? 0 : preset === 'days7' ? 6 : 29;
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - backDays);
  return { fromDate: isoDay(from), toDate };
}

/** Revenue divided by the orders that produced it, rounded to whole dong; 0 for an empty list. */
export function averageOrderValue(stats: OrderStats): number {
  if (stats.orderCount === 0) return 0;
  return Math.round(stats.revenue / stats.orderCount);
}

/** 1-based inclusive range of the current page, for `Hiển thị 1 đến 10 trong 18 đơn`. */
export function pageRange(page: number, pageSize: number, total: number): { from: number; to: number } {
  if (total === 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  return { from, to: Math.min(page * pageSize, total) };
}

/** Total number of units on an order, for `4 sản phẩm`. */
export function itemCount(order: Order): number {
  return order.lines.reduce((total, line) => total + line.qty, 0);
}

/**
 * Payment column text: one method, or every distinct method joined, so a split payment reads
 * `Tiền mặt, Chuyển khoản` instead of repeating a method that was tendered twice.
 */
export function paymentSummary(order: Order, label: (method: string) => string): string {
  const methods = Array.from(new Set(order.payments.map((payment) => payment.method)));
  return methods.map(label).join(', ');
}

/** A cancelled order's money is struck through so a quick scan never adds it to the day. */
export function isCancelled(order: Order): boolean {
  return order.status === 'void';
}
