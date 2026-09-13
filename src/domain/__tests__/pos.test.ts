import {
  activeCartOf,
  addOrIncrementLine,
  applyOrderDiscount,
  calcCart,
  calcChange,
  calcLine,
  cartId,
  closeCart,
  initialCartSet,
  makeCart,
  MAX_OPEN_CARTS,
  nextCartOrdinal,
  nextOrderCode,
  openCart,
  pointsEarned,
  pointsToVnd,
  drawerAfterMovement,
  formatZReportText,
  movementsInShift,
  setLineQty,
  shiftSummary,
  zReportTotals,
  Z_REPORT_METHODS,
  switchCart,
  updateActiveCart,
  emptyScanBuffer,
  formatReceiptText,
  RECEIPT_WIDTH,
  scanBuffer,
  SCAN_MAX_GAP_MS,
  type CartSet,
  type PricedCartLine,
  type ReceiptTextInput,
  type ZReportLabels,
} from '../pos';
import type { CashMovement, Order, Shift } from '../types';

describe('applyOrderDiscount', () => {
  it('computes a percent discount', () => {
    expect(applyOrderDiscount(100000, { type: 'percent', value: 10 })).toBe(10000);
  });

  it('computes an amount discount', () => {
    expect(applyOrderDiscount(100000, { type: 'amount', value: 15000 })).toBe(15000);
  });

  it('clamps a discount greater than the base to the base', () => {
    expect(applyOrderDiscount(50000, { type: 'amount', value: 999999 })).toBe(50000);
  });

  it('returns 0 when there is no discount', () => {
    expect(applyOrderDiscount(50000, undefined)).toBe(0);
  });

  it('never returns a negative amount', () => {
    expect(applyOrderDiscount(50000, { type: 'amount', value: -100 })).toBe(0);
  });
});

describe('calcLine', () => {
  const base: PricedCartLine = { productId: 'p1', qty: 2, unitPrice: 10000, taxRate: 0.1 };

  it('computes subtotal, tax, and total with no discount', () => {
    const result = calcLine(base);
    expect(result.subtotal).toBe(20000);
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(2000);
    expect(result.total).toBe(22000);
  });

  it('applies a line discount before tax', () => {
    const line: PricedCartLine = { ...base, lineDiscount: { type: 'percent', value: 50 } };
    const result = calcLine(line);
    expect(result.discount).toBe(10000);
    expect(result.taxable).toBe(10000);
    expect(result.tax).toBe(1000);
    expect(result.total).toBe(11000);
  });

  it('clamps a line discount larger than the line subtotal', () => {
    const line: PricedCartLine = { ...base, lineDiscount: { type: 'amount', value: 999999 } };
    const result = calcLine(line);
    expect(result.discount).toBe(20000);
    expect(result.taxable).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('calcCart', () => {
  const lines: PricedCartLine[] = [
    { productId: 'p1', qty: 2, unitPrice: 10000, taxRate: 0.1 },
    { productId: 'p2', qty: 1, unitPrice: 50000, taxRate: 0 },
  ];

  it('sums subtotal/discount/tax/total with no order discount', () => {
    const result = calcCart(lines);
    expect(result.subtotal).toBe(70000);
    expect(result.discountTotal).toBe(0);
    expect(result.taxTotal).toBe(2000);
    expect(result.total).toBe(72000);
  });

  it('applies a 10% order discount proportionally to tax', () => {
    const result = calcCart(lines, { type: 'percent', value: 10 });
    expect(result.discountTotal).toBe(7000);
    expect(result.taxTotal).toBe(1800);
    expect(result.total).toBe(64800);
  });

  it('clamps an order discount larger than the cart total', () => {
    const result = calcCart(lines, { type: 'amount', value: 999999 });
    expect(result.discountTotal).toBe(70000);
    expect(result.taxTotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('returns zeros for an empty cart', () => {
    const result = calcCart([]);
    expect(result).toEqual({ subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 });
  });
});

describe('calcChange', () => {
  it('returns the difference when tendered exceeds the amount due', () => {
    expect(calcChange(45000, 50000)).toBe(5000);
  });

  it('returns 0 when tendered is less than or equal to the amount due', () => {
    expect(calcChange(45000, 45000)).toBe(0);
    expect(calcChange(45000, 30000)).toBe(0);
  });
});

describe('pointsEarned / pointsToVnd', () => {
  it('earns 1 point per 10,000 VND, floored', () => {
    expect(pointsEarned(45000)).toBe(4);
    expect(pointsEarned(9999)).toBe(0);
  });

  it('returns 0 points for non-positive spend', () => {
    expect(pointsEarned(0)).toBe(0);
    expect(pointsEarned(-100)).toBe(0);
  });

  it('converts points to VND at 1,000 VND per point', () => {
    expect(pointsToVnd(12)).toBe(12000);
  });

  it('returns 0 VND for non-positive points', () => {
    expect(pointsToVnd(0)).toBe(0);
    expect(pointsToVnd(-5)).toBe(0);
  });
});

describe('nextOrderCode', () => {
  const day = new Date(2026, 8, 11); // 2026-09-11

  it('starts sequence at 001 when no codes exist yet', () => {
    expect(nextOrderCode('HN01', day, [])).toBe('HD-HN01-20260911-001');
  });

  it('increments after the highest existing sequence for that store/day', () => {
    const existing = ['HD-HN01-20260911-001', 'HD-HN01-20260911-002', 'HD-HN02-20260911-005'];
    expect(nextOrderCode('HN01', day, existing)).toBe('HD-HN01-20260911-003');
  });

  it('ignores codes from other stores or other days', () => {
    const existing = ['HD-HN02-20260911-009', 'HD-HN01-20260910-007'];
    expect(nextOrderCode('HN01', day, existing)).toBe('HD-HN01-20260911-001');
  });
});

describe('addOrIncrementLine / setLineQty', () => {
  it('adds a new line for a product not yet in the cart', () => {
    const lines = addOrIncrementLine([], 'p1', 10000);
    expect(lines).toEqual([{ productId: 'p1', qty: 1, unitPrice: 10000 }]);
  });

  it('increments qty when the product is already in the cart', () => {
    const lines = addOrIncrementLine([{ productId: 'p1', qty: 1, unitPrice: 10000 }], 'p1', 10000);
    expect(lines).toEqual([{ productId: 'p1', qty: 2, unitPrice: 10000 }]);
  });

  it('setLineQty updates the quantity of the matching line', () => {
    const lines = setLineQty([{ productId: 'p1', qty: 1, unitPrice: 10000 }], 'p1', 5);
    expect(lines[0].qty).toBe(5);
  });

  it('setLineQty removes the line when qty is 0 or less', () => {
    const initial = [{ productId: 'p1', qty: 1, unitPrice: 10000 }];
    expect(setLineQty(initial, 'p1', 0)).toEqual([]);
    expect(setLineQty(initial, 'p1', -1)).toEqual([]);
  });
});

const ORG = 'org-1';

describe('shiftSummary', () => {
  const shift: Shift = {
    id: 'shift-1',
    orgId: ORG,
    storeId: 'store-1',
    cashierId: 'staff-1',
    openedAt: '2026-09-11T08:00:00.000Z',
    openingCash: 500000,
    expectedCash: 500000,
    orderCount: 0,
    revenue: 0,
  };

  const orders: Order[] = [
    {
      id: 'o1',
      orgId: ORG,
      code: 'HD-HN01-20260911-001',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 100000,
      discountTotal: 0,
      taxTotal: 0,
      total: 100000,
      payments: [{ method: 'cash', amount: 100000 }],
      status: 'paid',
      createdAt: '2026-09-11T09:00:00.000Z',
      channel: 'retail',
    },
    {
      id: 'o2',
      orgId: ORG,
      code: 'HD-HN01-20260911-002',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 50000,
      discountTotal: 0,
      taxTotal: 0,
      total: 50000,
      payments: [{ method: 'transfer', amount: 50000 }],
      status: 'paid',
      createdAt: '2026-09-11T10:00:00.000Z',
      channel: 'retail',
    },
    {
      id: 'o3',
      orgId: ORG,
      code: 'HD-HN01-20260910-001',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 999999,
      discountTotal: 0,
      taxTotal: 0,
      total: 999999,
      payments: [{ method: 'cash', amount: 999999 }],
      status: 'paid',
      createdAt: '2026-09-10T10:00:00.000Z',
      channel: 'retail',
    },
  ];

  it('sums only orders within the shift window for its store/cashier', () => {
    const summary = shiftSummary(shift, orders);
    expect(summary.orderCount).toBe(2);
    expect(summary.revenue).toBe(150000);
    expect(summary.cashRevenue).toBe(100000);
    expect(summary.expectedCash).toBe(600000);
  });

  it('leaves variance null while the shift is still open', () => {
    expect(shiftSummary(shift, orders).variance).toBeNull();
  });

  it('computes variance once the shift is closed', () => {
    const closed: Shift = { ...shift, closedAt: '2026-09-11T18:00:00.000Z', closingCash: 590000 };
    expect(shiftSummary(closed, orders).variance).toBe(-10000);
  });
});

describe('open order set', () => {
  const STORE = 'store-1';

  function setWith(ordinals: number[], activeOrdinal = ordinals[0]): CartSet {
    return {
      carts: ordinals.map((ordinal) => makeCart(STORE, ordinal)),
      activeCartId: cartId(STORE, activeOrdinal),
    };
  }

  it('starts with a single empty active order', () => {
    const state = initialCartSet(STORE);
    expect(state.carts).toHaveLength(1);
    expect(state.carts[0].ordinal).toBe(1);
    expect(state.activeCartId).toBe(state.carts[0].id);
  });

  it('gives a new order the smallest unused ordinal', () => {
    expect(nextCartOrdinal([])).toBe(1);
    expect(nextCartOrdinal(setWith([1, 2, 3]).carts)).toBe(4);
    expect(nextCartOrdinal(setWith([1, 3, 4]).carts)).toBe(2);
  });

  it('opens an order and activates it', () => {
    const next = openCart(initialCartSet(STORE), STORE);
    expect(next).not.toBeNull();
    expect(next!.carts).toHaveLength(2);
    expect(next!.carts[1].ordinal).toBe(2);
    expect(next!.activeCartId).toBe(next!.carts[1].id);
  });

  it('refuses to open a ninth order', () => {
    const full = setWith([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(full.carts).toHaveLength(MAX_OPEN_CARTS);
    expect(openCart(full, STORE)).toBeNull();
  });

  it('switches to an open order and ignores an unknown id', () => {
    const state = setWith([1, 2, 3]);
    expect(switchCart(state, cartId(STORE, 3)).activeCartId).toBe(cartId(STORE, 3));
    expect(switchCart(state, 'cart-missing')).toBe(state);
  });

  it('activates the next order when the active one closes', () => {
    const state = setWith([1, 2, 3], 2);
    const next = closeCart(state, cartId(STORE, 2));
    expect(next.carts.map((cart) => cart.ordinal)).toEqual([1, 3]);
    expect(next.activeCartId).toBe(cartId(STORE, 3));
  });

  it('activates the previous order when the last one closes', () => {
    const state = setWith([1, 2, 3], 3);
    const next = closeCart(state, cartId(STORE, 3));
    expect(next.activeCartId).toBe(cartId(STORE, 2));
  });

  it('keeps the active order when another one closes', () => {
    const state = setWith([1, 2, 3], 1);
    const next = closeCart(state, cartId(STORE, 3));
    expect(next.carts.map((cart) => cart.ordinal)).toEqual([1, 2]);
    expect(next.activeCartId).toBe(cartId(STORE, 1));
  });

  it('leaves one empty order behind when the last order closes', () => {
    const state = initialCartSet(STORE);
    const withLines: CartSet = {
      ...state,
      carts: [{ ...state.carts[0], lines: [{ productId: 'p1', qty: 2, unitPrice: 9000 }] }],
    };
    const next = closeCart(withLines, state.activeCartId);
    expect(next.carts).toHaveLength(1);
    expect(next.carts[0].lines).toEqual([]);
    expect(next.activeCartId).toBe(next.carts[0].id);
  });

  it('ignores closing an unknown order', () => {
    const state = setWith([1, 2]);
    expect(closeCart(state, 'cart-missing')).toBe(state);
  });

  it('updates only the active order', () => {
    const state = setWith([1, 2], 2);
    const next = updateActiveCart(state, (cart) => ({ ...cart, note: 'giao tận nơi' }));
    expect(next.carts[0].note).toBeUndefined();
    expect(next.carts[1].note).toBe('giao tận nơi');
    expect(activeCartOf(next).note).toBe('giao tận nơi');
  });

  it('falls back to the first order when the active id is stale', () => {
    const state: CartSet = { ...setWith([1, 2]), activeCartId: 'cart-missing' };
    expect(activeCartOf(state).ordinal).toBe(1);
  });
});

describe('scanBuffer', () => {
  /** Feeds a whole burst at a fixed keystroke interval and returns the last step. */
  function burst(keys: string[], gapMs: number, startAt = 1000) {
    let step = { buffer: emptyScanBuffer } as ReturnType<typeof scanBuffer>;
    keys.forEach((key, index) => {
      step = scanBuffer(step.buffer, key, startAt + index * gapMs);
    });
    return step;
  }

  const CODE = '8935001234567';

  it('emits a fast digit burst that ends with Enter', () => {
    const step = burst([...CODE, 'Enter'], 5);
    expect(step.code).toBe(CODE);
    expect(step.buffer).toEqual(emptyScanBuffer);
  });

  it('emits an 8 digit code, the shortest real symbology', () => {
    expect(burst([...'89350012', 'Enter'], 5).code).toBe('89350012');
  });

  it('ignores a burst shorter than 8 digits', () => {
    expect(burst([...'1234567', 'Enter'], 5).code).toBeUndefined();
  });

  it('ignores human typing speed', () => {
    expect(burst([...CODE, 'Enter'], SCAN_MAX_GAP_MS + 1).code).toBeUndefined();
  });

  it('restarts the burst after a slow keystroke instead of splicing two codes', () => {
    let step = burst([...'99999'], 5);
    // A pause, then a full code: the five stale digits must not end up on the front.
    step = scanBuffer(step.buffer, '8', 5000);
    [...CODE.slice(1), 'Enter'].forEach((key, index) => {
      step = scanBuffer(step.buffer, key, 5005 + index * 5);
    });
    expect(step.code).toBe(CODE);
  });

  it('cancels on any other key so typed words never scan', () => {
    let step = burst([...'12345678'], 5);
    step = scanBuffer(step.buffer, 'a', 1045);
    expect(step.buffer).toEqual(emptyScanBuffer);
    step = scanBuffer(step.buffer, 'Enter', 1050);
    expect(step.code).toBeUndefined();
  });

  it('drops a burst whose Enter arrives late', () => {
    const digits = burst([...CODE], 5);
    expect(scanBuffer(digits.buffer, 'Enter', 9000).code).toBeUndefined();
  });
});

describe('formatReceiptText', () => {
  const input: ReceiptTextInput = {
    storeName: 'Tạp hoá Cầu Giấy',
    storeAddress: '12 Xuân Thuỷ, Cầu Giấy, Hà Nội',
    code: 'HD-HN01-20260912-001',
    dateText: '12/09/2026 14:32',
    cashierName: 'Nguyễn Thị Lan',
    customerName: 'Khách lẻ',
    lines: [
      { name: 'Nước ngọt Coca-Cola 330ml', qty: 2, unitPrice: 9000 },
      { name: 'Bánh Oreo Gói 133g', qty: 1, unitPrice: 22000 },
    ],
    subtotal: 40000,
    discountTotal: 4000,
    taxTotal: 3600,
    total: 39600,
    payments: [{ label: 'Tiền mặt', amount: 50000 }],
    change: 10400,
    footer: 'Cảm ơn quý khách',
    labels: {
      orderCode: 'Mã hoá đơn',
      date: 'Ngày',
      cashier: 'Thu ngân',
      customer: 'Khách hàng',
      subtotal: 'Tạm tính',
      tax: 'Thuế',
      discount: 'Giảm giá',
      total: 'TỔNG CỘNG',
      change: 'Tiền thừa',
    },
  };

  it('never exceeds the 58 mm roll width', () => {
    for (const row of formatReceiptText(input).split('\n')) {
      expect(row.length).toBeLessThanOrEqual(RECEIPT_WIDTH);
    }
  });

  it('carries the order code, every line and the total', () => {
    const text = formatReceiptText(input);
    expect(text).toContain('HD-HN01-20260912-001');
    expect(text).toContain('Nước ngọt Coca-Cola 330ml');
    expect(text).toContain('2 x 9.000');
    expect(text).toContain('TỔNG CỘNG');
    expect(text).toContain('39.600');
  });

  it('signs the discount and shows the change only when there is some', () => {
    expect(formatReceiptText(input)).toContain('-4.000');
    expect(formatReceiptText(input)).toContain('Tiền thừa');
    expect(formatReceiptText({ ...input, change: 0 })).not.toContain('Tiền thừa');
  });

  it('wraps a name too long for the roll instead of clipping its price', () => {
    const text = formatReceiptText({
      ...input,
      lines: [{ name: 'Nước mắm cốt cá cơm Phú Quốc 40 độ đạm chai thuỷ tinh', qty: 3, unitPrice: 125000 }],
    });
    expect(text).toContain('Nước mắm cốt cá cơm Phú Quốc 40');
    expect(text).toContain('3 x 125.000');
    for (const row of text.split('\n')) expect(row.length).toBeLessThanOrEqual(RECEIPT_WIDTH);
  });

  it('prints without a store address', () => {
    const text = formatReceiptText({ ...input, storeAddress: undefined });
    expect(text.split('\n')[1]).toBe('-'.repeat(RECEIPT_WIDTH));
  });
});

describe('cash movements in a shift', () => {
  const shift: Shift = {
    id: 'shift-9',
    orgId: ORG,
    storeId: 'store-1',
    cashierId: 'staff-1',
    openedAt: '2026-09-13T01:00:00.000Z',
    openingCash: 1_500_000,
    expectedCash: 1_500_000,
    orderCount: 0,
    revenue: 0,
  };

  const orders: Order[] = [
    {
      id: 'z1',
      orgId: ORG,
      code: 'HD-HN01-20260913-001',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 13_000_000,
      discountTotal: 520_000,
      taxTotal: 0,
      total: 12_480_000,
      payments: [{ method: 'cash', amount: 12_480_000 }],
      status: 'paid',
      createdAt: '2026-09-13T02:00:00.000Z',
      channel: 'retail',
    },
    {
      id: 'z2',
      orgId: ORG,
      code: 'HD-HN01-20260913-002',
      storeId: 'store-1',
      cashierId: 'staff-1',
      lines: [],
      subtotal: 8_280_000,
      discountTotal: 160_000,
      taxTotal: 0,
      total: 8_120_000,
      payments: [{ method: 'transfer', amount: 8_120_000 }],
      status: 'paid',
      createdAt: '2026-09-13T03:00:00.000Z',
      channel: 'retail',
    },
  ];

  const movements: CashMovement[] = [
    {
      id: 'cash-1',
      orgId: ORG,
      storeId: 'store-1',
      shiftId: 'shift-9',
      type: 'in',
      amount: 2_000_000,
      reason: 'deposit',
      staffId: 'staff-1',
      createdAt: new Date('2026-09-13T01:15:00.000Z'),
    },
    {
      id: 'cash-2',
      orgId: ORG,
      storeId: 'store-1',
      shiftId: 'shift-9',
      type: 'out',
      amount: 5_000_000,
      reason: 'withdraw',
      staffId: 'staff-1',
      createdAt: new Date('2026-09-13T04:30:00.000Z'),
    },
    {
      id: 'cash-3',
      orgId: ORG,
      storeId: 'store-1',
      shiftId: 'other-shift',
      type: 'out',
      amount: 900_000,
      reason: 'petty',
      staffId: 'staff-1',
      createdAt: new Date('2026-09-13T04:40:00.000Z'),
    },
  ];

  it('expected cash is the float plus cash sales plus cash in minus cash out', () => {
    const summary = shiftSummary(shift, orders, movements);
    expect(summary.cashRevenue).toBe(12_480_000);
    expect(summary.cashIn).toBe(2_000_000);
    expect(summary.cashOut).toBe(5_000_000);
    expect(summary.expectedCash).toBe(1_500_000 + 12_480_000 + 2_000_000 - 5_000_000);
  });

  it('ignores movements booked against another shift', () => {
    expect(movementsInShift('shift-9', movements)).toHaveLength(2);
    expect(shiftSummary(shift, orders, movements).cashOutCount).toBe(1);
  });

  it('reads the same as before when a shift has no movements', () => {
    expect(shiftSummary(shift, orders).expectedCash).toBe(1_500_000 + 12_480_000);
  });

  it('the drawer after a movement includes every earlier one', () => {
    expect(drawerAfterMovement(shift, orders, movements, 'cash-1')).toBe(
      1_500_000 + 12_480_000 + 2_000_000,
    );
    expect(drawerAfterMovement(shift, orders, movements, 'cash-2')).toBe(
      1_500_000 + 12_480_000 + 2_000_000 - 5_000_000,
    );
  });

  describe('Z report', () => {
    const closed: Shift = { ...shift, closedAt: '2026-09-13T14:40:00.000Z', closingCash: 10_930_000 };
    const refunds = [
      {
        id: 'r1',
        orderId: 'z1',
        createdAt: '2026-09-13T05:00:00.000Z',
        lines: [],
        method: 'cash' as const,
        reason: 'khách trả hàng',
        amount: 1_240_000,
        pointsDeducted: 0,
      },
      // Belongs to an order this shift never sold, so it is not this shift's problem.
      {
        id: 'r2',
        orderId: 'not-mine',
        createdAt: '2026-09-13T05:10:00.000Z',
        lines: [],
        method: 'cash' as const,
        reason: 'khác ca',
        amount: 500_000,
        pointsDeducted: 0,
      },
    ];

    const totals = zReportTotals({ shift: closed, orders, refunds, movements });

    it('net takings are gross minus the refunds of this shift only', () => {
      expect(totals.grossRevenue).toBe(20_600_000);
      expect(totals.refundCount).toBe(1);
      expect(totals.refundTotal).toBe(1_240_000);
      expect(totals.netRevenue).toBe(20_600_000 - 1_240_000);
    });

    it('the payment mix adds up to the gross takings', () => {
      const byMethod = totals.payments.reduce((total, payment) => total + payment.amount, 0);
      expect(byMethod).toBe(totals.grossRevenue);
      expect(totals.payments.map((payment) => payment.method)).toEqual(Z_REPORT_METHODS);
    });

    it('the drawer block balances: expected = opening + cash + in - out, variance = counted - expected', () => {
      expect(totals.expectedCash).toBe(
        totals.openingCash + totals.cashRevenue + totals.cashIn - totals.cashOut,
      );
      expect(totals.countedCash).toBe(10_930_000);
      expect(totals.variance).toBe(10_930_000 - totals.expectedCash);
    });

    it('prints every figure at 32 columns', () => {
      const text = formatZReportText({
        orgName: 'Chuỗi tạp hoá Bee',
        storeName: 'HN01 · Tạp hoá Cầu Giấy',
        dateText: '13/09/2026',
        registerName: 'Quầy 1',
        shiftWindowText: 'Ca 08:00 - 21:40',
        cashierNames: ['Vũ Thị Giang'],
        totals,
        movements: [
          { timeText: '08:15', reason: 'Nộp tiền', type: 'in', amount: 2_000_000 },
          { timeText: '11:30', reason: 'Rút tiền', type: 'out', amount: 5_000_000 },
        ],
        closedByName: 'Vũ Thị Giang',
        printedAtText: '13/09/2026 21:42',
        footer: 'Cảm ơn quý khách',
        labels: Z_LABELS,
      });

      expect(text).toContain('BAO CAO Z');
      expect(text).toContain('19.360.000 đ');
      expect(text).toContain('+2.000.000 đ');
      expect(text).toContain('-5.000.000 đ');
      expect(text).toContain('08:15 Nộp tiền');
      // The block is a roll: no rendered line may be wider than the paper.
      for (const line of text.split('\n')) expect(line.length).toBeLessThanOrEqual(RECEIPT_WIDTH);
    });
  });
});

/** Labels for the formatter test; the app passes the dictionary, the domain owns no copy. */
const Z_LABELS: ZReportLabels = {
  title: 'BAO CAO Z',
  revenueSection: 'DOANH THU',
  orderCount: 'So don',
  revenue: 'Doanh thu',
  discount: 'Giam gia',
  refunds: 'Hoan tra',
  netRevenue: 'Thuc thu',
  methodSection: 'THEO PHUONG THUC',
  methods: { cash: 'Tien mat', transfer: 'Chuyen khoan', card: 'The', points: 'Diem' },
  drawerSection: 'TIEN MAT',
  openingCash: 'Dau ca',
  cashSales: 'Ban tien mat',
  cashIn: 'Thu khac',
  cashOut: 'Chi khac',
  expected: 'Du kien',
  counted: 'Dem thuc te',
  variance: 'Chenh lech',
  movementSection: 'THU CHI',
  noMovements: 'Khong co',
  closedBy: 'Nguoi dong ca',
  printedAt: 'In luc',
  notCounted: 'Chua dem',
};
