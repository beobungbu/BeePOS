import { create } from 'zustand';
import type { Staff, Store } from '../domain/types';
import { staff as seedStaff, stores as seedStores } from './seed';

interface SessionState {
  staff: Staff | null;
  store: Store | null;
  storeOptions: Store[];
  login: (storeCode: string, pin: string) => boolean;
  selectStore: (storeId: string) => void;
  logout: () => void;
}

function findStoreOptions(member: Staff): Store[] {
  return seedStores.filter((store) => member.storeIds.includes(store.id));
}

export const useSessionStore = create<SessionState>((set, get) => ({
  staff: null,
  store: null,
  storeOptions: [],

  login: (storeCode, pin) => {
    const store = seedStores.find(
      (candidate) => candidate.code.toLowerCase() === storeCode.trim().toLowerCase(),
    );
    if (!store) return false;

    const member = seedStaff.find(
      (candidate) => candidate.pin === pin && candidate.storeIds.includes(store.id),
    );
    if (!member) return false;

    set({ staff: member, store, storeOptions: findStoreOptions(member) });
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
