/**
 * Pure domain logic for the POS sell flow: cart line math, discounts, change, loyalty
 * points, order code generation, shift summaries, the keyboard-wedge scan parser and the
 * plain-text receipt. No store/UI dependencies.
 */

import { formatVND, roundVND, sum } from './money';
import type { Refund } from './orders';
import type {
  Cart,
  CartLine,
  CashMovement,
  CashMovementType,
  Discount,
  Order,
  PaymentMethod,
  Shift,
} from './types';

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
  /** Cash paid into the drawer during the shift that did not come from a sale. */
  cashIn: number;
  cashInCount: number;
  /** Cash taken out of the drawer during the shift (banked, petty spend). */
  cashOut: number;
  cashOutCount: number;
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

/** The orders a shift is answerable for: same store, same cashier, inside its window. */
export function ordersInShift(shift: Shift, orders: readonly Order[]): Order[] {
  return orders.filter(
    (order) =>
      order.storeId === shift.storeId &&
      order.cashierId === shift.cashierId &&
      withinShiftWindow(order.createdAt, shift),
  );
}

/** The cash in/out entries booked against a shift, oldest first. */
export function movementsInShift(shiftId: string, movements: readonly CashMovement[]): CashMovement[] {
  return movements
    .filter((movement) => movement.shiftId === shiftId)
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/**
 * Recomputes a shift's order count, revenue, cash revenue, cash in/out, expected cash and
 * cash variance.
 *
 * Expected cash is opening float plus cash sales plus cash paid in minus cash taken out: a
 * drawer the cashier banked 5.000.000 out of is not short by that amount at close, and before
 * cash movements existed that is exactly what the count said. `movements` defaults to empty so
 * a caller that has none (the seeded history, the tests written before this) reads the same
 * numbers it always did.
 */
export function shiftSummary(
  shift: Shift,
  orders: Order[],
  movements: readonly CashMovement[] = [],
): ShiftSummary {
  const shiftOrders = ordersInShift(shift, orders);
  const revenue = sum(shiftOrders.map((order) => order.total));
  const cashRevenue = sum(
    shiftOrders.flatMap((order) => order.payments.filter((p) => p.method === 'cash').map((p) => p.amount)),
  );

  const shiftMovements = movementsInShift(shift.id, movements);
  const ins = shiftMovements.filter((movement) => movement.type === 'in');
  const outs = shiftMovements.filter((movement) => movement.type === 'out');
  const cashIn = sum(ins.map((movement) => movement.amount));
  const cashOut = sum(outs.map((movement) => movement.amount));

  const expectedCash = roundVND(shift.openingCash + cashRevenue + cashIn - cashOut);
  const variance = shift.closingCash != null ? roundVND(shift.closingCash - expectedCash) : null;

  return {
    orderCount: shiftOrders.length,
    revenue,
    cashRevenue,
    cashIn,
    cashInCount: ins.length,
    cashOut,
    cashOutCount: outs.length,
    expectedCash,
    variance,
  };
}

/**
 * Cash in the drawer immediately after a movement: the float, every cash sale and every
 * earlier movement of the shift. The cash sheet prints it beside each row so a count that
 * comes out wrong can be traced back to the entry it went wrong at.
 */
export function drawerAfterMovement(
  shift: Shift,
  orders: Order[],
  movements: readonly CashMovement[],
  movementId: string,
): number {
  const ordered = movementsInShift(shift.id, movements);
  const index = ordered.findIndex((movement) => movement.id === movementId);
  if (index === -1) return shiftSummary(shift, orders, movements).expectedCash;
  return shiftSummary(shift, orders, ordered.slice(0, index + 1)).expectedCash;
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

/* ---------------------------------------------------------------------------------------
 * Keyboard-wedge barcode scanner.
 *
 * A till scanner is a keyboard: it types the digits of the code far faster than a human can
 * and finishes with Enter. The parser below is the whole rule, kept pure so the burst timing
 * is testable without a DOM: digits closer together than `SCAN_MAX_GAP_MS` accumulate, a
 * slower keystroke starts a new burst, and Enter emits the buffer only when it is long
 * enough to be a real code. Anything that is not a digit or Enter cancels the burst, so a
 * cashier typing "cola" never turns into a scan.
 * ------------------------------------------------------------------------------------ */

/** Longest pause between two keystrokes that still counts as one scanner burst. */
export const SCAN_MAX_GAP_MS = 50;

/** Shortest burst that may be emitted as a barcode; EAN-8 is the shortest real symbology. */
export const SCAN_MIN_LENGTH = 8;

/** Digits collected so far and when the last of them arrived (ms, monotonic per caller). */
export interface ScanBuffer {
  digits: string;
  lastAt: number;
}

/** The buffer after a keystroke, plus the code to look up when that keystroke ended a burst. */
export interface ScanStep {
  buffer: ScanBuffer;
  /** Set only on the Enter that closes a burst of at least {@link SCAN_MIN_LENGTH} digits. */
  code?: string;
}

/** A fresh buffer: no digits, and a timestamp far enough back that the next key starts a burst. */
export const emptyScanBuffer: ScanBuffer = { digits: '', lastAt: Number.NEGATIVE_INFINITY };

function isDigit(key: string): boolean {
  return key.length === 1 && key >= '0' && key <= '9';
}

/**
 * Feeds one keystroke to the wedge parser. `key` is the `KeyboardEvent.key` value and `at`
 * is the moment it arrived in milliseconds.
 */
export function scanBuffer(state: ScanBuffer, key: string, at: number): ScanStep {
  const withinBurst = at - state.lastAt <= SCAN_MAX_GAP_MS;

  if (isDigit(key)) {
    const digits = withinBurst ? state.digits + key : key;
    return { buffer: { digits, lastAt: at } };
  }

  if (key === 'Enter') {
    const complete = withinBurst && state.digits.length >= SCAN_MIN_LENGTH;
    return complete ? { buffer: emptyScanBuffer, code: state.digits } : { buffer: emptyScanBuffer };
  }

  // Shift, Alt and friends are modifiers a scanner never sends mid-code, but they also never
  // carry a digit, so treating every other key as a cancel keeps the rule to one sentence.
  return { buffer: emptyScanBuffer };
}

/* ---------------------------------------------------------------------------------------
 * Plain-text receipt, the payload the native share sheet sends and the fallback a 58 mm
 * thermal printer understands. Every visible word is passed in, so the formatter stays pure
 * and the dictionary stays the single source of the copy.
 * ------------------------------------------------------------------------------------ */

/** Character columns on a 58 mm roll at the usual 12x24 font. */
export const RECEIPT_WIDTH = 32;

export interface ReceiptTextLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ReceiptTextLabels {
  orderCode: string;
  date: string;
  cashier: string;
  customer: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  change: string;
}

export interface ReceiptTextInput {
  storeName: string;
  storeAddress?: string;
  code: string;
  /** Already localised by the caller; the domain owns no locale. */
  dateText: string;
  cashierName: string;
  customerName: string;
  lines: ReceiptTextLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: { label: string; amount: number }[];
  change: number;
  footer: string;
  labels: ReceiptTextLabels;
}

/** `left` padded out to `RECEIPT_WIDTH` with `right` flush to the edge, wrapping if needed. */
function pair(left: string, right: string): string {
  const gap = RECEIPT_WIDTH - left.length - right.length;
  if (gap >= 1) return `${left}${' '.repeat(gap)}${right}`;
  return `${left}\n${right.padStart(RECEIPT_WIDTH)}`;
}

function centre(text: string): string {
  if (text.length >= RECEIPT_WIDTH) return text;
  return ' '.repeat(Math.floor((RECEIPT_WIDTH - text.length) / 2)) + text;
}

/** Hard wraps a product name so a long one never pushes its price off the roll. */
function wrap(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const rows: string[] = [];
  let row = '';
  for (const word of words) {
    const candidate = row ? `${row} ${word}` : word;
    if (candidate.length <= RECEIPT_WIDTH) {
      row = candidate;
    } else {
      if (row) rows.push(row);
      row = word.length > RECEIPT_WIDTH ? word.slice(0, RECEIPT_WIDTH) : word;
    }
  }
  if (row) rows.push(row);
  return rows.length > 0 ? rows : [''];
}

/** The receipt as monospaced text: the share payload on native, 32 columns wide. */
export function formatReceiptText(input: ReceiptTextInput): string {
  const rule = '-'.repeat(RECEIPT_WIDTH);
  const rows: string[] = [centre(input.storeName)];
  if (input.storeAddress) rows.push(...wrap(input.storeAddress).map(centre));

  rows.push(
    rule,
    pair(input.labels.orderCode, input.code),
    pair(input.labels.date, input.dateText),
    pair(input.labels.cashier, input.cashierName),
    pair(input.labels.customer, input.customerName),
    rule,
  );

  for (const line of input.lines) {
    rows.push(...wrap(line.name));
    rows.push(pair(`  ${line.qty} x ${formatVND(line.unitPrice)}`, formatVND(line.unitPrice * line.qty)));
  }

  rows.push(
    rule,
    pair(input.labels.subtotal, formatVND(input.subtotal)),
    pair(input.labels.discount, input.discountTotal > 0 ? `-${formatVND(input.discountTotal)}` : formatVND(0)),
    pair(input.labels.tax, formatVND(input.taxTotal)),
    pair(input.labels.total, formatVND(input.total)),
  );

  for (const payment of input.payments) {
    rows.push(pair(payment.label, formatVND(payment.amount)));
  }
  if (input.change > 0) rows.push(pair(input.labels.change, formatVND(input.change)));

  rows.push(rule, centre(input.footer));
  return rows.join('\n');
}

/* ---------------------------------------------------------------------------------------
 * End of day (Z) report.
 *
 * The sheet a till prints when it closes: what it sold, how it was paid, what should be in
 * the drawer and what was actually counted. `zReportTotals` is the arithmetic and
 * `formatZReportText` is the paper, split for the same reason the receipt is: the numbers
 * have to be assertable without a renderer, and the wording has to stay in the dictionary.
 * ------------------------------------------------------------------------------------ */

export interface ZReportTotals {
  orderCount: number;
  /** Sum of order totals, before refunds. */
  grossRevenue: number;
  discountTotal: number;
  refundCount: number;
  refundTotal: number;
  /** What the till actually kept: gross minus refunds. */
  netRevenue: number;
  /** Taken per payment method, in the order the methods are listed. */
  payments: { method: PaymentMethod; amount: number }[];
  openingCash: number;
  cashRevenue: number;
  cashIn: number;
  cashInCount: number;
  cashOut: number;
  cashOutCount: number;
  expectedCash: number;
  /** null while the shift is still open; the count only exists at close. */
  countedCash: number | null;
  variance: number | null;
}

/** Methods in the order the sheet prints them; a method with no takings still prints a zero. */
export const Z_REPORT_METHODS: PaymentMethod[] = ['cash', 'transfer', 'card', 'points'];

export interface ZReportSource {
  shift: Shift;
  orders: Order[];
  refunds: readonly Refund[];
  movements: readonly CashMovement[];
}

/**
 * Every figure on the sheet, derived from the shift alone. Refunds are matched by order, not
 * by their own timestamp: a refund given on an order this shift sold belongs to this shift's
 * takings even when the customer comes back an hour later, which is the number the person
 * counting the drawer is reconciling against.
 */
export function zReportTotals({ shift, orders, refunds, movements }: ZReportSource): ZReportTotals {
  const summary = shiftSummary(shift, orders, movements);
  const shiftOrders = ordersInShift(shift, orders);
  const orderIds = new Set(shiftOrders.map((order) => order.id));
  const shiftRefunds = refunds.filter((refund) => orderIds.has(refund.orderId));

  const grossRevenue = sum(shiftOrders.map((order) => order.total));
  const discountTotal = sum(shiftOrders.map((order) => order.discountTotal));
  const refundTotal = sum(shiftRefunds.map((refund) => refund.amount));

  const payments = Z_REPORT_METHODS.map((method) => ({
    method,
    amount: sum(
      shiftOrders.flatMap((order) =>
        order.payments.filter((payment) => payment.method === method).map((payment) => payment.amount),
      ),
    ),
  }));

  return {
    orderCount: shiftOrders.length,
    grossRevenue,
    discountTotal,
    refundCount: shiftRefunds.length,
    refundTotal,
    netRevenue: roundVND(grossRevenue - refundTotal),
    payments,
    openingCash: shift.openingCash,
    cashRevenue: summary.cashRevenue,
    cashIn: summary.cashIn,
    cashInCount: summary.cashInCount,
    cashOut: summary.cashOut,
    cashOutCount: summary.cashOutCount,
    expectedCash: summary.expectedCash,
    countedCash: shift.closingCash ?? null,
    variance: summary.variance,
  };
}

/** One cash movement as the sheet prints it: `08:15 Nộp tiền` and a signed amount. */
export interface ZReportMovementLine {
  timeText: string;
  reason: string;
  type: CashMovementType;
  amount: number;
}

export interface ZReportLabels {
  title: string;
  revenueSection: string;
  orderCount: string;
  revenue: string;
  discount: string;
  refunds: string;
  netRevenue: string;
  methodSection: string;
  methods: Record<PaymentMethod, string>;
  drawerSection: string;
  openingCash: string;
  cashSales: string;
  cashIn: string;
  cashOut: string;
  expected: string;
  counted: string;
  variance: string;
  movementSection: string;
  noMovements: string;
  closedBy: string;
  printedAt: string;
  notCounted: string;
}

export interface ZReportTextInput {
  orgName: string;
  storeName: string;
  storeAddress?: string;
  /** Already localised by the caller; the domain owns no locale. */
  dateText: string;
  registerName: string;
  shiftWindowText: string;
  cashierNames: string[];
  totals: ZReportTotals;
  movements: ZReportMovementLine[];
  closedByName: string;
  printedAtText: string;
  footer: string;
  labels: ZReportLabels;
}

/** `+1.000 đ` / `-1.000 đ`: a drawer line has to say which way the money went. */
function signed(amount: number): string {
  if (amount === 0) return formatVND(0);
  return amount > 0 ? `+${formatVND(amount)}` : `-${formatVND(Math.abs(amount))}`;
}

/**
 * The Z report as monospaced text: the share payload on native and, through the same 32
 * column block the receipt prints, what a thermal printer puts on the roll.
 */
export function formatZReportText(input: ZReportTextInput): string {
  const rule = '-'.repeat(RECEIPT_WIDTH);
  const { totals, labels } = input;
  const rows: string[] = [centre(input.orgName), centre(input.storeName)];
  if (input.storeAddress) rows.push(...wrap(input.storeAddress).map(centre));

  rows.push(
    rule,
    centre(labels.title),
    centre(`${input.dateText} · ${input.registerName}`),
    centre(input.shiftWindowText),
  );
  if (input.cashierNames.length > 0) rows.push(...wrap(input.cashierNames.join(', ')).map(centre));

  rows.push(
    rule,
    labels.revenueSection,
    pair(labels.orderCount, String(totals.orderCount)),
    pair(labels.revenue, formatVND(totals.grossRevenue)),
    pair(labels.discount, signed(-totals.discountTotal)),
    pair(`${labels.refunds} (${totals.refundCount})`, signed(-totals.refundTotal)),
    pair(labels.netRevenue, formatVND(totals.netRevenue)),
    rule,
    labels.methodSection,
    ...totals.payments.map((payment) => pair(labels.methods[payment.method], formatVND(payment.amount))),
    rule,
    labels.drawerSection,
    pair(labels.openingCash, formatVND(totals.openingCash)),
    pair(labels.cashSales, signed(totals.cashRevenue)),
    pair(`${labels.cashIn} (${totals.cashInCount})`, signed(totals.cashIn)),
    pair(`${labels.cashOut} (${totals.cashOutCount})`, signed(-totals.cashOut)),
    pair(labels.expected, formatVND(totals.expectedCash)),
    pair(labels.counted, totals.countedCash != null ? formatVND(totals.countedCash) : labels.notCounted),
    pair(labels.variance, totals.variance != null ? signed(totals.variance) : labels.notCounted),
    rule,
    labels.movementSection,
  );

  if (input.movements.length === 0) {
    rows.push(labels.noMovements);
  } else {
    for (const movement of input.movements) {
      rows.push(
        pair(
          `${movement.timeText} ${movement.reason}`.slice(0, RECEIPT_WIDTH - 12),
          signed(movement.type === 'in' ? movement.amount : -movement.amount),
        ),
      );
    }
  }

  rows.push(
    rule,
    centre(`${labels.closedBy}: ${input.closedByName}`),
    centre(`${labels.printedAt} ${input.printedAtText}`),
    centre(input.footer),
  );
  return rows.join('\n');
}
