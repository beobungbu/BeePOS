import type { Customer } from '../types';
import { filterCustomers, isValidVnPhone, pointHistory, tierFor, type PointMovement } from '../customers';

describe('tierFor', () => {
  it('returns bronze below the silver threshold', () => {
    expect(tierFor(0)).toBe('bronze');
    expect(tierFor(1_999_999)).toBe('bronze');
  });

  it('returns silver at the silver threshold', () => {
    expect(tierFor(2_000_000)).toBe('silver');
  });

  it('returns gold at the gold threshold', () => {
    expect(tierFor(8_000_000)).toBe('gold');
  });

  it('returns platinum at the platinum threshold', () => {
    expect(tierFor(20_000_000)).toBe('platinum');
    expect(tierFor(50_000_000)).toBe('platinum');
  });
});

describe('isValidVnPhone', () => {
  it('accepts a valid 10-digit mobile number', () => {
    expect(isValidVnPhone('0912345678')).toBe(true);
  });

  it('accepts numbers with separators', () => {
    expect(isValidVnPhone('091 234 5678')).toBe(true);
    expect(isValidVnPhone('091-234-5678')).toBe(true);
  });

  it('accepts a +84 country code form', () => {
    expect(isValidVnPhone('+84912345678')).toBe(true);
  });

  it('rejects an invalid head digit', () => {
    expect(isValidVnPhone('0212345678')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidVnPhone('09123')).toBe(false);
    expect(isValidVnPhone('091234567890')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidVnPhone('abcdefghij')).toBe(false);
  });
});

const ORG = 'org-1';

const customers: Customer[] = [
  { id: 'c1', orgId: ORG, name: 'Nguyễn Văn An', phone: '0912345678', points: 10, tier: 'bronze', totalSpent: 100_000, createdAt: '2026-01-01T00:00:00.000Z', type: 'retail' },
  { id: 'c2', orgId: ORG, name: 'Trần Thị Bình', phone: '0987654321', points: 500, tier: 'gold', totalSpent: 9_000_000, createdAt: '2026-01-01T00:00:00.000Z', type: 'retail' },
];

describe('filterCustomers', () => {
  it('filters by tier', () => {
    expect(filterCustomers(customers, { tier: 'gold' }).map((c) => c.id)).toEqual(['c2']);
  });

  it('filters by name search', () => {
    expect(filterCustomers(customers, { search: 'bình' }).map((c) => c.id)).toEqual(['c2']);
  });

  it('filters by phone search', () => {
    expect(filterCustomers(customers, { search: '9876' }).map((c) => c.id)).toEqual(['c2']);
  });

  it('combines tier and search', () => {
    expect(filterCustomers(customers, { tier: 'bronze', search: '098' })).toEqual([]);
  });

  it('returns everyone when no filters are set', () => {
    expect(filterCustomers(customers, {})).toHaveLength(2);
  });
});

describe('pointHistory', () => {
  const movements: PointMovement[] = [
    { id: 'm2', customerId: 'c1', kind: 'earned', points: 5, createdAt: '2026-09-02T00:00:00.000Z' },
    { id: 'm1', customerId: 'c1', kind: 'earned', points: 3, createdAt: '2026-09-01T00:00:00.000Z' },
    { id: 'm3', customerId: 'c2', kind: 'adjust', points: -1, createdAt: '2026-09-01T00:00:00.000Z' },
  ];

  it('returns only the requested customer, chronologically', () => {
    expect(pointHistory(movements, 'c1').map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('returns an empty list for a customer with no movements', () => {
    expect(pointHistory(movements, 'unknown')).toEqual([]);
  });
});
