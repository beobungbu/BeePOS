import type {
  Customer,
  CustomerGroup,
  LoyaltyRule,
  PriceList,
  PriceRule,
  Product,
  Promotion,
  StorePrice,
} from '../types';
import {
  applyPromotion,
  groupFor,
  pointsEarnedFor,
  pointsEarnedForTier,
  pointsValueFor,
  promotionApplies,
  resolveBasePrice,
  resolvePrice,
  tierMultiplierFor,
} from '../pricing';

const NOW = new Date('2026-09-11T09:00:00.000Z');

const product: Product = {
  id: 'p1',
  orgId: 'org-1',
  sku: 'DU-001',
  barcode: '8930000000017',
  name: 'Coca-Cola 330ml',
  categoryId: 'cat-1',
  unit: 'lon',
  costPrice: 6500,
  salePrice: 10_000,
  taxRate: 0.1,
  isActive: true,
  units: [{ unit: 'thùng', factor: 24 }],
};

const groups: CustomerGroup[] = [
  { id: 'g-retail', orgId: 'org-1', name: 'Lẻ', discountPercent: 0 },
  { id: 'g-a', orgId: 'org-1', name: 'Đại lý A', discountPercent: 5, priceListId: 'pl-a' },
  { id: 'g-plain', orgId: 'org-1', name: 'Đại lý C', discountPercent: 12 },
];

const priceLists: PriceList[] = [
  { id: 'pl-a', orgId: 'org-1', name: 'Bảng giá A', isActive: true },
  { id: 'pl-off', orgId: 'org-1', name: 'Bảng giá cũ', isActive: false },
];

const priceRules: PriceRule[] = [
  { id: 'r-flat', orgId: 'org-1', priceListId: 'pl-a', productId: 'p1', minQty: 1, unitPrice: 9200 },
  { id: 'r-tier', orgId: 'org-1', priceListId: 'pl-a', productId: 'p1', minQty: 10, unitPrice: 8800 },
  { id: 'r-cust', orgId: 'org-1', customerId: 'c-vip', productId: 'p1', minQty: 1, unitPrice: 8000 },
];

const storePrices: StorePrice[] = [
  { orgId: 'org-1', storeId: 'store-2', productId: 'p1', salePrice: 10_500 },
];

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'c-a',
    orgId: 'org-1',
    name: 'Cty A',
    phone: '0912345678',
    points: 0,
    tier: 'bronze',
    totalSpent: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    type: 'company',
    groupId: 'g-a',
    ...overrides,
  };
}

const base = { priceLists, priceRules, storePrices, groups, now: NOW };

describe('resolveBasePrice precedence', () => {
  it('falls back to the catalogue price with nothing else set', () => {
    expect(resolveBasePrice(product, 1, base)).toEqual({ unitPrice: 10_000, source: 'list' });
  });

  it('prefers a branch price over the catalogue price', () => {
    expect(resolveBasePrice(product, 1, { ...base, storeId: 'store-2' })).toEqual({
      unitPrice: 10_500,
      source: 'store',
    });
  });

  it("uses the group's price list over the branch price", () => {
    const result = resolveBasePrice(product, 1, {
      ...base,
      storeId: 'store-2',
      customer: customer(),
    });
    expect(result).toEqual({ unitPrice: 9200, source: 'group' });
  });

  it('uses the quantity tier once the qty clears it', () => {
    expect(resolveBasePrice(product, 10, { ...base, customer: customer() })).toEqual({
      unitPrice: 8800,
      source: 'tier',
    });
  });

  it('lets a customer price beat the tier', () => {
    const result = resolveBasePrice(product, 50, {
      ...base,
      customer: customer({ id: 'c-vip' }),
    });
    expect(result).toEqual({ unitPrice: 8000, source: 'customer' });
  });

  it("applies a group's blanket discount when it has no price list", () => {
    const result = resolveBasePrice(product, 1, {
      ...base,
      customer: customer({ groupId: 'g-plain' }),
    });
    expect(result).toEqual({ unitPrice: 8800, source: 'group_discount' });
  });

  it('takes the blanket discount off the branch price, not the catalogue price', () => {
    const result = resolveBasePrice(product, 1, {
      ...base,
      storeId: 'store-2',
      customer: customer({ groupId: 'g-plain' }),
    });
    expect(result).toEqual({ unitPrice: 9240, source: 'group_discount' });
  });

  it('walks all six levels in order for one product', () => {
    const buyer = customer({ id: 'c-vip' });
    const sources = [
      // 1. customer rule
      resolveBasePrice(product, 1, { ...base, customer: buyer }).source,
      // 2. quantity tier (no customer rule in play)
      resolveBasePrice(product, 10, { ...base, customer: customer() }).source,
      // 3. flat price-list row
      resolveBasePrice(product, 1, { ...base, customer: customer() }).source,
      // 4. group discount, for a group with no list
      resolveBasePrice(product, 1, { ...base, customer: customer({ groupId: 'g-plain' }) }).source,
      // 5. branch price, for a group with neither
      resolveBasePrice(product, 1, {
        ...base,
        storeId: 'store-2',
        customer: customer({ groupId: 'g-retail' }),
      }).source,
      // 6. catalogue price
      resolveBasePrice(product, 1, { ...base, customer: customer({ groupId: 'g-retail' }) }).source,
    ];
    expect(sources).toEqual(['customer', 'tier', 'group', 'group_discount', 'store', 'list']);
  });

  it('ignores an inactive price list', () => {
    const result = resolveBasePrice(product, 1, {
      ...base,
      groups: [{ id: 'g-x', orgId: 'org-1', name: 'X', discountPercent: 0, priceListId: 'pl-off' }],
      priceRules: [
        { id: 'r-off', orgId: 'org-1', priceListId: 'pl-off', productId: 'p1', minQty: 1, unitPrice: 1000 },
      ],
      customer: customer({ groupId: 'g-x' }),
    });
    expect(result).toEqual({ unitPrice: 10_000, source: 'list' });
  });

  it('ignores group and customer pricing on a retail sale', () => {
    const result = resolveBasePrice(product, 10, {
      ...base,
      customer: customer({ id: 'c-vip' }),
      channel: 'retail',
    });
    expect(result).toEqual({ unitPrice: 10_000, source: 'list' });
  });
});

describe('promotionApplies', () => {
  function promo(overrides: Partial<Promotion> = {}): Promotion {
    return {
      id: 'promo-1',
      orgId: 'org-1',
      name: 'Giảm 10%',
      type: 'percent',
      value: 10,
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-30T00:00:00.000Z'),
      isActive: true,
      stackable: true,
      ...overrides,
    };
  }

  it('needs the promotion to be active and in window', () => {
    expect(promotionApplies(promo(), product, undefined, NOW)).toBe(true);
    expect(promotionApplies(promo({ isActive: false }), product, undefined, NOW)).toBe(false);
    expect(
      promotionApplies(promo({ endsAt: new Date('2026-09-01T00:00:00.000Z') }), product, undefined, NOW),
    ).toBe(false);
  });

  it('narrows by product, category and store', () => {
    expect(promotionApplies(promo({ productIds: ['p2'] }), product, undefined, NOW)).toBe(false);
    expect(promotionApplies(promo({ categoryIds: ['cat-1'] }), product, undefined, NOW)).toBe(true);
    expect(promotionApplies(promo({ storeIds: ['store-1'] }), product, 'store-2', NOW)).toBe(false);
    expect(promotionApplies(promo({ storeIds: ['store-1'] }), product, 'store-1', NOW)).toBe(true);
  });

  it('treats a store-scoped promotion as out of scope when no store is known', () => {
    expect(promotionApplies(promo({ storeIds: ['store-1'] }), product, undefined, NOW)).toBe(false);
  });
});

describe('applyPromotion', () => {
  const window = {
    startsAt: new Date('2026-09-01T00:00:00.000Z'),
    endsAt: new Date('2026-09-30T00:00:00.000Z'),
    isActive: true,
    stackable: false,
    orgId: 'org-1',
  };

  it('takes a percentage off', () => {
    expect(
      applyPromotion(10_000, 1, { ...window, id: 'a', name: 'a', type: 'percent', value: 10 }),
    ).toBe(9000);
  });

  it('clamps a percentage above 100', () => {
    expect(
      applyPromotion(10_000, 1, { ...window, id: 'a', name: 'a', type: 'percent', value: 150 }),
    ).toBe(0);
  });

  it('takes an amount off without going below zero', () => {
    expect(
      applyPromotion(4000, 1, { ...window, id: 'a', name: 'a', type: 'amount', value: 5000 }),
    ).toBe(0);
  });

  it('spreads buy 2 get 1 across the line', () => {
    const promo = {
      ...window,
      id: 'a',
      name: 'a',
      type: 'buy_x_get_y' as const,
      value: 0,
      buyQty: 2,
      getQty: 1,
    };
    expect(applyPromotion(9000, 2, promo)).toBe(9000);
    expect(applyPromotion(9000, 3, promo)).toBe(6000);
    expect(applyPromotion(9000, 6, promo)).toBe(6000);
  });
});

describe('resolvePrice', () => {
  const percentPromo: Promotion = {
    id: 'promo-pct',
    orgId: 'org-1',
    name: 'Giảm 10%',
    type: 'percent',
    value: 10,
    categoryIds: ['cat-1'],
    startsAt: new Date('2026-09-01T00:00:00.000Z'),
    endsAt: new Date('2026-09-30T00:00:00.000Z'),
    isActive: true,
    stackable: true,
  };

  it('reports the promotion as the source and keeps the base price for comparison', () => {
    const result = resolvePrice(product, 1, undefined, { ...base, promotions: [percentPromo] });
    expect(result.unitPrice).toBe(9000);
    expect(result.source).toBe('promotion');
    expect(result.promotionId).toBe('promo-pct');
    expect(result.basePrice).toBe(10_000);
  });

  it('compounds stackable promotions rather than adding their percentages', () => {
    const second = { ...percentPromo, id: 'promo-pct-2' };
    const result = resolvePrice(product, 1, undefined, {
      ...base,
      promotions: [percentPromo, second],
    });
    expect(result.unitPrice).toBe(8100);
    expect(result.promotionIds).toEqual(['promo-pct', 'promo-pct-2']);
  });

  it('uses a non-stackable promotion alone when it beats the stacked chain', () => {
    const deep: Promotion = { ...percentPromo, id: 'promo-deep', value: 40, stackable: false };
    const result = resolvePrice(product, 1, undefined, {
      ...base,
      promotions: [percentPromo, deep],
    });
    expect(result.unitPrice).toBe(6000);
    expect(result.promotionIds).toEqual(['promo-deep']);
  });

  it('keeps the stacked chain when the exclusive offer is worse', () => {
    const shallow: Promotion = { ...percentPromo, id: 'promo-shallow', value: 5, stackable: false };
    const result = resolvePrice(product, 1, undefined, {
      ...base,
      promotions: [percentPromo, shallow],
    });
    expect(result.unitPrice).toBe(9000);
    expect(result.promotionIds).toEqual(['promo-pct']);
  });

  it('prices a case off the base-unit rules and multiplies by the factor', () => {
    const result = resolvePrice(product, 1, 'thùng', { ...base, customer: customer() });
    // One case is 24 base units, which clears the 10-unit tier at 8.800 each.
    expect(result.source).toBe('tier');
    expect(result.unitPrice).toBe(8800 * 24);
    expect(result.listPrice).toBe(10_000 * 24);
  });

  it('treats a zero or negative quantity as one', () => {
    expect(resolvePrice(product, 0, undefined, base).unitPrice).toBe(10_000);
  });
});

describe('groupFor', () => {
  it('resolves a customer group, and nothing for a customer without one', () => {
    expect(groupFor(customer(), groups)?.id).toBe('g-a');
    expect(groupFor(customer({ groupId: undefined }), groups)).toBeUndefined();
    expect(groupFor(null, groups)).toBeUndefined();
  });
});

describe('loyalty maths', () => {
  const rule: LoyaltyRule = {
    orgId: 'org-1',
    earnPerVnd: 1 / 10_000,
    redeemVndPerPoint: 1000,
    tierThresholds: { silver: 2_000_000, gold: 8_000_000, platinum: 20_000_000 },
    tierMultiplier: { bronze: 1, silver: 1.2, gold: 1.5, platinum: 2 },
  };

  it('earns one point per 10.000 đ and redeems each for 1.000 đ', () => {
    expect(pointsEarnedFor(95_000, 1 / 10_000)).toBe(9);
    expect(pointsValueFor(9, 1000)).toBe(9000);
  });

  it('is zero for nonsense input', () => {
    expect(pointsEarnedFor(-1, 1 / 10_000)).toBe(0);
    expect(pointsEarnedFor(10_000, 0)).toBe(0);
    expect(pointsValueFor(Number.NaN, 1000)).toBe(0);
  });

  it('multiplies the earn rate by the tier', () => {
    expect(tierMultiplierFor(rule, 'bronze')).toBe(1);
    expect(tierMultiplierFor(rule, 'platinum')).toBe(2);
    expect(pointsEarnedForTier(rule, 100_000, 'bronze')).toBe(10);
    expect(pointsEarnedForTier(rule, 100_000, 'gold')).toBe(15);
    expect(pointsEarnedForTier(rule, 100_000, 'platinum')).toBe(20);
  });

  it('earns at the plain rate when the rule sets no multipliers', () => {
    const plain: LoyaltyRule = { ...rule, tierMultiplier: undefined };
    expect(tierMultiplierFor(plain, 'platinum')).toBe(1);
    expect(pointsEarnedForTier(plain, 100_000, 'platinum')).toBe(10);
  });

  it('ignores a zero or negative multiplier rather than zeroing a balance', () => {
    const broken: LoyaltyRule = {
      ...rule,
      tierMultiplier: { bronze: 0, silver: -2, gold: 1.5, platinum: 2 },
    };
    expect(pointsEarnedForTier(broken, 100_000, 'bronze')).toBe(10);
    expect(pointsEarnedForTier(broken, 100_000, 'silver')).toBe(10);
  });
});
