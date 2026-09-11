import { create } from 'zustand';
import type { Staff, Store } from '../domain/types';
import { staff as seedStaff, stores as seedStores } from './seed';

interface OrgState {
  stores: Store[];
  staff: Staff[];
  /**
   * Staff active/inactive flag, keyed by staff id. The shared `Staff` domain type (owned by
   * phase 0) has no active flag, so it is tracked here instead of widening that type for a
   * single phase's UI. Missing entries default to active.
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
}

export const useOrgStore = create<OrgState>((set) => ({
  stores: seedStores,
  staff: seedStaff,
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

  setStaffActive: (staffId, isActive) =>
    set((state) => ({ staffActiveById: { ...state.staffActiveById, [staffId]: isActive } })),

  resetStaffPin: (staffId, pin) =>
    set((state) => ({
      staff: state.staff.map((item) => (item.id === staffId ? { ...item, pin } : item)),
    })),
}));

/** Selector helper: a staff member is active unless explicitly marked inactive. */
export function isStaffActive(staffActiveById: Record<string, boolean>, staffId: string): boolean {
  return staffActiveById[staffId] ?? true;
}
