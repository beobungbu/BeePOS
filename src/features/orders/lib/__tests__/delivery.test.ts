import type { DeliveryNote, Order, OrderLine } from '../../../../domain/types';
import { defaultNoteLines, deliveredQtyFor, deliveryProgress, nextDeliveryNoteCode } from '../delivery';

function line(productId: string, qty: number, unitPrice: number, unitFactor?: number): OrderLine {
  return { productId, qty, unitPrice, unitCostSnapshot: 0, priceSource: 'group', unitFactor };
}

const order: Order = {
  id: 'order-w1',
  orgId: 'org',
  code: 'DH-1',
  storeId: 'store-1',
  cashierId: 'staff-1',
  // 10 cases of 24 at 180.000 a case, and 3 bags at 168.000.
  lines: [line('product-1', 10, 180_000, 24), line('product-2', 3, 168_000)],
  subtotal: 2_304_000,
  discountTotal: 0,
  taxTotal: 0,
  total: 2_304_000,
  payments: [],
  status: 'delivering',
  createdAt: '2026-09-13T00:00:00.000Z',
  channel: 'wholesale',
};

const deliveredNote: DeliveryNote = {
  id: 'delivery-1',
  orgId: 'org',
  orderId: 'order-w1',
  lines: [{ productId: 'product-1', qty: 240 }],
  status: 'delivered',
};

const pendingNote: DeliveryNote = {
  id: 'delivery-2',
  orgId: 'org',
  orderId: 'order-w1',
  lines: [{ productId: 'product-2', qty: 3 }],
  status: 'pending',
};

describe('deliveredQtyFor', () => {
  it('counts delivered notes only', () => {
    expect(deliveredQtyFor([deliveredNote, pendingNote], 'order-w1')).toEqual({ 'product-1': 240 });
  });

  it('ignores notes of another order', () => {
    const other = { ...deliveredNote, id: 'delivery-3', orderId: 'order-w2' };
    expect(deliveredQtyFor([other], 'order-w1')).toEqual({});
  });
});

describe('deliveryProgress', () => {
  it('counts ordered quantity in base units, not in cases', () => {
    const progress = deliveryProgress(order, []);
    expect(progress.lines[0].orderedQty).toBe(240);
    expect(progress.lines[1].orderedQty).toBe(3);
  });

  it('splits the order value by the share delivered', () => {
    const progress = deliveryProgress(order, [deliveredNote, pendingNote]);
    expect(progress.deliveredValue).toBe(1_800_000);
    expect(progress.pendingValue).toBe(504_000);
    expect(progress.complete).toBe(false);
  });

  it('is complete once every line has arrived', () => {
    const rest: DeliveryNote = { ...pendingNote, status: 'delivered' };
    expect(deliveryProgress(order, [deliveredNote, rest]).complete).toBe(true);
  });

  it('never reports a negative remainder when a note over-delivers', () => {
    const tooMuch: DeliveryNote = {
      ...deliveredNote,
      lines: [{ productId: 'product-1', qty: 300 }],
    };
    expect(deliveryProgress(order, [tooMuch]).lines[0].remainingQty).toBe(0);
  });
});

describe('defaultNoteLines', () => {
  it('offers everything still owed', () => {
    const progress = deliveryProgress(order, [deliveredNote]);
    expect(defaultNoteLines(progress)).toEqual([{ productId: 'product-2', qty: 3 }]);
  });
});

describe('nextDeliveryNoteCode', () => {
  it('numbers notes per order and dates them', () => {
    const at = new Date('2026-09-13T08:00:00.000Z');
    expect(nextDeliveryNoteCode([], 'order-w1', at)).toBe('PGH20260913-0001');
    expect(nextDeliveryNoteCode([deliveredNote], 'order-w1', at)).toBe('PGH20260913-0002');
  });
});
