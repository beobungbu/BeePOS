/** Pure organization domain logic: stores, staff, roles, PIN rules (`/stores`, `/staff`). */
import type { Staff, StaffRole, Store } from './types';

const PIN_PATTERN = /^\d{4}$/;

const ROLE_RANK: Record<StaffRole, number> = { cashier: 0, manager: 1, owner: 2 };

/**
 * Whether `actorRole` may create/edit staff with `targetRole`. An owner may assign any
 * role; a manager may only assign cashiers (never another manager or owner); a cashier
 * may never assign roles.
 */
export function canAssignRole(actorRole: StaffRole, targetRole: StaffRole): boolean {
  if (actorRole === 'owner') return true;
  if (actorRole === 'manager') return targetRole === 'cashier';
  return false;
}

/** Whether `actorRole` outranks (or equals, for owner) `targetRole` in the role hierarchy. */
export function roleOutranks(actorRole: StaffRole, targetRole: StaffRole): boolean {
  return ROLE_RANK[actorRole] >= ROLE_RANK[targetRole];
}

/** Machine-readable validation outcome; the UI layer owns localized copy per code. */
export type PinErrorCode = 'empty' | 'invalid_format' | 'mismatch';

export interface PinValidation {
  valid: boolean;
  errorCode?: PinErrorCode;
}

/** A staff PIN must be exactly 4 digits (mock auth, matches the seeded `1234` convention). */
export function validatePin(pin: string): PinValidation {
  if (pin.length === 0) return { valid: false, errorCode: 'empty' };
  if (!PIN_PATTERN.test(pin)) return { valid: false, errorCode: 'invalid_format' };
  return { valid: true };
}

/** Whether two entered PINs (new + confirm) match and are individually valid. */
export function pinsMatch(pin: string, confirmPin: string): PinValidation {
  const base = validatePin(pin);
  if (!base.valid) return base;
  if (pin !== confirmPin) return { valid: false, errorCode: 'mismatch' };
  return { valid: true };
}

/** All staff assigned to a given store, sorted by name. */
export function staffForStore(staff: Staff[], storeId: string): Staff[] {
  return staff
    .filter((member) => member.storeIds.includes(storeId))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/** All active stores a staff member is assigned to. */
export function storesForStaff(staff: Staff, stores: Store[]): Store[] {
  return stores.filter((store) => staff.storeIds.includes(store.id));
}

/** Count of staff assigned to a store (for the stores list "staff count" column). */
export function staffCountForStore(staff: Staff[], storeId: string): number {
  return staff.reduce((count, member) => count + (member.storeIds.includes(storeId) ? 1 : 0), 0);
}
