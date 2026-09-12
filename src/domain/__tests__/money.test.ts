import { formatVND, roundVND, sum } from '../money';

describe('roundVND', () => {
  it('rounds fractional amounts to the nearest dong', () => {
    expect(roundVND(1000.4)).toBe(1000);
    expect(roundVND(1000.5)).toBe(1001);
  });

  it('returns 0 for non-finite input', () => {
    expect(roundVND(NaN)).toBe(0);
    expect(roundVND(Infinity)).toBe(0);
  });
});

describe('sum', () => {
  it('adds a list of amounts', () => {
    expect(sum([1000, 2000, 3000])).toBe(6000);
  });

  it('returns 0 for an empty list', () => {
    expect(sum([])).toBe(0);
  });

  it('rounds the aggregated total', () => {
    expect(sum([1000.2, 999.1])).toBe(1999);
  });
});

describe('formatVND', () => {
  it('formats a whole amount using vi-VN currency conventions', () => {
    const formatted = formatVND(1500000);
    expect(formatted).toContain('1.500.000');
    expect(formatted).toBe('1.500.000 đ');
  });

  it('formats zero', () => {
    expect(formatVND(0)).toContain('0');
  });

  it('rounds before formatting', () => {
    expect(formatVND(999.9)).toContain('1.000');
  });
});
