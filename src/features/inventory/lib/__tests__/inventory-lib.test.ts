import type { Lot, PurchaseOrder } from '../../../../domain/types';
import {
  daysUntil,
  expiredOnHand,
  expiringLotsIn,
  formatExpiryInput,
  gradeLot,
  lotOnHand,
  lotsIn,
  parseExpiryInput,
} from '../lots';
import {
  canReceive,
  defaultReceiveQuantities,
  isEditable,
  lineState,
  nextPurchaseOrderCode,
  outstandingOf,
  purchaseOrderTotals,
} from '../purchase-orders';

const NOW = new Date('2026-09-13T09:00:00');

function lot(id: string, expiresAt: Date | undefined, onHand: number, storeId = 'store-1'): Lot {
  return { id, orgId: 'org-1', storeId, productId: 'product-21', lotCode: id, expiresAt, onHand };
}

const expired = lot('lot-a', new Date('2026-09-10T00:00:00'), 12);
const soon = lot('lot-b', new Date('2026-09-20T00:00:00'), 48);
const ahead = lot('lot-c', new Date('2026-10-30T00:00:00'), 96);
const undated = lot('lot-d', undefined, 5);
const otherStore = lot('lot-e', new Date('2026-09-14T00:00:00'), 7, 'store-2');
const LOTS = [ahead, expired, soon, undated, otherStore];

describe('lot grading', () => {
  it('counts whole days and goes negative once the date has passed', () => {
    expect(daysUntil(new Date('2026-09-20T09:00:00'), NOW)).toBe(7);
    expect(daysUntil(new Date('2026-09-10T09:00:00'), NOW)).toBe(-3);
  });

  it('grades expired, under 15 days and ahead, and never warns about an undated batch', () => {
    expect(gradeLot(expired, NOW)).toBe('expired');
    expect(gradeLot(soon, NOW)).toBe('soon');
    expect(gradeLot(ahead, NOW)).toBe('ahead');
    expect(gradeLot(undated, NOW)).toBe('ahead');
  });

  it('sorts a product branch soonest expiry first, undated last', () => {
    expect(lotsIn(LOTS, 'product-21', 'store-1').map((entry) => entry.id)).toEqual([
      'lot-a',
      'lot-b',
      'lot-c',
      'lot-d',
    ]);
  });

  it('returns only the batches inside the window, and only at the branch asked for', () => {
    expect(expiringLotsIn(LOTS, 'product-21', 'store-1', NOW).map((entry) => entry.id)).toEqual([
      'lot-a',
      'lot-b',
    ]);
    expect(expiringLotsIn(LOTS, 'product-21', 'store-2', NOW).map((entry) => entry.id)).toEqual(['lot-e']);
  });

  it('sums on hand per branch and counts what is already past its date', () => {
    expect(lotOnHand(LOTS, 'product-21', 'store-1')).toBe(161);
    expect(expiredOnHand(LOTS, NOW)).toBe(12);
  });
});

describe('typed expiry dates', () => {
  it('round-trips a day-first date', () => {
    const parsed = parseExpiryInput('12/10/2026');
    expect(parsed && formatExpiryInput(parsed)).toBe('12/10/2026');
  });

  it('refuses a day that does not exist rather than rolling it over', () => {
    expect(parseExpiryInput('31/02/2026')).toBeUndefined();
    expect(parseExpiryInput('2026-10-12')).toBeUndefined();
    expect(parseExpiryInput('')).toBeUndefined();
  });
});

const order: PurchaseOrder = {
  id: 'po-x',
  orgId: 'org-1',
  storeId: 'store-1',
  supplierId: 'supplier-1',
  code: 'PO-HN01-20260913-001',
  status: 'partial',
  createdAt: NOW,
  lines: [
    { productId: 'product-1', qty: 480, receivedQty: 240, unitCost: 6500 },
    { productId: 'product-81', qty: 600, receivedQty: 600, unitCost: 3200 },
    { productId: 'product-21', qty: 240, receivedQty: 0, unitCost: 5400 },
  ],
};

describe('purchase order arithmetic', () => {
  it('splits ordered, received and outstanding by value and by unit', () => {
    expect(purchaseOrderTotals(order)).toEqual({
      orderedQty: 1320,
      receivedQty: 840,
      outstandingQty: 480,
      orderedValue: 6_336_000,
      receivedValue: 3_480_000,
      outstandingValue: 2_856_000,
    });
  });

  it('grades each line and never reports a negative outstanding', () => {
    expect(order.lines.map(lineState)).toEqual(['partial', 'full', 'none']);
    expect(outstandingOf({ productId: 'p', qty: 10, receivedQty: 12, unitCost: 1 })).toBe(0);
  });

  it('allows editing a draft only and receiving a sent or partial order only', () => {
    expect(isEditable({ ...order, status: 'draft' })).toBe(true);
    expect(isEditable(order)).toBe(false);
    expect(canReceive(order)).toBe(true);
    expect(canReceive({ ...order, status: 'received' })).toBe(false);
    expect(canReceive({ ...order, status: 'draft' })).toBe(false);
  });

  it('starts a receive form on everything still outstanding', () => {
    expect(defaultReceiveQuantities(order)).toEqual({ 'product-1': 240, 'product-81': 0, 'product-21': 240 });
  });

  it('numbers a new code after the highest one already used that day at that branch', () => {
    expect(nextPurchaseOrderCode([order], 'HN01', NOW)).toBe('PO-HN01-20260913-002');
    expect(nextPurchaseOrderCode([], 'HN01', NOW)).toBe('PO-HN01-20260913-001');
    // Another branch keeps its own sequence: the code says where the goods are going.
    expect(nextPurchaseOrderCode([order], 'HN02', NOW)).toBe('PO-HN02-20260913-001');
  });
});
