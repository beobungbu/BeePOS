/**
 * Gross profit per product, measured against the cost each line carried when it was sold.
 *
 * The existing `reports.grossProfit` multiplies quantity by the product's catalogue cost,
 * which silently rewrites last month's margin the next time a delivery lands at a new price.
 * These rows read `unitCostSnapshot` instead, which is what the spec means by "profit uses the
 * snapshot, not today's cost".
 *
 * No status policy here on purpose: the caller passes the orders it counts as revenue, so the
 * reports screen keeps one definition of "sold" instead of two.
 */

import { lineCogs } from '../../../domain/costing';
import { roundVND, sum } from '../../../domain/money';
import { applyOrderDiscount } from '../../../domain/pos';
import type { Order, OrderLine } from '../../../domain/types';

export interface ProductProfitRow {
  productId: string;
  /** Quantity in base units, so a case line and a single line add up. */
  qty: number;
  revenue: number;
  cogs: number;
  profit: number;
  /** Profit over revenue, one decimal place. Zero revenue reads 0. */
  marginPercent: number;
}

/** What a line brought in: its price less its own discount. Order discount is not split here. */
export function lineRevenue(line: OrderLine): number {
  const subtotal = roundVND(line.unitPrice * line.qty);
  return Math.max(0, subtotal - applyOrderDiscount(subtotal, line.lineDiscount));
}

/** Base units a line moved, counting the unit conversion a wholesale line may carry. */
export function lineBaseQty(line: OrderLine): number {
  const factor = line.unitFactor && line.unitFactor > 0 ? line.unitFactor : 1;
  return line.qty * factor;
}

/** Margin as a percentage of revenue, one decimal place. */
export function marginPercentOf(revenue: number, profit: number): number {
  if (revenue <= 0) return 0;
  return Math.round((profit / revenue) * 1000) / 10;
}

/** One row per product sold, best profit first. */
export function productGrossProfit(orders: readonly Pick<Order, 'lines'>[]): ProductProfitRow[] {
  const totals = new Map<string, { qty: number; revenue: number; cogs: number }>();

  for (const order of orders) {
    for (const line of order.lines) {
      const entry = totals.get(line.productId) ?? { qty: 0, revenue: 0, cogs: 0 };
      entry.qty += lineBaseQty(line);
      entry.revenue += lineRevenue(line);
      entry.cogs += lineCogs(line);
      totals.set(line.productId, entry);
    }
  }

  return [...totals.entries()]
    .map(([productId, entry]) => {
      const revenue = roundVND(entry.revenue);
      const cogs = roundVND(entry.cogs);
      const profit = roundVND(revenue - cogs);
      return { productId, qty: entry.qty, revenue, cogs, profit, marginPercent: marginPercentOf(revenue, profit) };
    })
    .sort((a, b) => b.profit - a.profit);
}

/** Chain totals of the same rows, for the stat strip above the table. */
export function grossProfitTotals(rows: readonly ProductProfitRow[]): {
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number;
} {
  const revenue = sum(rows.map((row) => row.revenue));
  const cogs = sum(rows.map((row) => row.cogs));
  const profit = roundVND(revenue - cogs);
  return { revenue, cogs, profit, marginPercent: marginPercentOf(revenue, profit) };
}
