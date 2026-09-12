import { create } from 'zustand';
import type { Staff, Store } from '../domain/types';
import { isStaffActive, useOrgStore } from './org-store';

interface SessionState {
  staff: Staff | null;
  store: Store | null;
  storeOptions: Store[];
  login: (storeCode: string, pin: string) => boolean;
  selectStore: (storeId: string) => void;
  logout: () => void;
}

function findStoreOptions(member: Staff, stores: Store[]): Store[] {
  return stores.filter((store) => member.storeIds.includes(store.id));
}

export const useSessionStore = create<SessionState>((set, get) => ({
  staff: null,
  store: null,
  storeOptions: [],

  /**
   * Credentials are read from the org store, not from the seed arrays: the staff screen can
   * reset a PIN, deactivate a member and create new ones, and all three have to reach the
   * login form. Reading the seed instead left a reset PIN inert, the old one still working,
   * and a deactivated cashier still able to open the till.
   */
  login: (storeCode, pin) => {
    const { stores, staff, staffActiveById } = useOrgStore.getState();

    const store = stores.find(
      (candidate) => candidate.code.toLowerCase() === storeCode.trim().toLowerCase(),
    );
    if (!store) return false;

    // Deactivated members are skipped rather than matched and then rejected: the seed gives
    // every member the same mock PIN, so rejecting the first match would lock out everyone
    // who shares it instead of only the member who was turned off.
    const member = staff.find(
      (candidate) =>
        candidate.pin === pin &&
        candidate.storeIds.includes(store.id) &&
        isStaffActive(staffActiveById, candidate.id),
    );
    if (!member) return false;

    set({ staff: member, store, storeOptions: findStoreOptions(member, stores) });
    return true;
  },

  selectStore: (storeId) => {
    const { staff: member, storeOptions } = get();
    if (!member) return;
    const nextStore = storeOptions.find((store) => store.id === storeId);
    if (!nextStore) return;
    set({ store: nextStore });
  },

  logout: () => set({ staff: null, store: null, storeOptions: [] }),
}));

export function getCurrentStaff(): Staff | null {
  return useSessionStore.getState().staff;
}

export function getCurrentStore(): Store | null {
  return useSessionStore.getState().store;
}
