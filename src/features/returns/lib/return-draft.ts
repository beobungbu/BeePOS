/**
 * The state a return and exchange screen keeps, and the arithmetic it shows.
 *
 * `src/domain/returns.ts` owns validation and pricing; this module owns the draft the cashier
 * is building on top of it: one row per line of the original order, quantity zero until they
 * pick it, plus whatever they are swapping it for. Pure, so the net figure on the screen and
 * the record that gets written are computed once.
 */

import { effectivePrice } from '../../../domain/catalog';
import { sum } from '../../../domain/money';
import { netExchangeAmount, remainingReturnableQty, returnPlan } from '../../../domain/returns';
import type {
  ExchangeResult,
  ReturnPlanResult,
  ReturnRequestLine,
} from '../../../domain/returns';
import type { Customer, Order, Product, ReturnDisposition, ReturnRecord } from '../../../domain/types';

/**
 * The fixed reason set of the spec, stored as codes rather than sentences: a record written in
 * Vietnamese and read back in English would otherwise stay Vietnamese for good.
 */
export const RETURN_REASONS = [
  'nearExpiry',
  'damagedPack',
  'wrongItem',
  'changedMind',
  'manufacturing',
  'other',
] as const;
export type ReturnReason = (typeof RETURN_REASONS)[number];

export const DEFAULT_RETURN_REASON: ReturnReason = 'changedMind';

export interface ReturnDraftLine {
  productId: string;
  /** Units on the original order. */
  purchasedQty: number;
  /** Units still returnable after any earlier return against this order. */
  remainingQty: number;
  /** Units the cashier is taking back now; 0 leaves the row visible but unselected. */
  qty: number;
  reason: ReturnReason;
  disposition: ReturnDisposition;
  /** Price the line was sold at, after its own line discount. */
  unitPrice: number;
}

export interface ExchangeDraftLine {
  productId: string;
  qty: number;
  unitPrice: number;
}

/**
 * One row per product on the order, unselected. Rows with nothing left to return are kept:
 * hiding them would leave the cashier unable to see the order they are looking at.
 */
export function draftLinesFor(order: Order, priorReturns: readonly ReturnRecord[]): ReturnDraftLine[] {
  const byProduct = new Map<string, ReturnDraftLine>();
  for (const line of order.lines) {
    const current = byProduct.get(line.productId);
    if (current) {
      current.purchasedQty += line.qty;
      continue;
    }
    byProduct.set(line.productId, {
      productId: line.productId,
      purchasedQty: line.qty,
      remainingQty: remainingReturnableQty(order, priorReturns, line.productId),
      qty: 0,
      reason: DEFAULT_RETURN_REASON,
      disposition: 'restock',
      unitPrice: netUnitPrice(line),
    });
  }
  return [...byProduct.values()];
}

/** Unit price after the line's own discount, the figure a return is priced at. */
function netUnitPrice(line: Order['lines'][number]): number {
  if (!line.lineDiscount || line.qty <= 0) return line.unitPrice;
  if (line.lineDiscount.type === 'percent') return line.unitPrice * (1 - line.lineDiscount.value / 100);
  return Math.max(0, line.unitPrice - line.lineDiscount.value / line.qty);
}

/** The rows the cashier actually picked, in the shape `returnPlan` takes. */
export function requestLinesOf(draft: readonly ReturnDraftLine[]): ReturnRequestLine[] {
  return draft
    .filter((line) => line.qty > 0)
    .map((line) => ({
      productId: line.productId,
      qty: line.qty,
      reason: line.reason,
      disposition: line.disposition,
    }));
}

/** Quantity clamped to what is still returnable, so the stepper cannot walk past the cap. */
export function clampQty(line: ReturnDraftLine, qty: number): number {
  if (!Number.isFinite(qty)) return 0;
  return Math.min(line.remainingQty, Math.max(0, Math.floor(qty)));
}

export function exchangeValue(lines: readonly ExchangeDraftLine[]): number {
  return sum(lines.map((line) => line.qty * line.unitPrice));
}

export interface ReturnSummary {
  plan: ReturnPlanResult;
  exchange: ExchangeResult;
  /** True once at least one line is picked and the plan validates. */
  ready: boolean;
}

/**
 * Prices the whole transaction: goods coming back, goods going out, one net number.
 *
 * An empty draft is not an error the cashier needs to see, so it comes back `ready: false`
 * with a zeroed plan rather than as a validation failure.
 */
export function summarize(
  order: Order,
  priorReturns: readonly ReturnRecord[],
  draft: readonly ReturnDraftLine[],
  exchangeLines: readonly ExchangeDraftLine[],
): ReturnSummary {
  const requestLines = requestLinesOf(draft);
  const plan = requestLines.length === 0
    ? { valid: false, error: 'no lines selected', lines: [], refundAmount: 0, restockLines: [], damagedLines: [] }
    : returnPlan({ order, requestLines, priorReturns });
  const exchange = netExchangeAmount(plan.refundAmount, exchangeValue(exchangeLines));
  return { plan, exchange, ready: plan.valid };
}

/**
 * The order a cashier means by what they typed: an exact code first, then a code that starts
 * with it, so `0007` finds `HD20260913-0007` and a full code never matches a longer one.
 */
export function findOrderByCode(orders: readonly Order[], query: string): Order | undefined {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return undefined;
  return (
    orders.find((order) => order.code.toLowerCase() === needle) ??
    orders.find((order) => order.code.toLowerCase().includes(needle))
  );
}

/** Price an exchange line takes: the branch's own price when it has one, the chain's otherwise. */
export function exchangePriceFor(
  product: Product,
  storeId: string | undefined,
  overrides: ReadonlyMap<string, number>,
): number {
  return effectivePrice(product, storeId, overrides);
}

/**
 * Whether the money owed back should become a credit note instead of cash: a company customer
 * who bought on account is owed a reduction of their balance, not the contents of the drawer.
 */
export function settlesOnAccount(order: Order, customer: Customer | undefined): boolean {
  if (!customer || customer.type !== 'company') return false;
  return order.payments.length === 0 || order.payments.every((payment) => payment.amount <= 0);
}
