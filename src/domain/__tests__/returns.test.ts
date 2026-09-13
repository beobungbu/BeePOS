import type { Order, OrderLine, ReturnLine, ReturnRecord } from '../types';
import {
  dispositionSplit,
  netExchangeAmount,
  remainingReturnableQty,
  returnPlan,
  returnedQty,
  writeOffValue,
  writeOffsForReturn,
  type ReturnRequestLine,
} from '../returns';

function line(overrides: Partial<OrderLine> = {}): OrderLine {
  return {
    productId: 'p1',
    qty: 3,
    unitPrice: 10_000,
    unitCostSnapshot: 6000,
    priceSource: 'list',
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    orgId: 'org-1',
    code: 'HD001',
    storeId: 'store-1',
    cashierId: 'staff-6',
    lines: [line(), line({ productId: 'p2', qty: 2, unitPrice: 20_000 })],
    subtotal: 70_000,
    discountTotal: 0,
    taxTotal: 0,
    total: 70_000,
    payments: [{ method: 'cash', amount: 70_000 }],
    status: 'paid',
    createdAt: '2026-09-10T09:00:00.000Z',
    channel: 'retail',
    ...overrides,
  };
}

function request(overrides: Partial<ReturnRequestLine> = {}): ReturnRequestLine {
  return { productId: 'p1', qty: 1, reason: 'Khách đổi ý', disposition: 'restock', ...overrides };
}

describe('returnPlan validation', () => {
  it('rejects an empty request', () => {
    expect(returnPlan({ order: makeOrder(), requestLines: [] })).toMatchObject({
      valid: false,
      error: 'no lines selected',
    });
  });

  it('rejects a non-positive or non-finite quantity', () => {
    expect(returnPlan({ order: makeOrder(), requestLines: [request({ qty: 0 })] }).valid).toBe(false);
    expect(
      returnPlan({ order: makeOrder(), requestLines: [request({ qty: Number.NaN })] }).valid,
    ).toBe(false);
  });

  it('rejects a line with no reason', () => {
    expect(returnPlan({ order: makeOrder(), requestLines: [request({ reason: '  ' })] }).valid).toBe(
      false,
    );
  });

  it('rejects a product that is not on the order', () => {
    const result = returnPlan({ order: makeOrder(), requestLines: [request({ productId: 'p9' })] });
    expect(result.error).toMatch(/not on this order/);
  });

  it('caps the quantity at what was sold', () => {
    const result = returnPlan({ order: makeOrder(), requestLines: [request({ qty: 4 })] });
    expect(result.error).toMatch(/exceeds remaining returnable \(3\)/);
  });

  it('caps against earlier returns as well', () => {
    const prior: ReturnRecord[] = [
      {
        id: 'return-0',
        orgId: 'org-1',
        storeId: 'store-1',
        orderId: 'order-1',
        lines: [{ productId: 'p1', qty: 2, reason: 'x', disposition: 'restock', unitPrice: 10_000 }],
        refundAmount: 20_000,
        staffId: 'staff-6',
        createdAt: new Date('2026-09-10T10:00:00.000Z'),
      },
    ];
    expect(remainingReturnableQty(makeOrder(), prior, 'p1')).toBe(1);
    expect(returnedQty(prior, 'order-1', 'p1')).toBe(2);
    expect(
      returnPlan({ order: makeOrder(), requestLines: [request({ qty: 2 })], priorReturns: prior })
        .valid,
    ).toBe(false);
  });

  it('caps the same product requested twice in one return', () => {
    const result = returnPlan({
      order: makeOrder(),
      requestLines: [request({ qty: 2 }), request({ qty: 2 })],
    });
    expect(result.valid).toBe(false);
  });
});

describe('returnPlan pricing', () => {
  it('refunds at the price the line was sold for', () => {
    const result = returnPlan({ order: makeOrder(), requestLines: [request({ qty: 2 })] });
    expect(result.valid).toBe(true);
    expect(result.refundAmount).toBe(20_000);
  });

  it('honours a percent line discount', () => {
    const order = makeOrder({
      lines: [line({ lineDiscount: { type: 'percent', value: 10 } })],
    });
    expect(returnPlan({ order, requestLines: [request()] }).refundAmount).toBe(9000);
  });

  it('spreads an amount line discount across the line', () => {
    const order = makeOrder({
      lines: [line({ qty: 3, lineDiscount: { type: 'amount', value: 3000 } })],
    });
    expect(returnPlan({ order, requestLines: [request()] }).refundAmount).toBe(9000);
  });

  it('splits the lines by disposition', () => {
    const result = returnPlan({
      order: makeOrder(),
      requestLines: [
        request({ qty: 1, disposition: 'restock' }),
        request({ productId: 'p2', qty: 1, disposition: 'damaged', reason: 'Vỡ' }),
      ],
    });
    expect(result.restockLines.map((entry) => entry.productId)).toEqual(['p1']);
    expect(result.damagedLines.map((entry) => entry.productId)).toEqual(['p2']);
  });
});

describe('dispositionSplit', () => {
  const lines: ReturnLine[] = [
    { productId: 'p1', qty: 2, reason: 'x', disposition: 'restock', unitPrice: 10_000 },
    { productId: 'p2', qty: 1, reason: 'y', disposition: 'damaged', unitPrice: 20_000 },
  ];

  it('counts quantity and value each way', () => {
    expect(dispositionSplit(lines)).toEqual({
      restockQty: 2,
      damagedQty: 1,
      restockValue: 20_000,
      damagedValue: 20_000,
    });
  });
});

describe('writeOffsForReturn', () => {
  const lines: ReturnLine[] = [
    { productId: 'p1', qty: 2, reason: 'Còn nguyên', disposition: 'restock', unitPrice: 10_000 },
    { productId: 'p2', qty: 1, reason: 'Bao bì rách', disposition: 'damaged', unitPrice: 20_000 },
  ];

  it('writes off only the damaged lines', () => {
    const at = new Date('2026-09-11T00:00:00.000Z');
    const writeOffs = writeOffsForReturn(lines, {
      orgId: 'org-1',
      storeId: 'store-1',
      staffId: 'staff-6',
      returnId: 'return-1',
      createdAt: at,
    });
    expect(writeOffs).toEqual([
      {
        id: 'writeoff-return-1-1',
        orgId: 'org-1',
        storeId: 'store-1',
        productId: 'p2',
        qty: 1,
        reason: 'Bao bì rách',
        refId: 'return-1',
        staffId: 'staff-6',
        createdAt: at,
      },
    ]);
  });

  it('values a write-off at cost', () => {
    const writeOffs = writeOffsForReturn(lines, {
      orgId: 'org-1',
      storeId: 'store-1',
      staffId: 'staff-6',
      returnId: 'return-1',
    });
    expect(writeOffValue(writeOffs, () => 12_000)).toBe(12_000);
  });
});

describe('netExchangeAmount', () => {
  it('charges the customer when the replacement is dearer', () => {
    expect(netExchangeAmount(50_000, 80_000)).toMatchObject({ net: 30_000, amountDue: 30_000, refundDue: 0 });
  });

  it('refunds when the replacement is cheaper', () => {
    expect(netExchangeAmount(80_000, 50_000)).toMatchObject({ net: -30_000, amountDue: 0, refundDue: 30_000 });
  });

  it('settles to nothing on an even swap', () => {
    expect(netExchangeAmount(50_000, 50_000)).toMatchObject({ amountDue: 0, refundDue: 0 });
  });

  it('clamps negative inputs rather than inventing money', () => {
    expect(netExchangeAmount(-10_000, 20_000).amountDue).toBe(20_000);
  });
});
