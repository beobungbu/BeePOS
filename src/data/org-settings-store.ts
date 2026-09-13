/**
 * Per-branch settings and the chains the signed-in account belongs to.
 *
 * Both are "settings the org owns" rather than device preferences, which is what keeps them
 * out of `settings-store.ts`: theme and density follow the device, a receipt footer follows
 * the shop whichever device prints it.
 */

import { create } from 'zustand';
import type { OrgMembership, OrgSummary, StoreSettings } from '../domain/types';
import { memberships as seedMemberships, orgDirectory as seedOrgDirectory, storeSettings as seedStoreSettings } from './seed';
import { demoSeed } from './chain-seed';

interface OrgSettingsState {
  storeSettings: StoreSettings[];
  memberships: OrgMembership[];
  /** The chains this device knows about, for the switcher. */
  orgDirectory: OrgSummary[];
  /** Merges a partial override into a branch's settings, creating the row if it has none. */
  setStoreSettings: (storeId: string, patch: Partial<Omit<StoreSettings, 'storeId'>>) => void;
  clearStoreSettings: (storeId: string) => void;
  addMembership: (membership: OrgMembership) => void;
  removeMembership: (userId: string, orgId: string) => void;
}

/**
 * Per-branch settings are the demo shop's branches', so another chain starts without them.
 *
 * Memberships and the chain directory are deliberately **not** scoped: they are how an account
 * finds its second chain and how `login` resolves the staff row inside it, so emptying them
 * for a new chain would lock its owner out of the shop they just created.
 */
export function orgSettingsSeedForActiveOrg(): Pick<OrgSettingsState, 'storeSettings'> {
  return { storeSettings: demoSeed(seedStoreSettings, []) };
}

export const useOrgSettingsStore = create<OrgSettingsState>((set) => ({
  ...orgSettingsSeedForActiveOrg(),
  memberships: seedMemberships,
  orgDirectory: seedOrgDirectory,

  setStoreSettings: (storeId, patch) =>
    set((state) => {
      const exists = state.storeSettings.some((entry) => entry.storeId === storeId);
      return {
        storeSettings: exists
          ? state.storeSettings.map((entry) =>
              entry.storeId === storeId ? { ...entry, ...patch } : entry,
            )
          : [...state.storeSettings, { storeId, ...patch }],
      };
    }),

  clearStoreSettings: (storeId) =>
    set((state) => ({
      storeSettings: state.storeSettings.filter((entry) => entry.storeId !== storeId),
    })),

  addMembership: (membership) =>
    set((state) => {
      const exists = state.memberships.some(
        (entry) => entry.userId === membership.userId && entry.orgId === membership.orgId,
      );
      return exists ? state : { memberships: [...state.memberships, membership] };
    }),

  removeMembership: (userId, orgId) =>
    set((state) => ({
      memberships: state.memberships.filter(
        (entry) => !(entry.userId === userId && entry.orgId === orgId),
      ),
    })),
}));

/** A branch's settings, or `undefined` when it follows the chain on everything. */
export function settingsForStore(
  settings: readonly StoreSettings[],
  storeId: string,
): StoreSettings | undefined {
  return settings.find((entry) => entry.storeId === storeId);
}

/**
 * One branch's effective value for a setting: its own when it has one, the chain's otherwise.
 */
export function effectiveSetting<K extends keyof Omit<StoreSettings, 'storeId'>>(
  settings: readonly StoreSettings[],
  storeId: string,
  key: K,
  fallback: NonNullable<StoreSettings[K]>,
): NonNullable<StoreSettings[K]> {
  const value = settingsForStore(settings, storeId)?.[key];
  return (value ?? fallback) as NonNullable<StoreSettings[K]>;
}

/** The chains an account may switch to, in directory order. */
export function orgsForMember(
  memberships: readonly OrgMembership[],
  directory: readonly OrgSummary[],
  userId: string,
): OrgSummary[] {
  const orgIds = new Set(
    memberships.filter((entry) => entry.userId === userId).map((entry) => entry.orgId),
  );
  return directory.filter((org) => orgIds.has(org.id));
}
