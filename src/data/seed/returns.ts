/**
 * Customer returns and the write-offs the damaged ones produce.
 *
 * Three records covering the three shapes: a plain restock, a mixed one where half the goods
 * are damaged, and an exchange. Every one is priced through `returnPlan`, the same function
 * the POS return dialog will call, so the seeded amounts cannot drift from the live ones.
 */

import type { ReturnRecord, WriteOff } from '../../domain/types';
import { returnPlan, writeOffsForReturn, type ReturnRequestLine } from '../../domain/returns';
import { orders } from './orders';
import { DEMO_ORG_ID } from './org';
import { daysAgo } from './clock';

/** Paid retail orders with at least two lines, so a partial return has something to leave behind. */
function candidateOrders() {
  return orders
    .filter((order) => order.channel === 'retail' && order.status === 'paid' && order.lines.length >= 2)
    .slice(0, 3);
}

const PLANS: {
  /** How many units of each of the order's first two lines come back. */
  quantities: [number, number];
  dispositions: ['restock' | 'damaged', 'restock' | 'damaged'];
  reasons: [string, string];
  staffId: string;
  daysAgo: number;
  exchange: boolean;
}[] = [
  {
    quantities: [1, 0],
    dispositions: ['restock', 'restock'],
    reasons: ['Khách đổi ý', 'Khách đổi ý'],
    staffId: 'staff-6',
    daysAgo: 3,
    exchange: false,
  },
  {
    quantities: [1, 1],
    dispositions: ['restock', 'damaged'],
    reasons: ['Không đúng loại khách cần', 'Bao bì rách, không bán lại được'],
    staffId: 'staff-8',
    daysAgo: 6,
    exchange: false,
  },
  {
    quantities: [2, 0],
    dispositions: ['damaged', 'restock'],
    reasons: ['Hàng lỗi từ nhà sản xuất', 'Hàng lỗi từ nhà sản xuất'],
    staffId: 'staff-2',
    daysAgo: 9,
    exchange: true,
  },
];

interface BuiltReturns {
  returns: ReturnRecord[];
  writeOffs: WriteOff[];
}

function buildReturns(): BuiltReturns {
  const sourceOrders = candidateOrders();
  const returns: ReturnRecord[] = [];
  const writeOffs: WriteOff[] = [];

  sourceOrders.forEach((order, index) => {
    const plan = PLANS[index];
    if (!plan) return;

    const requestLines: ReturnRequestLine[] = order.lines
      .slice(0, 2)
      .map((line, lineIndex) => ({
        productId: line.productId,
        qty: Math.min(plan.quantities[lineIndex], line.qty),
        reason: plan.reasons[lineIndex],
        disposition: plan.dispositions[lineIndex],
      }))
      .filter((line) => line.qty > 0);

    const result = returnPlan({ order, requestLines });
    if (!result.valid) return;

    const id = `return-${index + 1}`;
    const createdAt = daysAgo(plan.daysAgo);

    returns.push({
      id,
      orgId: DEMO_ORG_ID,
      storeId: order.storeId,
      orderId: order.id,
      lines: result.lines,
      // An exchange settles against the replacement lines, so no cash goes back.
      refundAmount: plan.exchange ? 0 : result.refundAmount,
      ...(plan.exchange ? { exchangeOrderId: order.id } : {}),
      staffId: plan.staffId,
      createdAt,
    });

    writeOffs.push(
      ...writeOffsForReturn(result.lines, {
        orgId: DEMO_ORG_ID,
        storeId: order.storeId,
        staffId: plan.staffId,
        returnId: id,
        createdAt,
      }),
    );
  });

  return { returns, writeOffs };
}

const built = buildReturns();

export const returnRecords: ReturnRecord[] = built.returns;

/**
 * Damaged goods leave stock through the write-off log, never through the return: that is what
 * keeps "returned" and "back on the shelf" two different numbers.
 */
export const writeOffs: WriteOff[] = built.writeOffs;
