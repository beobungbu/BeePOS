/**
 * Registers every store that must survive a reload and exposes the two entry points the app
 * uses: `hydrateAll()` (awaited before the first screen renders) and `resetDemoData()` (the
 * Settings action that puts the seed catalogue, orders and stock back).
 *
 * Each store keeps its own storage key and schema version: changing the shape of one slice
 * only invalidates that slice, and a stale slice is discarded rather than merged.
 */
import { useEffect, useState } from 'react';
import {
  clearPreferences,
  hydratePreferences,
  readBooleanPreference,
} from '../lib/preference-storage';
import { persistStore, type PersistedStore } from './persist';
import { useCartStore } from './cart-store';
import { useCatalogStore } from './catalog-store';
import { useCustomerStore } from './customer-store';
import { useInventoryStore } from './inventory-store';
import { useOrderStore } from './order-store';
import { useOrgStore } from './org-store';
import { useSessionStore } from './session-store';
import { SIDEBAR_COLLAPSED_KEY, useSettingsStore } from './settings-store';

/** Bump a version when the matching slice changes shape; the old copy is then dropped on boot. */
const VERSION = {
  session: 1,
  settings: 1,
  carts: 1,
  orders: 1,
  inventory: 1,
  customers: 1,
  catalog: 1,
  org: 1,
} as const;

const KEY = {
  session: 'beepos.persist.session',
  settings: 'beepos.persist.settings',
  carts: 'beepos.persist.carts',
  orders: 'beepos.persist.orders',
  inventory: 'beepos.persist.inventory',
  customers: 'beepos.persist.customers',
  catalog: 'beepos.persist.catalog',
  org: 'beepos.persist.org',
} as const;

/** Every persisted key, so a full wipe needs no enumeration API from the platform storage. */
export const PERSISTED_KEYS = Object.values(KEY);

const entries: PersistedStore[] = [
  // Active staff and store: a reload lands back on the sell screen instead of the login form.
  persistStore(
    KEY.session,
    useSessionStore,
    (state) => ({ staff: state.staff, store: state.store, storeOptions: state.storeOptions }),
    VERSION.session,
  ),
  // `sidebarCollapsed` stays with preference-storage (stores read it while being created) and
  // `posSidebarCollapsed` is deliberately per-session, so neither is picked here.
  persistStore(
    KEY.settings,
    useSettingsStore,
    (state) => ({
      theme: state.theme,
      locale: state.locale,
      density: state.density,
      defaultStoreId: state.defaultStoreId,
      defaultTaxRate: state.defaultTaxRate,
      receiptHeader: state.receiptHeader,
      receiptFooter: state.receiptFooter,
      receiptShowLogo: state.receiptShowLogo,
      currencyDisplay: state.currencyDisplay,
      bankInfo: state.bankInfo,
      printerId: state.printerId,
    }),
    VERSION.settings,
  ),
  // Open orders (parked bills). Subscribed from outside so cart-store.ts stays untouched.
  persistStore(
    KEY.carts,
    useCartStore,
    (state) => ({ carts: state.carts, activeCartId: state.activeCartId }),
    VERSION.carts,
  ),
  persistStore(
    KEY.orders,
    useOrderStore,
    (state) => ({
      orders: state.orders,
      shifts: state.shifts,
      refunds: state.refunds,
      notes: state.notes,
    }),
    VERSION.orders,
  ),
  persistStore(
    KEY.inventory,
    useInventoryStore,
    (state) => ({
      stockLevels: state.stockLevels,
      goodsReceipts: state.goodsReceipts,
      stockTransfers: state.stockTransfers,
      stockCounts: state.stockCounts,
      movements: state.movements,
    }),
    VERSION.inventory,
  ),
  persistStore(
    KEY.customers,
    useCustomerStore,
    (state) => ({
      customers: state.customers,
      pointHistory: state.pointHistory,
      profileExtras: state.profileExtras,
    }),
    VERSION.customers,
  ),
  persistStore(
    KEY.catalog,
    useCatalogStore,
    (state) => ({ products: state.products, categories: state.categories }),
    VERSION.catalog,
  ),
  persistStore(
    KEY.org,
    useOrgStore,
    (state) => ({
      stores: state.stores,
      staff: state.staff,
      staffActiveById: state.staffActiveById,
      storeHoursById: state.storeHoursById,
    }),
    VERSION.org,
  ),
];

let hydration: Promise<void> | null = null;
let hydrated = false;

/**
 * Web only: `localStorage` answers without a turn of the event loop, so the stores are filled
 * at import time and the first frame is already the saved session, theme and open orders.
 * Native storage is async, so there the boot goes through `hydrateAll()` and the gate below.
 */
function hydrateSyncAll(): boolean {
  const done = entries.map((entry) => entry.hydrateSync());
  return done.length > 0 && done.every(Boolean);
}

if (hydrateSyncAll()) {
  hydrated = true;
  hydration = Promise.resolve();
}

/**
 * Writes the pending change before the page goes away. Without this, a reload inside the
 * 300 ms debounce window (log in, hit F5) would drop the change that was still queued.
 */
function flushAllSync(): void {
  for (const entry of entries) entry.flushSync();
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('pagehide', flushAllSync);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushAllSync();
    });
  }
}

async function runHydration(): Promise<void> {
  try {
    await hydratePreferences();
    useSettingsStore.setState({
      sidebarCollapsed: readBooleanPreference(SIDEBAR_COLLAPSED_KEY, false),
    });
    await Promise.all(entries.map((entry) => entry.hydrate()));
  } catch (error) {
    // Storage is a convenience, never a dependency: the app still boots on the seed data.
    console.warn('[persist] hydration failed, continuing with seed data:', error);
  } finally {
    hydrated = true;
  }
}

/**
 * Reads every persisted slice back into its store. Idempotent: later calls await the first
 * run instead of re-reading, so several mounts cannot race each other.
 */
export function hydrateAll(): Promise<void> {
  if (!hydration) hydration = runHydration();
  return hydration;
}

/** True once `hydrateAll()` has finished (successfully or not). */
export function isHydrated(): boolean {
  return hydrated;
}

/** Writes any debounced change immediately. */
export async function flushAll(): Promise<void> {
  await Promise.all(entries.map((entry) => entry.flush()));
}

/**
 * Clears the stored data, puts every store back to the seed state it was created with, and
 * keeps the cashier signed in (the staff and store themselves are seed records).
 *
 * Settings go back to their defaults too, so a reset also restores the default theme, language
 * and receipt text.
 */
export async function resetDemoData(): Promise<void> {
  const { staff, store, storeOptions } = useSessionStore.getState();

  await Promise.all(entries.map((entry) => entry.reset()));
  await clearPreferences();
  useSettingsStore.setState({ sidebarCollapsed: false });

  if (staff && store) {
    useSessionStore.setState({ staff, store, storeOptions });
  }
  await flushAll();
}

/**
 * Gate for the root layout: `false` until the stored state is back in the stores, so no screen
 * ever renders seed data that is about to be replaced.
 */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(isHydrated);

  useEffect(() => {
    if (ready) return;
    let active = true;
    void hydrateAll().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [ready]);

  return ready;
}
