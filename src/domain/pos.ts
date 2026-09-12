/**
 * Pure domain logic for the POS sell flow: cart line math, discounts, change, loyalty
 * points, order code generation, and shift summaries. No store/UI dependencies.
 */

import { roundVND, sum } from './money';
import type { Cart, CartLine, Discount, Order, Shift } from './types';

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

/* ---------------------------------------------------------------------------------------
 * Several customers at once: the sell screen keeps a set of open carts, one of them active.
 * Helpers below are pure so the store is a thin wrapper and the rules stay testable.
 * ------------------------------------------------------------------------------------ */

/** Hard ceiling on simultaneously open orders; the UI disables the new-order control here. */
export const MAX_OPEN_CARTS = 8;

/** The open carts plus which one the catalog and cart pane are currently acting on. */
export interface CartSet {
  carts: Cart[];
  activeCartId: string;
}

/** Cart identity is the ordinal, so two stores never collide on a reused number. */
export function cartId(storeId: string, ordinal: number): string {
  return `cart-${storeId || 'none'}-${ordinal}`;
}

/** A new empty cart for a store. */
export function makeCart(storeId: string, ordinal: number): Cart {
  return { id: cartId(storeId, ordinal), ordinal, storeId, lines: [] };
}

/** A store's starting state: exactly one empty cart, active. */
export function initialCartSet(storeId: string): CartSet {
  const cart = makeCart(storeId, 1);
  return { carts: [cart], activeCartId: cart.id };
}

/** Smallest positive ordinal no open cart is using. */
export function nextCartOrdinal(carts: Cart[]): number {
  const used = new Set(carts.map((cart) => cart.ordinal));
  let ordinal = 1;
  while (used.has(ordinal)) ordinal += 1;
  return ordinal;
}

/**
 * Opens an extra cart and makes it active. Returns `null` at {@link MAX_OPEN_CARTS} so the
 * caller can tell the cashier why nothing happened instead of silently doing nothing.
 */
export function openCart(state: CartSet, storeId: string): CartSet | null {
  if (state.carts.length >= MAX_OPEN_CARTS) return null;
  const cart = makeCart(storeId, nextCartOrdinal(state.carts));
  return { carts: [...state.carts, cart], activeCartId: cart.id };
}

/** Activates an open cart; an unknown id leaves the set untouched. */
export function switchCart(state: CartSet, id: string): CartSet {
  if (!state.carts.some((cart) => cart.id === id)) return state;
  return { ...state, activeCartId: id };
}

/**
 * Closes a cart. Closing the active one activates its neighbour (the next cart, or the
 * previous one when it was last); closing the only cart leaves a fresh empty cart behind so
 * the sell screen always has somewhere to put the next scan.
 */
export function closeCart(state: CartSet, id: string): CartSet {
  const index = state.carts.findIndex((cart) => cart.id === id);
  if (index === -1) return state;

  const remaining = state.carts.filter((cart) => cart.id !== id);
  if (remaining.length === 0) {
    const storeId = state.carts[index].storeId;
    return initialCartSet(storeId);
  }

  if (state.activeCartId !== id) return { ...state, carts: remaining };

  const neighbour = remaining[Math.min(index, remaining.length - 1)];
  return { carts: remaining, activeCartId: neighbour.id };
}

/** Replaces the active cart in the set, leaving the others alone. */
export function updateActiveCart(state: CartSet, update: (cart: Cart) => Cart): CartSet {
  return {
    ...state,
    carts: state.carts.map((cart) => (cart.id === state.activeCartId ? update(cart) : cart)),
  };
}

/** The active cart, or the first one if the active id has gone stale. */
export function activeCartOf(state: CartSet): Cart {
  return state.carts.find((cart) => cart.id === state.activeCartId) ?? state.carts[0];
}
