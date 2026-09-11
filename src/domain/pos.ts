/**
 * Pure domain logic for the POS sell flow: cart line math, discounts, change, loyalty
 * points, order code generation, and shift summaries. No store/UI dependencies.
 */

import { roundVND, sum } from './money';
import type { CartLine, Discount, Order, Shift } from './types';

/** A cart line combined with the tax rate its product carries. */
export interface PricedCartLine extends CartLine {
  taxRate: number;
}

export interface LineTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
}

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

export interface ShiftSummary {
  orderCount: number;
  revenue: number;
  cashRevenue: number;
  expectedCash: number;
  /** null until the shift has a closingCash to compare against. */
  variance: number | null;
}

/** Applies a percent/amount discount to a base amount, clamped to [0, base]. */
export function applyOrderDiscount(base: number, discount: Discount | undefined): number {
  if (!discount || base <= 0) return 0;
  const raw = discount.type === 'percent' ? (base * discount.value) / 100 : discount.value;
  return roundVND(Math.min(Math.max(raw, 0), base));
}

/** Computes subtotal, discount, taxable base, tax, and total for a single cart line. */
export function calcLine(line: PricedCartLine): LineTotals {
  const subtotal = roundVND(line.unitPrice * line.qty);
  const discount = applyOrderDiscount(subtotal, line.lineDiscount);
  const taxable = Math.max(0, subtotal - discount);
  const tax = roundVND(taxable * line.taxRate);
  return { subtotal, discount, taxable, tax, total: taxable + tax };
}

/**
 * Computes cart-wide totals. Order-level discount applies to the post-line-discount
 * subtotal, clamped to it; tax is scaled down proportionally to the order discount so
 * that a 100% order discount also zeroes out tax (VND rounding applied at each step).
 */
export function calcCart(lines: PricedCartLine[], orderDiscount?: Discount): CartTotals {
  const lineResults = lines.map(calcLine);
  const subtotal = sum(lineResults.map((r) => r.subtotal));
  const lineDiscountTotal = sum(lineResults.map((r) => r.discount));
  const netAfterLineDiscount = Math.max(0, subtotal - lineDiscountTotal);
  const orderDiscountAmount = applyOrderDiscount(netAfterLineDiscount, orderDiscount);

  const taxableBase = sum(lineResults.map((r) => r.taxable));
  const taxRatio = taxableBase > 0 ? Math.max(0, (taxableBase - orderDiscountAmount) / taxableBase) : 0;
  const taxTotal = sum(lineResults.map((r) => r.tax * taxRatio));

  const discountTotal = lineDiscountTotal + orderDiscountAmount;
  const total = Math.max(0, roundVND(subtotal - discountTotal + taxTotal));

  return { subtotal, discountTotal, taxTotal, total };
}

/** Change owed back to the customer: tendered minus the amount actually due, floored at 0. */
export function calcChange(amountDue: number, amountTendered: number): number {
  return Math.max(0, roundVND(amountTendered - amountDue));
}

/** 1 point earned per 10,000 VND spent. */
export function pointsEarned(amountSpent: number): number {
  if (!Number.isFinite(amountSpent) || amountSpent <= 0) return 0;
  return Math.floor(amountSpent / 10000);
}

/** 1 point redeems for 1,000 VND. */
export function pointsToVnd(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  return Math.floor(points) * 1000;
}

function pad3(value: number): string {
  return String(value).padStart(3, '0');
}

function yyyymmdd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/** Next sequential order code for a store/day: HD-<storeCode>-<yyyymmdd>-<seq>. */
export function nextOrderCode(storeCode: string, date: Date, existingCodesForStore: string[]): string {
  const prefix = `HD-${storeCode}-${yyyymmdd(date)}-`;
  const usedSeqs = existingCodesForStore
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const nextSeq = (usedSeqs.length > 0 ? Math.max(...usedSeqs) : 0) + 1;
  return `${prefix}${pad3(nextSeq)}`;
}

function withinShiftWindow(createdAt: string, shift: Shift): boolean {
  const t = new Date(createdAt).getTime();
  const opened = new Date(shift.openedAt).getTime();
  const closed = shift.closedAt ? new Date(shift.closedAt).getTime() : Number.POSITIVE_INFINITY;
  return t >= opened && t <= closed;
}

/** Recomputes a shift's order count, revenue, cash revenue, expected cash, and cash variance. */
export function shiftSummary(shift: Shift, orders: Order[]): ShiftSummary {
  const shiftOrders = orders.filter(
    (order) => order.storeId === shift.storeId && order.cashierId === shift.cashierId && withinShiftWindow(order.createdAt, shift),
  );
  const revenue = sum(shiftOrders.map((order) => order.total));
  const cashRevenue = sum(
    shiftOrders.flatMap((order) => order.payments.filter((p) => p.method === 'cash').map((p) => p.amount)),
  );
  const expectedCash = roundVND(shift.openingCash + cashRevenue);
  const variance = shift.closingCash != null ? roundVND(shift.closingCash - expectedCash) : null;

  return { orderCount: shiftOrders.length, revenue, cashRevenue, expectedCash, variance };
}

/** Adds a product to cart lines, incrementing qty if it is already present. */
export function addOrIncrementLine(lines: CartLine[], productId: string, unitPrice: number, qty = 1): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines, { productId, qty, unitPrice }];
  return setLineQty(lines, productId, existing.qty + qty);
}

/** Sets a line's quantity; qty <= 0 removes the line entirely. */
export function setLineQty(lines: CartLine[], productId: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((line) => line.productId !== productId);
  return lines.map((line) => (line.productId === productId ? { ...line, qty } : line));
}
