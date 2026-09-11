import { isValidEan13, marginPercent, nextSku } from '../catalog';

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
