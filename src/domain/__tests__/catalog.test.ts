import {
  effectivePrice,
  hasStoreOverride,
  indexStorePrices,
  isValidEan13,
  marginPercent,
  nextSku,
  variantAndUnit,
} from '../catalog';
import type { StorePrice } from '../types';

describe('isValidEan13', () => {
  it('accepts a valid checksum', () => {
    expect(isValidEan13('4006381333931')).toBe(true);
  });

  it('rejects a bad checksum digit', () => {
    expect(isValidEan13('4006381333930')).toBe(false);
  });

  it('rejects non-13-digit input', () => {
    expect(isValidEan13('123')).toBe(false);
    expect(isValidEan13('abcdefghijklm')).toBe(false);
    expect(isValidEan13('')).toBe(false);
  });
});

describe('nextSku', () => {
  it('increments from the highest existing counter for the prefix', () => {
    expect(nextSku(['DU-001', 'DU-002', 'SU-001'], 'DU')).toBe('DU-003');
  });

  it('starts at 001 when no SKU matches the prefix', () => {
    expect(nextSku(['SU-001'], 'DU')).toBe('DU-001');
  });

  it('is case-insensitive on both prefix and existing SKUs', () => {
    expect(nextSku(['du-005'], 'DU')).toBe('DU-006');
  });
});

describe('marginPercent', () => {
  it('computes margin as a percentage of sale price', () => {
    expect(marginPercent(6000, 9000)).toBeCloseTo(33.3, 1);
  });

  it('returns 0 when sale price is zero or negative', () => {
    expect(marginPercent(1000, 0)).toBe(0);
    expect(marginPercent(1000, -5)).toBe(0);
  });

  it('returns a negative margin when cost exceeds sale price', () => {
    expect(marginPercent(12000, 9000)).toBeLessThan(0);
  });
});

describe('variantAndUnit', () => {
  it('joins the variant and the unit with a middle dot', () => {
    expect(variantAndUnit('330ml', 'chai')).toBe('330ml · chai');
    expect(variantAndUnit('Lốc 6 lon', 'chai')).toBe('Lốc 6 lon · chai');
  });

  it('falls back to the unit alone when the product carries no variant', () => {
    expect(variantAndUnit(undefined, 'chai')).toBe('chai');
    expect(variantAndUnit('   ', 'chai')).toBe('chai');
  });

  it('never leads with a separator when one side is missing', () => {
    expect(variantAndUnit('330ml', '')).toBe('330ml');
    expect(variantAndUnit(undefined, '')).toBe('');
  });
});

describe('effectivePrice', () => {
  const product = { id: 'product-1', salePrice: 9000 };
  const overrides: StorePrice[] = [
    { orgId: 'org-1', storeId: 'store-2', productId: 'product-1', salePrice: 9500 },
    { orgId: 'org-1', storeId: 'store-3', productId: 'product-1', salePrice: 10000 },
    { orgId: 'org-1', storeId: 'store-2', productId: 'product-2', salePrice: 1000 },
  ];

  it('returns the chain price for a store with no override', () => {
    expect(effectivePrice(product, 'store-1', overrides)).toBe(9000);
  });

  it("returns the store's own price when it has one", () => {
    expect(effectivePrice(product, 'store-2', overrides)).toBe(9500);
    expect(effectivePrice(product, 'store-3', overrides)).toBe(10000);
  });

  it('never crosses products or stores', () => {
    expect(effectivePrice({ id: 'product-2', salePrice: 4000 }, 'store-3', overrides)).toBe(4000);
  });

  it('falls back to the chain price with no store in the session', () => {
    expect(effectivePrice(product, undefined, overrides)).toBe(9000);
  });

  it('honours a zero override but ignores a negative or broken one', () => {
    const odd: StorePrice[] = [
      { orgId: 'org-1', storeId: 'store-4', productId: 'product-1', salePrice: 0 },
      { orgId: 'org-1', storeId: 'store-5', productId: 'product-1', salePrice: -500 },
      { orgId: 'org-1', storeId: 'store-6', productId: 'product-1', salePrice: Number.NaN },
    ];
    expect(effectivePrice(product, 'store-4', odd)).toBe(0);
    expect(effectivePrice(product, 'store-5', odd)).toBe(9000);
    expect(effectivePrice(product, 'store-6', odd)).toBe(9000);
  });

  it('answers the same from the index as from the rows', () => {
    const index = indexStorePrices(overrides);
    for (const storeId of ['store-1', 'store-2', 'store-3', undefined]) {
      expect(effectivePrice(product, storeId, index)).toBe(effectivePrice(product, storeId, overrides));
    }
  });

  it('hasStoreOverride reports which branches quote their own price', () => {
    expect(hasStoreOverride(product, 'store-2', overrides)).toBe(true);
    expect(hasStoreOverride(product, 'store-1', overrides)).toBe(false);
  });
});
