/**
 * The quote memo in front of the precedence engine.
 *
 * The sell grid asks for the same quote once per visible tile per commit, and a scroll is
 * nothing but commits, which is where the wholesale switch lost four to seven frames over
 * 100 ms (`reports/w-e-e2e-perf-report.md` 5.6). Two things have to hold for the memo to be
 * safe: the same question is answered from the cache, and a different question, or an edited
 * rule, is never answered from it.
 */

import type {
  Customer,
  CustomerGroup,
  PriceList,
  PriceRule,
  Product,
  Promotion,
  StorePrice,
} from '../../../../domain/types';
import { usePricingStore } from '../../../../data/pricing-store';
import { useStorePriceStore } from '../../../../data/store-price-store';
import {
  cachedResolvePrice,
  invalidatePriceCache,
  priceCacheSize,
  type PriceCacheScope,
} from '../price-cache';

const STORE = 'store-cache-1';
const LIST_PRICE = 20_000;

const product: Product = {
  id: 'product-cache-1',
  orgId: 'org-1',
  sku: 'SKU-CACHE-1',
  barcode: '8930000000001',
  name: 'Sản phẩm thử',
  categoryId: 'category-1',
  unit: 'lon',
  costPrice: 12_000,
  salePrice: LIST_PRICE,
  taxRate: 0,
  isActive: true,
  units: [{ unit: 'thùng', factor: 24 }],
};

const scope: PriceCacheScope = { storeId: STORE, channel: 'retail' };

/** The context the sell screen builds, minus what each case changes. */
function context(overrides: { storePrices?: StorePrice[]; promotions?: Promotion[]; priceRules?: PriceRule[] } = {}) {
  return {
    storeId: STORE,
    groups: [],
    priceLists: [],
    priceRules: overrides.priceRules ?? [],
    storePrices: overrides.storePrices ?? [],
    promotions: overrides.promotions ?? [],
    channel: 'retail' as const,
  };
}

beforeEach(() => {
  invalidatePriceCache();
});

describe('the sell grid price cache', () => {
  it('answers the second identical question without re-pricing', () => {
    const first = cachedResolvePrice(scope, product, 1, undefined, context());
    const second = cachedResolvePrice(scope, product, 1, undefined, context());

    expect(second.unitPrice).toBe(LIST_PRICE);
    // The very same resolution object: the engine was not asked a second time.
    expect(second).toBe(first);
    expect(priceCacheSize()).toBe(1);
  });

  it('keys the quantity, so a tier a quantity clears is never served from a smaller one', () => {
    const group: CustomerGroup = {
      id: 'group-cache-1',
      orgId: 'org-1',
      name: 'Đại lý A',
      discountPercent: 0,
      priceListId: 'list-cache-1',
    };
    const priceLists: PriceList[] = [{ id: 'list-cache-1', orgId: 'org-1', name: 'Sỉ A', isActive: true }];
    const priceRules: PriceRule[] = [
      {
        id: 'rule-cache-1',
        orgId: 'org-1',
        priceListId: 'list-cache-1',
        productId: product.id,
        minQty: 10,
        unitPrice: 15_000,
      },
    ];
    const buyer: Customer = {
      id: 'customer-cache-1',
      orgId: 'org-1',
      name: 'Cty thử',
      phone: '0900000001',
      points: 0,
      tier: 'bronze',
      totalSpent: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      type: 'company',
      groupId: group.id,
    };
    const tierScope: PriceCacheScope = {
      storeId: STORE,
      channel: 'wholesale',
      customerId: buyer.id,
      groupId: group.id,
    };
    const wholesale = {
      ...context({ priceRules }),
      channel: 'wholesale' as const,
      customer: buyer,
      groups: [group],
      priceLists,
    };

    expect(cachedResolvePrice(tierScope, product, 1, undefined, wholesale).unitPrice).toBe(LIST_PRICE);
    expect(cachedResolvePrice(tierScope, product, 10, undefined, wholesale).unitPrice).toBe(15_000);
    expect(priceCacheSize()).toBe(2);
  });

  it('keys the selling unit, so a case is never quoted at the price of one can', () => {
    const perCan = cachedResolvePrice(scope, product, 1, undefined, context()).unitPrice;
    const perCase = cachedResolvePrice(scope, product, 1, 'thùng', context()).unitPrice;
    expect(perCase).toBe(perCan * 24);
  });

  it('keys the branch, so one shop override is never the other shop price', () => {
    const storePrices: StorePrice[] = [
      { orgId: 'org-1', storeId: 'store-cache-2', productId: product.id, salePrice: 18_000 },
    ];
    const other: PriceCacheScope = { storeId: 'store-cache-2', channel: 'retail' };

    expect(cachedResolvePrice(scope, product, 1, undefined, context({ storePrices })).unitPrice).toBe(
      LIST_PRICE,
    );
    expect(
      cachedResolvePrice(other, product, 1, undefined, { ...context({ storePrices }), storeId: 'store-cache-2' })
        .unitPrice,
    ).toBe(18_000);
  });

  it('drops every quote when a promotion is edited', () => {
    cachedResolvePrice(scope, product, 1, undefined, context());
    expect(priceCacheSize()).toBe(1);

    const promotion: Promotion = {
      id: 'promo-cache-1',
      orgId: 'org-1',
      name: 'Giảm 10%',
      type: 'percent',
      value: 10,
      productIds: [product.id],
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      endsAt: new Date('2030-01-01T00:00:00.000Z'),
      isActive: true,
      stackable: false,
    };
    usePricingStore.getState().upsertPromotion(promotion);
    expect(priceCacheSize()).toBe(0);

    expect(
      cachedResolvePrice(scope, product, 1, undefined, context({ promotions: [promotion] })).unitPrice,
    ).toBe(18_000);

    usePricingStore.getState().removePromotion(promotion.id);
  });

  it('drops every quote when a branch price is set', () => {
    cachedResolvePrice(scope, product, 1, undefined, context());
    expect(priceCacheSize()).toBe(1);

    useStorePriceStore
      .getState()
      .setStorePrice({ orgId: 'org-1', storeId: STORE, productId: product.id, salePrice: 17_000 });
    expect(priceCacheSize()).toBe(0);

    useStorePriceStore.getState().clearStorePrice(STORE, product.id);
  });
});
