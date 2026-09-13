import type { CartLine, Order, OrderStatus, Payment, Shift } from '../../domain/types';
import { roundVND } from '../../domain/money';
import { createRng, pick, pickMany, randInt } from './prng';
import { customers } from './customers';
import { products } from './products';
import { staff } from './staff';
import { stores } from './stores';
import { DEMO_ORG_ID } from './org';

const SEED = 20260911;
const NOW = new Date('2026-09-11T09:00:00.000Z');
const ORDER_COUNT = 300;
const STATUS_POOL: OrderStatus[] = [
  'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid',
  'partial_refund', 'refunded', 'void',
];

function cashiersForStore(storeId: string): string[] {
  return staff.filter((member) => member.storeIds.includes(storeId)).map((member) => member.id);
}

function buildOrderLines(rng: ReturnType<typeof createRng>): CartLine[] {
  const lineCount = randInt(rng, 1, 6);
  const chosen = pickMany(rng, products, lineCount);
  return chosen.map((product) => {
    const qty = randInt(rng, 1, 5);
    const hasDiscount = rng() < 0.12;
    return {
      productId: product.id,
      qty,
      unitPrice: product.salePrice,
      ...(hasDiscount
        ? { lineDiscount: { type: 'percent' as const, value: randInt(rng, 5, 15) } }
        : {}),
    };
  });
}

function lineTotal(line: CartLine): number {
  const gross = line.qty * line.unitPrice;
  if (!line.lineDiscount) return gross;
  return line.lineDiscount.type === 'percent'
    ? gross * (1 - line.lineDiscount.value / 100)
    : Math.max(0, gross - line.lineDiscount.value);
}

function buildPayments(rng: ReturnType<typeof createRng>, total: number): Payment[] {
  const method = pick(rng, ['cash', 'cash', 'transfer', 'transfer', 'card', 'points'] as const);
  if (rng() < 0.1 && total > 50_000) {
    const cashPart = roundVND(total * 0.5);
    return [
      { method: 'cash', amount: cashPart },
      { method: 'transfer', amount: roundVND(total - cashPart) },
    ];
  }
  return [{ method, amount: total }];
}

function buildOrders(): Order[] {
  const rng = createRng(SEED + 6);
  const orders: Order[] = [];

  for (let i = 1; i <= ORDER_COUNT; i += 1) {
    const store = pick(rng, stores);
    const cashierPool = cashiersForStore(store.id);
    const cashierId = cashierPool.length > 0 ? pick(rng, cashierPool) : staff[0].id;
    const daysAgo = randInt(rng, 0, 29);
    const drawnSeconds = randInt(rng, 8 * 3600, 21 * 3600);
    // Local calendar day so the receipt date matches what the cashier sees, and never in
    // the future: today's seed orders are capped a few minutes before NOW so an order
    // created during a session is always the newest one.
    const dayStart = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo).getTime();
    const latestAllowed = daysAgo === 0 ? Math.max(0, Math.floor((NOW.getTime() - dayStart) / 1000) - 300) : Infinity;
    const secondsIntoDay = Math.min(drawnSeconds, latestAllowed);
    const createdAt = new Date(dayStart + secondsIntoDay * 1000).toISOString();

    const lines = buildOrderLines(rng);
    const subtotal = roundVND(lines.reduce((total, line) => total + line.qty * line.unitPrice, 0));
    const afterLineDiscount = roundVND(lines.reduce((total, line) => total + lineTotal(line), 0));
    const lineDiscountTotal = subtotal - afterLineDiscount;
    const hasOrderDiscount = rng() < 0.08;
    const orderDiscountValue = hasOrderDiscount ? randInt(rng, 3, 10) : 0;
    const orderDiscountAmount = hasOrderDiscount
      ? roundVND(afterLineDiscount * (orderDiscountValue / 100))
      : 0;
    const discountTotal = lineDiscountTotal + orderDiscountAmount;
    const taxableAmount = afterLineDiscount - orderDiscountAmount;
    const avgTaxRate =
      lines.reduce((total, line) => {
        const product = products.find((item) => item.id === line.productId);
        return total + (product?.taxRate ?? 0);
      }, 0) / lines.length;
    const taxTotal = roundVND(taxableAmount * avgTaxRate);
    const total = roundVND(taxableAmount + taxTotal);
    const status = pick(rng, STATUS_POOL);
    const attachCustomer = rng() < 0.55;

    orders.push({
      id: `order-${i}`,
      orgId: DEMO_ORG_ID,
      code: `HD${createdAt.slice(0, 10).replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
      storeId: store.id,
      cashierId,
      customerId: attachCustomer ? pick(rng, customers).id : undefined,
      lines,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      payments: buildPayments(rng, total),
      status,
      createdAt,
    });
  }

  return orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const orders: Order[] = buildOrders();

function buildShifts(): Shift[] {
  const rng = createRng(SEED + 7);
  const shifts: Shift[] = [];
  const combos = stores.slice(0, 4).flatMap((store) => {
    const cashierPool = cashiersForStore(store.id);
    return cashierPool.length > 0 ? [{ store, cashierId: pick(rng, cashierPool) }] : [];
  });
  const picked = pickMany(rng, [...combos, ...combos], 6);

  picked.forEach((combo, index) => {
    const dayOffset = index + 1;
    const openedAt = new Date(NOW.getTime() - dayOffset * 86_400_000);
    openedAt.setUTCHours(8, 0, 0, 0);
    const closedAt = new Date(openedAt.getTime());
    closedAt.setUTCHours(20, 0, 0, 0);
    const isOpen = index === 0;

    const storeOrders = orders.filter(
      (order) =>
        order.storeId === combo.store.id &&
        order.cashierId === combo.cashierId &&
        order.createdAt >= openedAt.toISOString() &&
        (isOpen || order.createdAt <= closedAt.toISOString()),
    );
    const revenue = roundVND(
      storeOrders
        .filter((order) => order.status === 'paid' || order.status === 'partial_refund')
        .reduce((total, order) => total + order.total, 0),
    );
    const openingCash = 500_000;

    shifts.push({
      id: `shift-${index + 1}`,
      orgId: DEMO_ORG_ID,
      storeId: combo.store.id,
      // Alternating tills, so the register picker has both states to show: one station with a
      // shift open on it and one free.
      registerId: `${combo.store.id}-reg-${(index % 2) + 1}`,
      cashierId: combo.cashierId,
      openedAt: openedAt.toISOString(),
      closedAt: isOpen ? undefined : closedAt.toISOString(),
      openingCash,
      closingCash: isOpen ? undefined : openingCash + revenue,
      expectedCash: openingCash + revenue,
      orderCount: storeOrders.length,
      revenue,
    });
  });

  return shifts;
}

export const shifts: Shift[] = buildShifts();
