/**
 * Purchase orders and supplier returns.
 *
 * Five orders, one in each status the state machine has, so "sent but nothing arrived",
 * "half arrived" and "closed" are all on the list before any screen is written. The partial
 * one has one line short and one line complete, which is the case a receive form gets wrong
 * if it assumes a receipt closes an order.
 */

import type { PurchaseOrder, PurchaseOrderStatus, SupplierReturn } from '../../domain/types';
import { createRng, pickMany, randInt } from './prng';
import { products } from './products';
import { goodsReceipts } from './operations';
import { DEMO_ORG_ID } from './org';
import { stores } from './stores';
import { daysAgo, daysAhead } from './clock';

const SEED = 20260911;

const PO_PLAN: { status: PurchaseOrderStatus; storeId: string; supplierId: string }[] = [
  { status: 'draft', storeId: 'store-1', supplierId: 'supplier-1' },
  { status: 'sent', storeId: 'store-1', supplierId: 'supplier-2' },
  { status: 'partial', storeId: 'store-2', supplierId: 'supplier-3' },
  { status: 'received', storeId: 'store-2', supplierId: 'supplier-1' },
  { status: 'cancelled', storeId: 'store-3', supplierId: 'supplier-4' },
];

/** How much of each line has arrived, by status. `partial` is resolved per line below. */
function receivedQtyFor(status: PurchaseOrderStatus, qty: number, lineIndex: number): number {
  if (status === 'received') return qty;
  if (status !== 'partial') return 0;
  // First line complete, the rest short: the shape a real part-delivery takes.
  return lineIndex === 0 ? qty : Math.floor(qty / 2);
}

/** A branch's short code, which is what a purchase order number carries. */
function storeCodeOf(storeId: string): string {
  return stores.find((store) => store.id === storeId)?.code ?? storeId;
}

function buildPurchaseOrders(): PurchaseOrder[] {
  const rng = createRng(SEED + 40);

  return PO_PLAN.map((plan, index) => {
    const lines = pickMany(rng, products, randInt(rng, 3, 6)).map((product, lineIndex) => {
      const qty = randInt(rng, 10, 120);
      return {
        productId: product.id,
        qty,
        receivedQty: receivedQtyFor(plan.status, qty, lineIndex),
        unitCost: product.costPrice,
      };
    });

    const createdAt = daysAgo(25 - index * 4);
    return {
      id: `po-${index + 1}`,
      orgId: DEMO_ORG_ID,
      storeId: plan.storeId,
      supplierId: plan.supplierId,
      // `PO-HN01-20260913-001`: the shape `nextPurchaseOrderCode` mints, so a hand-raised
      // order and a seeded one read as the same kind of document in the list.
      code: `PO-${storeCodeOf(plan.storeId)}-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`,
      lines,
      status: plan.status,
      // A draft has no promised date yet; everything else does.
      ...(plan.status === 'draft' ? {} : { expectedAt: daysAhead(index * 3 - 4) }),
      createdAt,
    };
  });
}

export const purchaseOrders: PurchaseOrder[] = buildPurchaseOrders();

/**
 * Two returns to suppliers: one still a draft the manager is assembling, one already sent.
 * Both point at a real receipt so the goods can be traced back to the delivery they came in on.
 */
function buildSupplierReturns(): SupplierReturn[] {
  const rng = createRng(SEED + 41);
  const receivedReceipts = goodsReceipts.filter((receipt) => receipt.status === 'received');
  const reasons = ['Hàng lỗi bao bì', 'Giao sai quy cách', 'Cận hạn sử dụng'];

  return receivedReceipts.slice(0, 2).map((receipt, index) => ({
    id: `supplier-return-${index + 1}`,
    orgId: DEMO_ORG_ID,
    storeId: receipt.storeId,
    supplierId: receipt.supplierId,
    receiptId: receipt.id,
    lines: receipt.lines.slice(0, 2).map((line, lineIndex) => ({
      productId: line.productId,
      qty: Math.max(1, Math.floor(line.qty / 10)),
      unitCost: line.unitCost,
      reason: reasons[(index + lineIndex) % reasons.length],
    })),
    status: index === 0 ? ('draft' as const) : ('sent' as const),
    createdAt: daysAgo(randInt(rng, 2, 12)),
  }));
}

export const supplierReturns: SupplierReturn[] = buildSupplierReturns();
