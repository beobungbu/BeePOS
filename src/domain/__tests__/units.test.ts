import type { Product } from '../types';
import {
  barcodesOf,
  findByBarcode,
  fromBaseQty,
  meetsMinOrderQty,
  toBaseQty,
  unitFactor,
  unitOptions,
  unitPriceFor,
} from '../units';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    orgId: 'org-1',
    sku: 'DU-001',
    barcode: '8930000000017',
    name: 'Coca-Cola 330ml',
    categoryId: 'cat-1',
    unit: 'lon',
    costPrice: 6500,
    salePrice: 9000,
    taxRate: 0.1,
    isActive: true,
    ...overrides,
  };
}

const withUnits = makeProduct({
  units: [
    { unit: 'lốc', factor: 6 },
    { unit: 'thùng', factor: 24, barcode: '8940000000014' },
  ],
  barcodes: ['8950000000011'],
  minOrderQty: 24,
});

describe('unitFactor', () => {
  it('is 1 for the base unit and for no unit at all', () => {
    expect(unitFactor(withUnits, 'lon')).toBe(1);
    expect(unitFactor(withUnits, undefined)).toBe(1);
  });

  it('reads the declared factor', () => {
    expect(unitFactor(withUnits, 'lốc')).toBe(6);
    expect(unitFactor(withUnits, 'thùng')).toBe(24);
  });

  it('falls back to 1 for an unknown unit rather than guessing', () => {
    expect(unitFactor(withUnits, 'kiện')).toBe(1);
  });

  it('rejects a non-positive factor', () => {
    const broken = makeProduct({ units: [{ unit: 'thùng', factor: 0 }] });
    expect(unitFactor(broken, 'thùng')).toBe(1);
  });
});

describe('unitOptions', () => {
  it('lists the base unit first and never twice', () => {
    const duplicated = makeProduct({
      units: [
        { unit: 'lon', factor: 1 },
        { unit: 'thùng', factor: 24 },
      ],
    });
    expect(unitOptions(duplicated).map((option) => option.unit)).toEqual(['lon', 'thùng']);
  });
});

describe('quantity conversion', () => {
  it('converts into and back out of base units', () => {
    expect(toBaseQty(withUnits, 2, 'thùng')).toBe(48);
    expect(fromBaseQty(withUnits, 48, 'thùng')).toBe(2);
  });

  it('treats a missing unit as base units', () => {
    expect(toBaseQty(withUnits, 5)).toBe(5);
  });

  it('returns 0 for a non-finite quantity', () => {
    expect(toBaseQty(withUnits, Number.NaN, 'thùng')).toBe(0);
  });
});

describe('unitPriceFor', () => {
  it('scales the base price by the unit factor', () => {
    expect(unitPriceFor(withUnits, 9000, 'thùng')).toBe(216_000);
    expect(unitPriceFor(withUnits, 9000, undefined)).toBe(9000);
  });
});

describe('meetsMinOrderQty', () => {
  it('passes when the product has no minimum', () => {
    expect(meetsMinOrderQty(makeProduct(), 1)).toBe(true);
  });

  it('compares against base units', () => {
    expect(meetsMinOrderQty(withUnits, 23)).toBe(false);
    expect(meetsMinOrderQty(withUnits, 24)).toBe(true);
  });
});

describe('findByBarcode', () => {
  const products = [makeProduct({ id: 'product-9', barcode: '8930000000093' }), withUnits];

  it('finds the primary barcode and reports the base unit', () => {
    expect(findByBarcode(products, '8930000000017')).toEqual({
      product: withUnits,
      unit: 'lon',
      factor: 1,
    });
  });

  it('finds a secondary barcode on the SKU itself', () => {
    expect(findByBarcode(products, '8950000000011')?.factor).toBe(1);
  });

  it('finds a case barcode and returns that unit and its factor', () => {
    expect(findByBarcode(products, '8940000000014')).toEqual({
      product: withUnits,
      unit: 'thùng',
      factor: 24,
    });
  });

  it('ignores surrounding whitespace a wedge scanner can add', () => {
    expect(findByBarcode(products, ' 8940000000014 ')?.unit).toBe('thùng');
  });

  it('matches nothing for an unknown or empty code', () => {
    expect(findByBarcode(products, '0000000000000')).toBeUndefined();
    expect(findByBarcode(products, '   ')).toBeUndefined();
  });
});

describe('barcodesOf', () => {
  it('lists every scannable code once, primary first', () => {
    expect(barcodesOf(withUnits)).toEqual([
      '8930000000017',
      '8950000000011',
      '8940000000014',
    ]);
  });
});
