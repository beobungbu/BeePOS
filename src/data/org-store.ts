import { create } from 'zustand';
import { normalizeEmail } from '../domain/auth';
import type {
  Organization,
  Register,
  Staff,
  Store,
  UserAccount,
  UserAccountStatus,
} from '../domain/types';
import {
  DEMO_ORG_ID,
  SECOND_ORG_ID,
  accounts as seedAccounts,
  organization as seedOrganization,
  registers as seedRegisters,
  secondOrganization,
  secondOrgAccounts,
  secondOrgRegisters,
  secondOrgStaff,
  secondOrgStores,
  staff as seedStaff,
  stores as seedStores,
} from './seed';
import { activeOrgId } from './active-org';

/**
 * The chain this process is signed into, and only that one.
 *
 * Shops, staff and credentials are per chain, and every screen that lists them reads this
 * store, so holding both chains here at once would offer a store picker in Hà Nội a branch in
 * Quận 7. The active chain is fixed for the life of the process (`active-org.ts`); the
 * switcher writes the other id and reloads.
 */
/**
 * The seed of the chain this launch addresses. Exported because on native the chain is only
 * known after the persistence bootstrap has read it, which is later than this module's import:
 * the bootstrap puts the right chain's seed back before any slice is hydrated.
 */
export function seedForActiveOrg() {
  if (activeOrgId() === SECOND_ORG_ID) {
    return {
      organization: secondOrganization,
      stores: secondOrgStores,
      staff: secondOrgStaff,
      registers: secondOrgRegisters,
      accounts: secondOrgAccounts,
    };
  }
  return {
    organization: seedOrganization,
    stores: seedStores,
    staff: seedStaff,
    registers: seedRegisters,
    accounts: seedAccounts,
  };
}

const ACTIVE_SEED = seedForActiveOrg();

interface OrgState {
  /**
   * The chain this device is signed into. `null` only before onboarding has run, which is the
   * state `app/index.tsx` sends to the wizard instead of to the login form.
   */
  organization: Organization | null;
  stores: Store[];
  staff: Staff[];
  /** Tills, two per seeded store. A session binds to one after the store is picked. */
  registers: Register[];
  /** Sign-in identities. One per staff member in the seed; invites add more. */
  accounts: UserAccount[];
  /**
   * Staff active/inactive flag, keyed by staff id. The shared `Staff` domain type carries no
   * active flag, so it is tracked here; missing entries default to active. An account's
   * `status` is kept in step with it, since that is what the login path reads.
   */
  staffActiveById: Record<string, boolean>;
  /**
   * Free-text opening hours per store, keyed by store id. Not part of the shared `Store`
   * domain type; tracked here since only this phase's UI reads/writes it.
   */
  storeHoursById: Record<string, string>;
  upsertStore: (store: Store) => void;
  setStoreActive: (storeId: string, isActive: boolean) => void;
  setStoreHours: (storeId: string, hours: string) => void;
  upsertStaff: (member: Staff) => void;
  setStaffActive: (staffId: string, isActive: boolean) => void;
  resetStaffPin: (staffId: string, pin: string) => void;
  upsertRegister: (register: Register) => void;
  upsertAccount: (account: UserAccount) => void;
  setAccountStatus: (accountId: string, status: UserAccountStatus) => void;
  /** Stores a new credential pair after a password change or reset. */
  setAccountPassword: (accountId: string, passwordHash: string, salt: string) => void;
  markAccountSignedIn: (accountId: string, at: Date) => void;
  /** Replaces everything with a freshly created chain (the onboarding wizard). */
  createOrganization: (input: CreateOrganizationInput) => void;
}

export interface CreateOrganizationInput {
  organization: Organization;
  store: Store;
  register: Register;
  owner: Staff;
  account: UserAccount;
}

export const useOrgStore = create<OrgState>((set) => ({
  organization: ACTIVE_SEED.organization,
  stores: ACTIVE_SEED.stores,
  staff: ACTIVE_SEED.staff,
  registers: ACTIVE_SEED.registers,
  accounts: ACTIVE_SEED.accounts,
  staffActiveById: {},
  storeHoursById: {},

  upsertStore: (store) =>
    set((state) => {
      const exists = state.stores.some((item) => item.id === store.id);
      return {
        stores: exists
          ? state.stores.map((item) => (item.id === store.id ? store : item))
          : [...state.stores, store],
      };
    }),

  setStoreActive: (storeId, isActive) =>
    set((state) => ({
      stores: state.stores.map((item) => (item.id === storeId ? { ...item, isActive } : item)),
    })),

  setStoreHours: (storeId, hours) =>
    set((state) => ({ storeHoursById: { ...state.storeHoursById, [storeId]: hours } })),

  upsertStaff: (member) =>
    set((state) => {
      const exists = state.staff.some((item) => item.id === member.id);
      return {
        staff: exists
          ? state.staff.map((item) => (item.id === member.id ? member : item))
          : [...state.staff, member],
      };
    }),

  // The account status moves with the flag: login reads the account, so turning a member off
  // on the staff screen has to reach the credential, not just the roster row.
  setStaffActive: (staffId, isActive) =>
    set((state) => ({
      staffActiveById: { ...state.staffActiveById, [staffId]: isActive },
      accounts: state.accounts.map((account) => {
        if (account.staffId !== staffId) return account;
        if (isActive) return account.status === 'disabled' ? { ...account, status: 'active' } : account;
        return { ...account, status: 'disabled' };
      }),
    })),

  resetStaffPin: (staffId, pin) =>
    set((state) => ({
      staff: state.staff.map((item) => (item.id === staffId ? { ...item, pin } : item)),
    })),

  upsertRegister: (register) =>
    set((state) => {
      const exists = state.registers.some((item) => item.id === register.id);
      return {
        registers: exists
          ? state.registers.map((item) => (item.id === register.id ? register : item))
          : [...state.registers, register],
      };
    }),

  upsertAccount: (account) =>
    set((state) => {
      const exists = state.accounts.some((item) => item.id === account.id);
      return {
        accounts: exists
          ? state.accounts.map((item) => (item.id === account.id ? account : item))
          : [...state.accounts, account],
      };
    }),

  setAccountStatus: (accountId, status) =>
    set((state) => ({
      accounts: state.accounts.map((item) => (item.id === accountId ? { ...item, status } : item)),
    })),

  setAccountPassword: (accountId, passwordHash, salt) =>
    set((state) => ({
      accounts: state.accounts.map((item) =>
        item.id === accountId
          ? { ...item, passwordHash, salt, mustChangePassword: false, status: item.status === 'invited' ? 'active' : item.status }
          : item,
      ),
    })),

  markAccountSignedIn: (accountId, at) =>
    set((state) => ({
      accounts: state.accounts.map((item) =>
        item.id === accountId ? { ...item, lastLoginAt: at } : item,
      ),
    })),

  createOrganization: ({ organization, store, register, owner, account }) =>
    set({
      organization,
      stores: [store],
      staff: [owner],
      registers: [register],
      accounts: [account],
      staffActiveById: {},
      storeHoursById: {},
    }),
}));

/** Selector helper: a staff member is active unless explicitly marked inactive. */
export function isStaffActive(staffActiveById: Record<string, boolean>, staffId: string): boolean {
  return staffActiveById[staffId] ?? true;
}

/** The sign-in account of a staff member, if one was ever created for them. */
export function accountForStaff(accounts: UserAccount[], staffId: string): UserAccount | undefined {
  return accounts.find((account) => account.staffId === staffId);
}

/** Account lookup by email, case and whitespace insensitive. */
export function accountByEmail(accounts: UserAccount[], email: string): UserAccount | undefined {
  const wanted = normalizeEmail(email);
  return accounts.find((account) => normalizeEmail(account.email) === wanted);
}

/** The active tills of a store, in code order. */
export function registersForStore(registers: Register[], storeId: string): Register[] {
  return registers
    .filter((register) => register.storeId === storeId && register.isActive)
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * The chain every new record is stamped with. Falls back to the seeded chain id, which is only
 * reachable before onboarding has run, and in that state there is nothing to stamp yet.
 */
export function currentOrgId(): string {
  return useOrgStore.getState().organization?.id ?? DEMO_ORG_ID;
}
