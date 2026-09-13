import type { Customer, Order, ReturnRecord } from '../../../../domain/types';
import {
  clampQty,
  draftLinesFor,
  exchangeValue,
  findOrderByCode,
  requestLinesOf,
  settlesOnAccount,
  summarize,
} from '../return-draft';

const order: Order = {
  id: 'order-1',
  orgId: 'org-1',
  code: 'HD20260913-0007',
  storeId: 'store-1',
  cashierId: 'staff-1',
  customerId: 'customer-1',
  lines: [
    { productId: 'product-21', qty: 24, unitPrice: 7000, unitCostSnapshot: 5400, priceSource: 'list' },
    { productId: 'product-41', qty: 6, unitPrice: 20000, lineDiscount: { type: 'percent', value: 10 }, unitCostSnapshot: 12000, priceSource: 'list' },
    { productId: 'product-60', qty: 1, unitPrice: 185000, unitCostSnapshot: 150000, priceSource: 'list' },
  ],
  subtotal: 461000,
  discountTotal: 0,
  taxTotal: 0,
  total: 461000,
  payments: [{ method: 'cash', amount: 461000 }],
  status: 'paid',
  createdAt: '2026-09-13T09:41:00.000Z',
  channel: 'retail',
};

const priorReturn: ReturnRecord = {
  id: 'return-x',
  orgId: 'org-1',
  storeId: 'store-1',
  orderId: 'order-1',
  lines: [{ productId: 'product-21', qty: 4, reason: 'changedMind', disposition: 'restock', unitPrice: 7000 }],
  refundAmount: 28000,
  staffId: 'staff-1',
  createdAt: new Date('2026-09-13T10:00:00.000Z'),
};

describe('draftLinesFor', () => {
  it('opens every line at quantity zero with the price it was sold at', () => {
    const draft = draftLinesFor(order, []);
    expect(draft.map((line) => line.qty)).toEqual([0, 0, 0]);
    expect(draft.map((line) => line.unitPrice)).toEqual([7000, 18000, 185000]);
    expect(draft.map((line) => line.remainingQty)).toEqual([24, 6, 1]);
  });

  it('caps what is left by what an earlier return already took', () => {
    expect(draftLinesFor(order, [priorReturn])[0].remainingQty).toBe(20);
  });
});

describe('clampQty', () => {
  it('never goes below zero or past what is still returnable', () => {
    const [line] = draftLinesFor(order, [priorReturn]);
    expect(clampQty(line, -3)).toBe(0);
    expect(clampQty(line, 99)).toBe(20);
    expect(clampQty(line, 6.7)).toBe(6);
    expect(clampQty(line, Number.NaN)).toBe(0);
  });
});

describe('summarize', () => {
  const draft = draftLinesFor(order, []);
  const picked = [
    { ...draft[0], qty: 6, reason: 'nearExpiry' as const, disposition: 'restock' as const },
    { ...draft[1], qty: 2, reason: 'damagedPack' as const, disposition: 'damaged' as const },
    draft[2],
  ];

  it('reports nothing to do until a line is picked', () => {
    const summary = summarize(order, [], draft, []);
    expect(summary.ready).toBe(false);
    expect(summary.plan.refundAmount).toBe(0);
    expect(summary.exchange.refundDue).toBe(0);
  });

  it('prices the return, splits the dispositions and nets the exchange', () => {
    const summary = summarize(order, [], picked, [{ productId: 'product-30', qty: 2, unitPrice: 24000 }]);
    expect(summary.ready).toBe(true);
    expect(summary.plan.refundAmount).toBe(78000);
    expect(summary.plan.restockLines.map((line) => line.productId)).toEqual(['product-21']);
    expect(summary.plan.damagedLines.map((line) => line.productId)).toEqual(['product-41']);
    expect(exchangeValue([{ productId: 'product-30', qty: 2, unitPrice: 24000 }])).toBe(48000);
    expect(summary.exchange.refundDue).toBe(30000);
    expect(summary.exchange.amountDue).toBe(0);
  });

  it('turns the net around when the exchange is worth more than the return', () => {
    const summary = summarize(order, [], picked, [{ productId: 'product-30', qty: 5, unitPrice: 24000 }]);
    expect(summary.exchange.amountDue).toBe(42000);
    expect(summary.exchange.refundDue).toBe(0);
  });

  it('refuses a quantity past what an earlier return left', () => {
    const summary = summarize(order, [priorReturn], [{ ...draft[0], qty: 24 }], []);
    expect(summary.ready).toBe(false);
    expect(summary.plan.error).toContain('exceeds remaining returnable');
  });

  it('keeps only the picked rows in the request', () => {
    expect(requestLinesOf(picked).map((line) => line.productId)).toEqual(['product-21', 'product-41']);
  });
});

describe('findOrderByCode', () => {
  it('prefers an exact code and falls back to a partial one', () => {
    const other: Order = { ...order, id: 'order-2', code: 'HD20260913-00071' };
    expect(findOrderByCode([other, order], 'HD20260913-0007')?.id).toBe('order-1');
    expect(findOrderByCode([other, order], '0007')?.id).toBe('order-2');
    expect(findOrderByCode([other, order], '   ')).toBeUndefined();
  });
});

describe('settlesOnAccount', () => {
  const company: Customer = {
    id: 'customer-41',
    orgId: 'org-1',
    name: 'Cty TNHH Thương mại Minh Long',
    phone: '0913452118',
    points: 0,
    tier: 'bronze',
    totalSpent: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    type: 'company',
  };

  it('is true for a company order nothing was collected on', () => {
    expect(settlesOnAccount({ ...order, payments: [] }, company)).toBe(true);
  });

  it('is false once the company paid, and false for a retail customer', () => {
    expect(settlesOnAccount(order, company)).toBe(false);
    expect(settlesOnAccount({ ...order, payments: [] }, { ...company, type: 'retail' })).toBe(false);
    expect(settlesOnAccount({ ...order, payments: [] }, undefined)).toBe(false);
  });
});
