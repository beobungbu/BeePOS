import type {
  AppNotification,
  Customer,
  LedgerEntry,
  Lot,
  Product,
  PurchaseOrder,
  Shift,
  StockLevel,
  Store,
  Supplier,
} from '../types';
import {
  EXPIRY_WARNING_DAYS,
  TEMPLATE_KEYS_BY_KIND,
  buildNotifications,
  expiringLotNotifications,
  fillTemplate,
  lowStockNotifications,
  mergeNotifications,
  overdueReceivableNotifications,
  poAwaitingNotifications,
  renderNotification,
  unclosedShiftNotifications,
  unreadCount,
  type NotificationLabels,
} from '../notify';

const NOW = new Date('2026-09-11T09:00:00.000Z');

function day(offset: number): Date {
  return new Date(NOW.getTime() + offset * 86_400_000);
}

const labels: NotificationLabels = {
  lowStock: { title: 'Sắp hết', body: '{product} tại {store}: {onHand}/{minLevel}' },
  outOfStock: { title: 'Hết hàng', body: '{product} tại {store}' },
  expiringLot: { title: 'Sắp hết hạn', body: '{lotCode} còn {days} ngày' },
  unclosedShift: { title: 'Ca chưa chốt', body: '{store} đã mở {hours} giờ' },
  overdueReceivable: { title: 'Quá hạn', body: '{customer} nợ {overdue}' },
  poAwaiting: { title: 'Chờ nhận', body: '{code} còn {remaining}/{ordered}' },
};

const products: Product[] = [
  {
    id: 'p1',
    orgId: 'org-1',
    sku: 'DU-001',
    barcode: '1',
    name: 'Coca-Cola',
    categoryId: 'cat-1',
    unit: 'lon',
    costPrice: 6000,
    salePrice: 9000,
    taxRate: 0.1,
    isActive: true,
  },
];

const stores: Store[] = [
  {
    id: 'store-1',
    orgId: 'org-1',
    code: 'HN01',
    name: 'Cầu Giấy',
    address: '',
    phone: '',
    isActive: true,
  },
];

const baseInput = { orgId: 'org-1', now: NOW, labels, products, stores };

describe('fillTemplate', () => {
  it('replaces known tokens and leaves unknown ones alone', () => {
    expect(fillTemplate('{a} và {b}', { a: 'x' })).toBe('x và {b}');
  });
});

describe('lowStockNotifications', () => {
  const levels: StockLevel[] = [
    { productId: 'p1', storeId: 'store-1', onHand: 3, reserved: 0, minLevel: 10 },
  ];

  it('fires at or below the minimum and names the shortfall', () => {
    const [notification] = lowStockNotifications({ ...baseInput, stockLevels: levels });
    expect(notification.kind).toBe('low_stock');
    expect(notification.id).toBe('notif-low-stock-store-1-p1');
    expect(notification.body).toBe('Coca-Cola tại Cầu Giấy: 3/10');
  });

  it('uses the out-of-stock wording at zero', () => {
    const [notification] = lowStockNotifications({
      ...baseInput,
      stockLevels: [{ ...levels[0], onHand: 0 }],
    });
    expect(notification.title).toBe('Hết hàng');
  });

  it('carries the kind, the template variant and the raw values, not just a string', () => {
    const [notification] = lowStockNotifications({ ...baseInput, stockLevels: levels });
    expect(notification.templateKey).toBe('lowStock');
    expect(notification.params).toEqual({
      product: 'Coca-Cola',
      store: 'Cầu Giấy',
      onHand: 3,
      minLevel: 10,
    });
    // A screen with its own dictionary re-renders from those rather than the stored copy.
    expect(
      renderNotification(notification, { title: 'Low', body: '{product}: {onHand} left' }),
    ).toEqual({ title: 'Low', body: 'Coca-Cola: 3 left' });
  });

  it('names the out-of-stock variant when it fires', () => {
    const [notification] = lowStockNotifications({
      ...baseInput,
      stockLevels: [{ ...levels[0], onHand: 0 }],
    });
    expect(notification.templateKey).toBe('outOfStock');
    expect(TEMPLATE_KEYS_BY_KIND[notification.kind]).toContain(notification.templateKey);
  });

  it('stays silent above the minimum', () => {
    expect(
      lowStockNotifications({ ...baseInput, stockLevels: [{ ...levels[0], onHand: 11 }] }),
    ).toEqual([]);
  });

  it('honours the per-rule cap', () => {
    const many = Array.from({ length: 5 }, (_, index) => ({
      productId: 'p1',
      storeId: `store-${index}`,
      onHand: index,
      reserved: 0,
      minLevel: 10,
    }));
    expect(
      lowStockNotifications({ ...baseInput, stockLevels: many, limitPerRule: 2 }),
    ).toHaveLength(2);
  });
});

describe('expiringLotNotifications', () => {
  function lot(overrides: Partial<Lot>): Lot {
    return {
      id: 'lot-1',
      orgId: 'org-1',
      storeId: 'store-1',
      productId: 'p1',
      lotCode: 'L260901-1',
      onHand: 5,
      ...overrides,
    };
  }

  it('fires inside the warning window and for already-expired batches', () => {
    const result = expiringLotNotifications({
      ...baseInput,
      lots: [lot({ id: 'soon', expiresAt: day(5) }), lot({ id: 'gone', expiresAt: day(-3) })],
    });
    // Soonest first, so the expired batch leads.
    expect(result.map((notification) => notification.refId)).toEqual(['gone', 'soon']);
  });

  it('stays silent beyond the window, for empty batches and for undated ones', () => {
    expect(
      expiringLotNotifications({
        ...baseInput,
        lots: [
          lot({ id: 'far', expiresAt: day(EXPIRY_WARNING_DAYS + 1) }),
          lot({ id: 'empty', expiresAt: day(1), onHand: 0 }),
          lot({ id: 'undated' }),
        ],
      }),
    ).toEqual([]);
  });
});

describe('unclosedShiftNotifications', () => {
  function shift(overrides: Partial<Shift>): Shift {
    return {
      id: 'shift-1',
      orgId: 'org-1',
      storeId: 'store-1',
      cashierId: 'staff-6',
      openedAt: day(-1).toISOString(),
      openingCash: 500_000,
      expectedCash: 500_000,
      orderCount: 12,
      revenue: 0,
      ...overrides,
    };
  }

  it('fires on a shift open longer than the cutoff', () => {
    const [notification] = unclosedShiftNotifications({ ...baseInput, shifts: [shift({})] });
    expect(notification.kind).toBe('shift_open');
    expect(notification.body).toBe('Cầu Giấy đã mở 24 giờ');
  });

  it('ignores a closed shift and one that has only just opened', () => {
    expect(
      unclosedShiftNotifications({
        ...baseInput,
        shifts: [
          shift({ id: 'closed', closedAt: NOW.toISOString() }),
          shift({ id: 'fresh', openedAt: new Date(NOW.getTime() - 3_600_000).toISOString() }),
        ],
      }),
    ).toEqual([]);
  });
});

describe('overdueReceivableNotifications', () => {
  const customers: Customer[] = [
    {
      id: 'c1',
      orgId: 'org-1',
      name: 'Cty A',
      phone: '0912345678',
      points: 0,
      tier: 'bronze',
      totalSpent: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      type: 'company',
    },
  ];

  it('fires on money past its due date', () => {
    const entries: LedgerEntry[] = [
      {
        id: 'l1',
        orgId: 'org-1',
        party: 'customer',
        partyId: 'c1',
        kind: 'invoice',
        refType: 'manual',
        amount: 50_000,
        dueDate: day(-12),
        createdAt: day(-42),
      },
    ];
    const [notification] = overdueReceivableNotifications({
      ...baseInput,
      customers,
      ledgerEntries: entries,
    });
    expect(notification.kind).toBe('overdue_receivable');
    expect(notification.body).toBe('Cty A nợ 50000');
  });

  it('stays silent while the invoice is inside its term', () => {
    const entries: LedgerEntry[] = [
      {
        id: 'l1',
        orgId: 'org-1',
        party: 'customer',
        partyId: 'c1',
        kind: 'invoice',
        refType: 'manual',
        amount: 50_000,
        dueDate: day(10),
        createdAt: day(-20),
      },
    ];
    expect(
      overdueReceivableNotifications({ ...baseInput, customers, ledgerEntries: entries }),
    ).toEqual([]);
  });
});

describe('poAwaitingNotifications', () => {
  const suppliers: Supplier[] = [
    { id: 'supplier-1', orgId: 'org-1', name: 'An Phát', isActive: true },
  ];

  function order(overrides: Partial<PurchaseOrder>): PurchaseOrder {
    return {
      id: 'po-1',
      orgId: 'org-1',
      storeId: 'store-1',
      supplierId: 'supplier-1',
      code: 'PO001',
      lines: [{ productId: 'p1', qty: 100, receivedQty: 40, unitCost: 6000 }],
      status: 'partial',
      createdAt: day(-5),
      ...overrides,
    };
  }

  it('fires on sent and partly received orders and counts what is outstanding', () => {
    const result = poAwaitingNotifications({
      ...baseInput,
      suppliers,
      purchaseOrders: [
        order({}),
        order({ id: 'po-2', status: 'sent', code: 'PO002' }),
        order({ id: 'po-3', status: 'received', code: 'PO003' }),
        order({ id: 'po-4', status: 'draft', code: 'PO004' }),
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0].body).toBe('PO001 còn 60/100');
  });
});

describe('buildNotifications and merge', () => {
  it('runs every rule and returns them in list order', () => {
    const result = buildNotifications({
      ...baseInput,
      stockLevels: [{ productId: 'p1', storeId: 'store-1', onHand: 0, reserved: 0, minLevel: 5 }],
      shifts: [
        {
          id: 'shift-1',
          orgId: 'org-1',
          storeId: 'store-1',
          cashierId: 'staff-6',
          openedAt: day(-2).toISOString(),
          openingCash: 0,
          expectedCash: 0,
          orderCount: 1,
          revenue: 0,
        },
      ],
    });
    expect(result.map((notification) => notification.kind)).toEqual(['low_stock', 'shift_open']);
  });

  it('names a template variant for every kind it can produce', () => {
    const kinds = Object.keys(TEMPLATE_KEYS_BY_KIND) as (keyof typeof TEMPLATE_KEYS_BY_KIND)[];
    for (const kind of kinds) {
      expect(TEMPLATE_KEYS_BY_KIND[kind].length).toBeGreaterThan(0);
      for (const key of TEMPLATE_KEYS_BY_KIND[kind]) expect(labels[key]).toBeDefined();
    }
  });

  it('keeps the stored copy when a row has no params to re-render from', () => {
    const legacy: AppNotification = {
      id: 'a',
      orgId: 'org-1',
      kind: 'low_stock',
      title: 'Stored title',
      body: 'Stored body',
      createdAt: NOW,
    };
    expect(renderNotification(legacy, { title: '{x}', body: '{y}' })).toEqual({
      title: 'Stored title',
      body: 'Stored body',
    });
  });

  it('preserves read marks and drops rows that no longer apply', () => {
    const existing: AppNotification[] = [
      {
        id: 'a',
        orgId: 'org-1',
        kind: 'low_stock',
        title: 'old',
        body: 'old',
        readAt: NOW,
        createdAt: day(-3),
      },
      {
        id: 'gone',
        orgId: 'org-1',
        kind: 'low_stock',
        title: 'x',
        body: 'x',
        createdAt: day(-3),
      },
    ];
    const computed: AppNotification[] = [
      { id: 'a', orgId: 'org-1', kind: 'low_stock', title: 'new', body: 'new', createdAt: NOW },
      { id: 'b', orgId: 'org-1', kind: 'low_stock', title: 'b', body: 'b', createdAt: NOW },
    ];

    const merged = mergeNotifications(existing, computed);
    expect(merged.map((notification) => notification.id)).toEqual(['a', 'b']);
    // The copy is refreshed but the fact that it was read, and when it first appeared, is not.
    expect(merged[0]).toMatchObject({ title: 'new', readAt: NOW, createdAt: day(-3) });
    expect(unreadCount(merged)).toBe(1);
  });
});
