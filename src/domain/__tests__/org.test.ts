import type { Staff, Store } from '../types';
import {
  canAssignRole,
  pinsMatch,
  roleOutranks,
  staffCountForStore,
  staffForStore,
  storesForStaff,
  validatePin,
} from '../org';

const stores: Store[] = [
  { id: 'store-1', code: 'HN01', name: 'Store 1', address: '', phone: '', isActive: true },
  { id: 'store-2', code: 'HN02', name: 'Store 2', address: '', phone: '', isActive: true },
];

const staff: Staff[] = [
  { id: 'staff-1', name: 'Bình', role: 'owner', storeIds: ['store-1', 'store-2'], pin: '1234' },
  { id: 'staff-2', name: 'An', role: 'manager', storeIds: ['store-1'], pin: '1234' },
  { id: 'staff-3', name: 'Cường', role: 'cashier', storeIds: ['store-1'], pin: '1234' },
];

describe('canAssignRole', () => {
  it('lets an owner assign any role', () => {
    expect(canAssignRole('owner', 'owner')).toBe(true);
    expect(canAssignRole('owner', 'manager')).toBe(true);
    expect(canAssignRole('owner', 'cashier')).toBe(true);
  });

  it('lets a manager assign only cashiers', () => {
    expect(canAssignRole('manager', 'cashier')).toBe(true);
    expect(canAssignRole('manager', 'manager')).toBe(false);
    expect(canAssignRole('manager', 'owner')).toBe(false);
  });

  it('never lets a cashier assign roles', () => {
    expect(canAssignRole('cashier', 'cashier')).toBe(false);
    expect(canAssignRole('cashier', 'manager')).toBe(false);
  });
});

describe('roleOutranks', () => {
  it('ranks owner > manager > cashier', () => {
    expect(roleOutranks('owner', 'manager')).toBe(true);
    expect(roleOutranks('manager', 'cashier')).toBe(true);
    expect(roleOutranks('cashier', 'manager')).toBe(false);
  });

  it('treats equal roles as outranking (>=)', () => {
    expect(roleOutranks('manager', 'manager')).toBe(true);
  });
});

describe('validatePin', () => {
  it('accepts a 4-digit PIN', () => {
    expect(validatePin('1234')).toEqual({ valid: true });
  });

  it('rejects an empty PIN with the empty error code', () => {
    expect(validatePin('')).toEqual({ valid: false, errorCode: 'empty' });
  });

  it('rejects a PIN with the wrong length', () => {
    expect(validatePin('12').errorCode).toBe('invalid_format');
    expect(validatePin('123456').errorCode).toBe('invalid_format');
  });

  it('rejects a PIN with non-digit characters', () => {
    expect(validatePin('12ab').errorCode).toBe('invalid_format');
  });
});

describe('pinsMatch', () => {
  it('accepts two identical valid PINs', () => {
    expect(pinsMatch('4321', '4321')).toEqual({ valid: true });
  });

  it('rejects mismatched PINs with the mismatch error code', () => {
    const result = pinsMatch('4321', '1234');
    expect(result).toEqual({ valid: false, errorCode: 'mismatch' });
  });

  it('rejects when the first PIN itself is invalid', () => {
    expect(pinsMatch('12', '12').valid).toBe(false);
  });
});

describe('staffForStore', () => {
  it('returns staff assigned to a store, sorted by name', () => {
    const result = staffForStore(staff, 'store-1');
    expect(result.map((m) => m.id)).toEqual(['staff-2', 'staff-1', 'staff-3']);
  });

  it('returns an empty list for a store with no staff', () => {
    expect(staffForStore(staff, 'store-99')).toEqual([]);
  });
});

describe('storesForStaff', () => {
  it('returns every store a staff member is assigned to', () => {
    expect(storesForStaff(staff[0], stores).map((s) => s.id)).toEqual(['store-1', 'store-2']);
  });

  it('returns a single store for a store-scoped staff member', () => {
    expect(storesForStaff(staff[1], stores).map((s) => s.id)).toEqual(['store-1']);
  });
});

describe('staffCountForStore', () => {
  it('counts staff assigned to a store', () => {
    expect(staffCountForStore(staff, 'store-1')).toBe(3);
    expect(staffCountForStore(staff, 'store-2')).toBe(1);
  });
});
