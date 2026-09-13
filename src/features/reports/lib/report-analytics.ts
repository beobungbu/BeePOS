/**
 * The report cuts phase 7 adds: by category, by hour, gross profit per product, sales per
 * rep, inventory valuation over time and the debt summary.
 *
 * They live in the feature rather than in `src/domain/reports.ts` because they compose the
 * domain readers (`revenueOrders` semantics, `costing.lineCogs`, `ledger.balances`) rather
 * than defining new rules. Everything here is pure so the arithmetic can be checked without
 * a renderer: every figure on these screens has to add up by hand.
 *
 * Revenue recognition follows `src/domain/reports.ts`: `paid` and `partial_refund` only.
 * Profit always reads `OrderLine.unitCostSnapshot`, the cost at the moment of sale, never the
 * catalogue's current cost. A later delivery must not be able to rewrite an old margin.
 */

import { lineCogs } from '../../../domain/costing';
// Gross profit per product and the margin helper live in the money feature (W-M): one
// definition of "what this line earned", used by the money screens and by this report.
import { marginPercentOf } from '../../money/lib/gross-profit';
import { agingTotals, balances, entriesForStore } from '../../../domain/ledger';
import { roundVND, sum } from '../../../domain/money';
import { REVENUE_STATUSES } from '../../../domain/reports';
import type {
  Category,
  CostHistory,
  LedgerEntry,
  Order,
  OrderLine,
  Product,
  Staff,
  StockLevel,
  Store,
} from '../../../domain/types';

/**
 * Orders whose money counts as revenue, the same rule the dashboard uses. Exported because
 * the product profit screen passes the same set to the money feature's profit rows, and two
 * definitions of "sold" is how two screens end up disagreeing.
 */
export function revenueOrders(orders: readonly Order[]): Order[] {
  return orders.filter((order) => REVENUE_STATUSES.includes(order.status));
}

/** Net amount of one line after its own discount, before any order-level discount. */
function lineNetAmount(line: OrderLine): number {
  const gross = line.qty * line.unitPrice;
  if (!line.lineDiscount) return gross;
  return line.lineDiscount.type === 'percent'
    ? gross * (1 - line.lineDiscount.value / 100)
    : Math.max(0, gross - line.lineDiscount.value);
}

function sharePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export interface CategoryRevenue {
  categoryId: string;
  name: string;
  revenue: number;
  qty: number;
  sharePercent: number;
}

/**
 * Revenue split by the category each sold product belongs to, biggest first. A line whose
 * product left the catalogue lands in the `other` bucket rather than being dropped, so the
 * rows still add up to the revenue figure on the stat strip.
 */
export function revenueByCategory(
  orders: readonly Order[],
  products: readonly Product[],
  categories: readonly Category[],
  /** What an uncatalogued line is filed under; the screen passes the dictionary's word. */
  otherLabel = 'Other',
): CategoryRevenue[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<string, { revenue: number; qty: number }>();

  for (const order of revenueOrders(orders)) {
    for (const line of order.lines) {
      const categoryId = productById.get(line.productId)?.categoryId ?? 'other';
      const entry = totals.get(categoryId) ?? { revenue: 0, qty: 0 };
      entry.revenue += lineNetAmount(line);
      entry.qty += line.qty;
      totals.set(categoryId, entry);
    }
  }

  const total = sum([...totals.values()].map((entry) => entry.revenue));
  return [...totals.entries()]
    .map(([categoryId, entry]) => ({
      categoryId,
      name: categoryNames.get(categoryId) ?? otherLabel,
      revenue: roundVND(entry.revenue),
      qty: entry.qty,
      sharePercent: sharePercent(entry.revenue, total),
    }))
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
}

export interface HourRevenue {
  /**
   * Hour of the day, 0 to 23, on the device's clock rather than in UTC.
   *
   * Every other date in the reports is UTC because a day boundary has to be stable, but "when
   * is the shop busy" is a wall-clock question: a grocer opening at 06:30 reads a peak at
   * 18:00, not at 11:00.
   */
  hour: number;
  revenue: number;
  orders: number;
  /** The busiest hour of the set, drawn in `primary` while the rest take `series-1`. */
  isPeak: boolean;
}

/**
 * Revenue per hour of the day across the period, from the first hour that sold anything to
 * the last. Empty hours inside the trading day are kept, because a gap at 14:00 is a fact
 * about the shop; hours outside it are dropped so a grocer's chart is not two thirds empty.
 */
export function revenueByHour(orders: readonly Order[]): HourRevenue[] {
  const totals = new Map<number, { revenue: number; orders: number }>();

  for (const order of revenueOrders(orders)) {
    const hour = new Date(order.createdAt).getHours();
    const entry = totals.get(hour) ?? { revenue: 0, orders: 0 };
    entry.revenue += order.total;
    entry.orders += 1;
    totals.set(hour, entry);
  }

  const hours = [...totals.keys()];
  if (hours.length === 0) return [];

  const first = Math.min(...hours);
  const last = Math.max(...hours);
  const peak = Math.max(...[...totals.values()].map((entry) => entry.revenue));

  const rows: HourRevenue[] = [];
  for (let hour = first; hour <= last; hour += 1) {
    const entry = totals.get(hour) ?? { revenue: 0, orders: 0 };
    rows.push({
      hour,
      revenue: roundVND(entry.revenue),
      orders: entry.orders,
      isPeak: entry.revenue > 0 && entry.revenue === peak,
    });
  }
  return rows;
}

export interface RepPerformance {
  staffId: string;
  name: string;
  orders: number;
  /** Of those orders, how many were rung up as wholesale. */
  wholesaleOrders: number;
  revenue: number;
  profit: number;
  marginPercent: number;
}

/**
 * Sales per person, crediting the sales rep named on the order and falling back to whoever
 * rang it up. A wholesale order belongs to the rep who won it even though a cashier keyed it,
 * and a counter sale has no rep at all.
 */
export function salesByRep(orders: readonly Order[], staff: readonly Staff[]): RepPerformance[] {
  const names = new Map(staff.map((member) => [member.id, member.name]));
  const totals = new Map<
    string,
    { orders: number; wholesale: number; revenue: number; cogs: number }
  >();

  for (const order of revenueOrders(orders)) {
    const repId = order.salesRepId ?? order.cashierId;
    const entry = totals.get(repId) ?? { orders: 0, wholesale: 0, revenue: 0, cogs: 0 };
    entry.orders += 1;
    if (order.channel === 'wholesale') entry.wholesale += 1;
    entry.revenue += order.total;
    entry.cogs += sum(order.lines.map(lineCogs));
    totals.set(repId, entry);
  }

  return [...totals.entries()]
    .map(([staffId, entry]) => {
      const revenue = roundVND(entry.revenue);
      const profit = roundVND(revenue - entry.cogs);
      return {
        staffId,
        name: names.get(staffId) ?? staffId,
        orders: entry.orders,
        wholesaleOrders: entry.wholesale,
        revenue,
        profit,
        marginPercent: marginPercentOf(revenue, profit),
      };
    })
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
}

/** The average cost a product carried at `at`, branch row first, chain row second. */
export function costAsOf(
  history: readonly CostHistory[],
  productId: string,
  storeId: string | undefined,
  at: Date,
): number {
  const upTo = history.filter(
    (row) => row.productId === productId && row.createdAt.getTime() <= at.getTime(),
  );
  const scoped = storeId ? upTo.filter((row) => row.storeId === storeId) : [];
  const pool = scoped.length > 0 ? scoped : upTo.filter((row) => row.storeId === undefined);
  if (pool.length === 0) return 0;
  return pool.reduce((latest, row) =>
    row.createdAt.getTime() >= latest.createdAt.getTime() ? row : latest,
  ).unitCost;
}

/** Stock on hand valued at the average cost in force on `at`. */
export function valuationAt(
  levels: readonly StockLevel[],
  products: readonly Product[],
  history: readonly CostHistory[],
  at: Date,
  storeId?: string,
): number {
  const known = new Set(products.map((product) => product.id));
  return roundVND(
    sum(
      levels
        .filter((level) => known.has(level.productId) && (!storeId || level.storeId === storeId))
        .map((level) => level.onHand * costAsOf(history, level.productId, level.storeId, at)),
    ),
  );
}

export interface ValuationPoint {
  /** Calendar day in `YYYY-MM-DD` (UTC), the snapshot's date. */
  date: string;
  value: number;
  /** The last point, drawn in `primary`: it is where the chain stands now. */
  isCurrent: boolean;
}

/**
 * Weekly snapshots of what the stock is worth, oldest first, ending on `now`.
 *
 * The snapshot values **today's** quantities at the average cost each product carried on that
 * date: the app keeps a cost history but no stock history, so the series shows what cost did,
 * not what quantities did. The screen says so out loud rather than implying a measurement the
 * data cannot support.
 */
export function valuationSeries(
  levels: readonly StockLevel[],
  products: readonly Product[],
  history: readonly CostHistory[],
  now: Date,
  weeks = 5,
  storeId?: string,
): ValuationPoint[] {
  const points: ValuationPoint[] = [];
  for (let index = weeks; index >= 1; index -= 1) {
    const at = new Date(now.getTime() - index * 7 * 86_400_000);
    points.push({
      date: at.toISOString().slice(0, 10),
      value: valuationAt(levels, products, history, at, storeId),
      isCurrent: false,
    });
  }
  points.push({
    date: now.toISOString().slice(0, 10),
    value: valuationAt(levels, products, history, now, storeId),
    isCurrent: true,
  });
  return points;
}

export interface StoreValuation {
  storeId: string;
  storeCode: string;
  storeName: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

/** Current value against the value `daysAgo` days back, per branch, with a chain total row. */
export function valuationByStore(
  levels: readonly StockLevel[],
  products: readonly Product[],
  history: readonly CostHistory[],
  stores: readonly Store[],
  now: Date,
  daysAgo = 30,
): StoreValuation[] {
  const before = new Date(now.getTime() - daysAgo * 86_400_000);
  return stores.map((store) => {
    const current = valuationAt(levels, products, history, now, store.id);
    const previous = valuationAt(levels, products, history, before, store.id);
    const change = roundVND(current - previous);
    return {
      storeId: store.id,
      storeCode: store.code,
      storeName: store.name,
      current,
      previous,
      change,
      changePercent: previous === 0 ? 0 : Math.round((change / previous) * 1000) / 10,
    };
  });
}

/** Units on hand that have not sold inside `days`, valued at their current average cost. */
export function slowMovingValue(
  levels: readonly StockLevel[],
  products: readonly Product[],
  history: readonly CostHistory[],
  orders: readonly Order[],
  now: Date,
  days = 60,
  storeId?: string,
): number {
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const sold = new Set(
    revenueOrders(orders)
      .filter((order) => order.createdAt >= since && (!storeId || order.storeId === storeId))
      .flatMap((order) => order.lines.map((line) => line.productId)),
  );
  const stale = levels.filter((level) => !sold.has(level.productId));
  return valuationAt(stale, products, history, now, storeId);
}

/** How many distinct products carry stock, chain-wide or in one branch. */
export function skusInStock(levels: readonly StockLevel[], storeId?: string): number {
  return new Set(
    levels
      .filter((level) => level.onHand > 0 && (!storeId || level.storeId === storeId))
      .map((level) => level.productId),
  ).size;
}

export interface PartyDebt {
  partyId: string;
  name: string;
  balance: number;
  overdue: number;
  oldestDueDate?: Date;
}

export interface DebtSummary {
  receivable: number;
  receivableOverdue: number;
  payable: number;
  payableOverdue: number;
  customers: PartyDebt[];
  suppliers: PartyDebt[];
  receivableAging: ReturnType<typeof agingTotals>;
  payableAging: ReturnType<typeof agingTotals>;
}

/**
 * What the chain is owed and what it owes, optionally narrowed to one branch. Entries carry
 * the branch of the document they came from, so `entriesForStore` composes with every reader
 * rather than each of them growing a store argument.
 */
export function debtSummary(
  entries: readonly LedgerEntry[],
  customerNames: ReadonlyMap<string, string>,
  supplierNames: ReadonlyMap<string, string>,
  now: Date,
  storeId?: string,
): DebtSummary {
  const scoped = storeId ? entriesForStore([...entries], storeId) : [...entries];
  const named = (rows: ReturnType<typeof balances>, names: ReadonlyMap<string, string>) =>
    rows
      .filter((row) => row.balance !== 0 || row.overdue !== 0)
      .map((row) => ({
        partyId: row.partyId,
        name: names.get(row.partyId) ?? row.partyId,
        balance: row.balance,
        overdue: row.overdue,
        oldestDueDate: row.oldestDueDate,
      }))
      .sort((a, b) => b.overdue - a.overdue || b.balance - a.balance);

  const customers = named(balances(scoped, 'customer', now), customerNames);
  const suppliers = named(balances(scoped, 'supplier', now), supplierNames);

  return {
    receivable: roundVND(sum(customers.map((row) => row.balance))),
    receivableOverdue: roundVND(sum(customers.map((row) => row.overdue))),
    payable: roundVND(sum(suppliers.map((row) => row.balance))),
    payableOverdue: roundVND(sum(suppliers.map((row) => row.overdue))),
    customers,
    suppliers,
    receivableAging: agingTotals(scoped, 'customer', now),
    payableAging: agingTotals(scoped, 'supplier', now),
  };
}
