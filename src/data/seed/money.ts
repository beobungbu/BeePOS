/**
 * Bank accounts, the receivables and payables ledger, and the cash book.
 *
 * The ledger is seeded so that every state the collections screen has to render exists from
 * the first boot: six customers owing money, two of them past due and in different aging
 * buckets, and four suppliers we owe, two of those overdue. Wholesale orders that have been
 * delivered but not settled raise their own invoice, so the receivable and the order it came
 * from reconcile rather than being two unrelated numbers.
 *
 * The cash book is derived, not invented: every cash payment on a seeded order is a `sale`
 * row, every seeded refund is a `refund` row, and each closed shift banks its takings. That is
 * what lets a test assert the cash book against the orders it came from.
 */

import type { BankAccount, CashBookEntry, LedgerEntry } from '../../domain/types';
import { roundVND } from '../../domain/money';
import { DEMO_ORG_ID } from './org';
import { orders, shifts, wholesaleOrders } from './orders';
import { goodsReceipts } from './operations';
import { daysAgo } from './clock';

/**
 * Branch a hand-placed invoice or collection is booked to. There is no session while the seed
 * is built, so the head office branch stands in; entries derived from an order or a receipt use
 * that document's own branch instead, which is always the better answer.
 */
const DEFAULT_LEDGER_STORE_ID = 'store-1';

export const bankAccounts: BankAccount[] = [
  {
    id: 'bank-1',
    orgId: DEMO_ORG_ID,
    name: 'Tài khoản chính',
    number: '0021000123456',
    bank: 'Vietcombank',
  },
  {
    id: 'bank-2',
    orgId: DEMO_ORG_ID,
    name: 'Tài khoản chi nhánh miền Nam',
    number: '19034567890123',
    bank: 'Techcombank',
  },
];

/**
 * Hand-placed customer balances.
 *
 * `customer-41` (Minh Long) is the account every commerce mockup is drawn around, so its three
 * invoices are the exact ones in `docs/design/mockups/commerce-sales.html`: 18.600.000 not yet
 * due, 22.400.000 with 8.000.000 collected against it, and 19.400.000 outstanding since July.
 * They come to 52.400.000 đ owing of which 33.800.000 đ is past due, against an 80.000.000 đ
 * limit. The payment names its invoice through `refId`, so the aging table shows the money
 * where the mockup shows it rather than against the older bill FIFO would pick.
 *
 * The other three are shapes the collections screen still needs: one deep in the 61-90 bucket,
 * one not yet due, and one large invoice with an unallocated part payment.
 */
const CUSTOMER_LEDGER: {
  id: string;
  customerId: string;
  invoice: number;
  /** Days before the seed instant the invoice was raised. */
  issuedDaysAgo: number;
  /** Days before the seed instant the invoice fell due; negative means it is not due yet. */
  dueDaysAgo: number;
  payment?: number;
  /** True when the payment settles this invoice specifically rather than the oldest one. */
  paymentAllocated?: boolean;
  note: string;
}[] = [
  { id: 'ar-mlong-1', customerId: 'customer-41', invoice: 19_400_000, issuedDaysAgo: 85, dueDaysAgo: 55, note: 'Hoá đơn HD20260618-0009' },
  { id: 'ar-mlong-2', customerId: 'customer-41', invoice: 22_400_000, issuedDaysAgo: 51, dueDaysAgo: 21, payment: 8_000_000, paymentAllocated: true, note: 'Hoá đơn HD20260722-0018' },
  { id: 'ar-mlong-3', customerId: 'customer-41', invoice: 18_600_000, issuedDaysAgo: 27, dueDaysAgo: -3, note: 'Hoá đơn HD20260815-0032' },
  { id: 'ar-2', customerId: 'customer-42', invoice: 60_000_000, issuedDaysAgo: 95, dueDaysAgo: 65, note: 'Đơn hàng tháng 6' },
  { id: 'ar-3', customerId: 'customer-43', invoice: 12_000_000, issuedDaysAgo: 25, dueDaysAgo: -5, note: 'Đơn hàng tuần này' },
  { id: 'ar-4', customerId: 'customer-44', invoice: 80_000_000, issuedDaysAgo: 10, dueDaysAgo: -20, payment: 30_000_000, note: 'Hợp đồng suất ăn quý 3' },
];

/** The four partners the chain buys on credit from, and what is left on each account. */
const SUPPLIER_LEDGER: {
  supplierId: string;
  invoice: number;
  dueDaysAgo: number;
  payment?: number;
  note: string;
}[] = [
  { supplierId: 'supplier-1', invoice: 120_000_000, dueDaysAgo: 10, payment: 40_000_000, note: 'Công nợ đợt giao tháng 8' },
  { supplierId: 'supplier-2', invoice: 85_000_000, dueDaysAgo: -12, note: 'Công nợ 30 ngày' },
  { supplierId: 'supplier-3', invoice: 42_000_000, dueDaysAgo: 45, note: 'Hàng sữa tháng 7' },
  { supplierId: 'supplier-4', invoice: 60_000_000, dueDaysAgo: -25, note: 'Đợt giao miền Nam' },
];

function buildLedgerEntries(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  for (const row of CUSTOMER_LEDGER) {
    const invoiceId = `ledger-${row.id}`;
    entries.push({
      id: invoiceId,
      orgId: DEMO_ORG_ID,
      party: 'customer',
      partyId: row.customerId,
      storeId: DEFAULT_LEDGER_STORE_ID,
      kind: 'invoice',
      refType: 'manual',
      amount: row.invoice,
      dueDate: daysAgo(row.dueDaysAgo),
      createdAt: daysAgo(row.issuedDaysAgo),
      note: row.note,
    });
    if (row.payment) {
      entries.push({
        id: `${invoiceId}-pay`,
        orgId: DEMO_ORG_ID,
        party: 'customer',
        partyId: row.customerId,
        storeId: DEFAULT_LEDGER_STORE_ID,
        kind: 'payment',
        refType: 'manual',
        // Naming the invoice is what makes this a part payment of that bill rather than a
        // lump sum the aging table has to guess at.
        ...(row.paymentAllocated ? { refId: invoiceId } : {}),
        amount: row.payment,
        createdAt: daysAgo(Math.max(1, row.dueDaysAgo + 10)),
        note: 'Khách thanh toán một phần',
      });
    }
  }

  // Delivered-but-unsettled wholesale orders are receivables in their own right; a settled one
  // books both sides so its balance nets to zero and the screen has a closed account to show.
  for (const order of wholesaleOrders) {
    if (order.status !== 'completed' && order.status !== 'paid') continue;
    if (!order.customerId) continue;

    const createdAt = new Date(order.createdAt);
    entries.push({
      id: `ledger-order-${order.id}`,
      orgId: DEMO_ORG_ID,
      party: 'customer',
      partyId: order.customerId,
      storeId: order.storeId,
      kind: 'invoice',
      refType: 'order',
      refId: order.id,
      amount: order.total,
      dueDate: order.dueDate,
      createdAt,
      note: `Hoá đơn ${order.code}`,
    });
    if (order.status === 'paid') {
      entries.push({
        id: `ledger-order-${order.id}-pay`,
        orgId: DEMO_ORG_ID,
        party: 'customer',
        partyId: order.customerId,
        storeId: order.storeId,
        kind: 'payment',
        refType: 'order',
        refId: order.id,
        amount: order.total,
        createdAt: new Date(createdAt.getTime() + 3 * 86_400_000),
        note: `Thu tiền đơn ${order.code}`,
      });
    }
  }

  SUPPLIER_LEDGER.forEach((row, index) => {
    const receipt = goodsReceipts.find(
      (item) => item.supplierId === row.supplierId && item.status === 'received',
    );
    entries.push({
      id: `ledger-ap-${index + 1}`,
      orgId: DEMO_ORG_ID,
      party: 'supplier',
      partyId: row.supplierId,
      // A supplier bill belongs to the branch the goods were delivered to.
      storeId: receipt?.storeId ?? DEFAULT_LEDGER_STORE_ID,
      kind: 'invoice',
      refType: receipt ? 'receipt' : 'manual',
      refId: receipt?.id,
      amount: row.invoice,
      dueDate: daysAgo(row.dueDaysAgo),
      createdAt: daysAgo(row.dueDaysAgo + 30),
      note: row.note,
    });
    if (row.payment) {
      entries.push({
        id: `ledger-ap-${index + 1}-pay`,
        orgId: DEMO_ORG_ID,
        party: 'supplier',
        partyId: row.supplierId,
        storeId: receipt?.storeId ?? DEFAULT_LEDGER_STORE_ID,
        kind: 'payment',
        refType: 'manual',
        amount: row.payment,
        createdAt: daysAgo(Math.max(1, row.dueDaysAgo + 8)),
        note: 'Trả nhà cung cấp một phần',
      });
    }
  });

  return entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export const ledgerEntries: LedgerEntry[] = buildLedgerEntries();

/**
 * The cash book, derived from what already happened at the tills.
 *
 * Only cash moves the drawer, so a transfer or card payment produces no row. Each closed shift
 * banks its takings the next morning, and the two collections seeded above appear as money
 * arriving at the branch that raised the invoice.
 */
function buildCashBook(): CashBookEntry[] {
  const entries: CashBookEntry[] = [];

  for (const order of orders) {
    if (order.status === 'void') continue;
    const cash = order.payments
      .filter((payment) => payment.method === 'cash')
      .reduce((total, payment) => total + payment.amount, 0);
    if (cash <= 0) continue;

    entries.push({
      id: `cash-sale-${order.id}`,
      orgId: DEMO_ORG_ID,
      storeId: order.storeId,
      kind: 'sale',
      amount: roundVND(cash),
      refId: order.id,
      staffId: order.cashierId,
      createdAt: new Date(order.createdAt),
    });

    // A refunded order gives the cash back out of the same drawer.
    if (order.status === 'refunded') {
      entries.push({
        id: `cash-refund-${order.id}`,
        orgId: DEMO_ORG_ID,
        storeId: order.storeId,
        kind: 'refund',
        amount: roundVND(cash),
        refId: order.id,
        staffId: order.cashierId,
        createdAt: new Date(new Date(order.createdAt).getTime() + 3_600_000),
      });
    }
  }

  for (const shift of shifts) {
    if (!shift.closedAt || shift.revenue <= 0) continue;
    entries.push({
      id: `cash-deposit-${shift.id}`,
      orgId: DEMO_ORG_ID,
      storeId: shift.storeId,
      kind: 'deposit',
      // Banked to the nearest 100.000 đ; the float stays in the till.
      amount: Math.floor(shift.revenue / 100_000) * 100_000,
      refId: shift.id,
      bankAccountId: 'bank-1',
      staffId: shift.cashierId,
      createdAt: new Date(new Date(shift.closedAt).getTime() + 15 * 3_600_000),
    });
  }

  for (const entry of ledgerEntries) {
    if (entry.kind !== 'payment') continue;
    entries.push({
      id: `cash-${entry.id}`,
      orgId: DEMO_ORG_ID,
      storeId: entry.storeId ?? DEFAULT_LEDGER_STORE_ID,
      kind: entry.party === 'customer' ? 'collection' : 'supplier_payment',
      amount: entry.amount,
      refId: entry.id,
      bankAccountId: 'bank-1',
      staffId: 'staff-2',
      createdAt: entry.createdAt,
    });
  }

  return entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export const cashBook: CashBookEntry[] = buildCashBook();
