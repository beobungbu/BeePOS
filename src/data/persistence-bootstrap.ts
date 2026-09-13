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
import { getPlatformStorage, persistStore, type PersistedStore } from './persist';
import { DEMO_ORG_ID } from './seed';
import { useCartStore } from './cart-store';
import { useCatalogStore } from './catalog-store';
import { useCustomerStore } from './customer-store';
import { useInventoryStore } from './inventory-store';
import { useOrderStore } from './order-store';
import { useOrgStore } from './org-store';
import { useSessionStore } from './session-store';
import { SIDEBAR_COLLAPSED_KEY, useSettingsStore } from './settings-store';

/**
 * The chain whose data these keys address. Kept in its own tiny key so the scope is known
 * before any slice is read: the org slice itself is what would otherwise have to be parsed
 * first, and the data slices are registered at import time.
 *
 * A chain created through onboarding writes its id here and starts from empty storage instead
 * of inheriting the seeded chain's catalogue, orders and stock.
 */
const ACTIVE_ORG_KEY = 'beepos.persist.active-org';

function readActiveOrgId(): string {
  try {
    return getPlatformStorage().getItemSync?.(ACTIVE_ORG_KEY) || DEMO_ORG_ID;
  } catch {
    return DEMO_ORG_ID;
  }
}

/** Points the data keys at `orgId`. The caller reloads the app, which re-registers the keys. */
export function setActiveOrgId(orgId: string): void {
  const storage = getPlatformStorage();
  storage.setItemSync?.(ACTIVE_ORG_KEY, orgId);
  void storage.setItem(ACTIVE_ORG_KEY, orgId);
}

const ORG_SCOPE = readActiveOrgId();

/** Bump a version when the matching slice changes shape; the old copy is then dropped on boot. */
const VERSION = {
  session: 2,
  settings: 1,
  carts: 1,
  orders: 1,
  inventory: 1,
  customers: 1,
  catalog: 1,
  org: 2,
} as const;

/** `beepos.persist.<orgId>.<slice>`: one chain's data can never be read as another's. */
function scoped(slice: string): string {
  return `beepos.persist.${ORG_SCOPE}.${slice}`;
}

const KEY = {
  session: scoped('session'),
  carts: scoped('carts'),
  orders: scoped('orders'),
  inventory: scoped('inventory'),
  customers: scoped('customers'),
  catalog: scoped('catalog'),
  // The chain itself and the device preferences are not scoped: the first is what defines the
  // scope, and theme, language and density belong to the device rather than to a chain.
  settings: 'beepos.persist.settings',
  org: 'beepos.persist.org',
} as const;

/** Every persisted key, so a full wipe needs no enumeration API from the platform storage. */
export const PERSISTED_KEYS = [...Object.values(KEY), ACTIVE_ORG_KEY];

const entries: PersistedStore[] = [
  // The issued session, its staff, branch and till: a reload lands back on the sell screen
  // instead of the login form, and a locked till comes back locked rather than open.
  //
  // The signed-in member's PIN is blanked before the slice is written: nothing reads it back
  // off the session (the lock screen checks the org store), so keeping it here only put a
  // working till credential in `localStorage` where any devtools window can read it. The
  // account is written without its credential fields for the same reason.
  persistStore(
    KEY.session,
    useSessionStore,
    (state) => ({
      session: state.session,
      account: state.account ? { ...state.account, passwordHash: '', salt: '' } : null,
      staff: state.staff ? { ...state.staff, pin: '' } : null,
      store: state.store,
      register: state.register,
      storeOptions: state.storeOptions,
      registerOptions: state.registerOptions,
      autoLockMinutes: state.autoLockMinutes,
    }),
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
      organization: state.organization,
      stores: state.stores,
      staff: state.staff,
      registers: state.registers,
      accounts: state.accounts,
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
  const { session, account, staff, store, register, storeOptions, registerOptions } =
    useSessionStore.getState();

  // `reset()` puts its seed slice back synchronously and only then awaits the storage clear,
  // so the session is signed back in inside the same tick it was emptied. Restoring it after
  // the await instead left one render with `staff === null`, and the app-area layout redirects
  // to /login on exactly that: the cashier was thrown off the Settings screen mid-reset and
  // never saw the toast.
  const cleared = entries.map((entry) => entry.reset());
  if (staff && store) {
    useSessionStore.setState({ session, account, staff, store, register, storeOptions, registerOptions });
  }

  await Promise.all(cleared);
  await clearPreferences();
  useSettingsStore.setState({ sidebarCollapsed: false });
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
