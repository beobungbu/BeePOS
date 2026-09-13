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
import { ACTIVE_ORG_KEY, activeOrgId, loadActiveOrgId } from './active-org';
import { useAuditStore } from './audit-store';
import { useCartStore } from './cart-store';
import { useCashMovementStore } from './cash-movement-store';
import { useCatalogStore } from './catalog-store';
import { useCustomerStore } from './customer-store';
import { useInventoryStore } from './inventory-store';
import { useOrderStore } from './order-store';
import { seedForActiveOrg, useOrgStore } from './org-store';
import { useSessionStore } from './session-store';
import { useStorePriceStore } from './store-price-store';
import { useSupplierStore } from './supplier-store';
import { useCostingStore } from './costing-store';
import { useLedgerStore } from './ledger-store';
import { useLotStore } from './lot-store';
import { useNotificationStore } from './notification-store';
import { useOrgSettingsStore } from './org-settings-store';
import { usePricingStore } from './pricing-store';
import { usePurchasingStore } from './purchasing-store';
import { useReturnsStore } from './returns-store';
import { SIDEBAR_COLLAPSED_KEY, useSettingsStore } from './settings-store';

/**
 * The chain whose data these keys address, resolved in `active-org.ts` before any slice is
 * registered. A chain created through onboarding, or switched to from the avatar menu, writes
 * its id there and starts from its own storage instead of inheriting the seeded chain's
 * catalogue, orders and stock.
 *
 * On web the scope is known at import, so the slices are registered and read synchronously,
 * as before. Native storage answers only asynchronously, so there registration waits for
 * `runHydration()`: the scope is read, the chain's own seed is put into the org store, and
 * only then are the keys built. Registering at import instead would key every slice to the
 * demo chain and silently ignore a switch.
 */

/** Bump a version when the matching slice changes shape; the old copy is then dropped on boot. */
const VERSION = {
  session: 2,
  settings: 1,
  carts: 1,
  // 2: order lines carry a cost snapshot and a price source, orders carry a channel, and the
  // slice now holds delivery notes.
  orders: 2,
  inventory: 1,
  // 2: customers carry a type and the B2B fields.
  // 3: the billing address moved from the profile extras onto `Customer` itself, so a v2 copy
  // would keep an address the form no longer reads.
  customers: 3,
  // 2: products carry selling units, extra barcodes, a minimum order qty and the lot flag.
  catalog: 2,
  // 3: the chain carries a tax code, and the slice is now scoped per chain (see `KEY.org`),
  // so a v2 copy under the old unscoped key belongs to whichever chain happened to write it.
  org: 3,
  suppliers: 1,
  storePrices: 1,
  cash: 1,
  audit: 1,
  pricing: 1,
  ledger: 1,
  costing: 1,
  returns: 1,
  purchasing: 1,
  lots: 1,
  orgSettings: 1,
  notifications: 1,
} as const;

/** `beepos.persist.<orgId>.<slice>`: one chain's data can never be read as another's. */
function scoped(slice: string): string {
  return `beepos.persist.${activeOrgId()}.${slice}`;
}

function keysForActiveOrg() {
  return {
    session: scoped('session'),
    carts: scoped('carts'),
    orders: scoped('orders'),
    inventory: scoped('inventory'),
    customers: scoped('customers'),
    catalog: scoped('catalog'),
    suppliers: scoped('suppliers'),
    storePrices: scoped('store-prices'),
    cash: scoped('cash'),
    audit: scoped('audit'),
    pricing: scoped('pricing'),
    ledger: scoped('ledger'),
    costing: scoped('costing'),
    returns: scoped('returns'),
    purchasing: scoped('purchasing'),
    lots: scoped('lots'),
    orgSettings: scoped('org-settings'),
    notifications: scoped('notifications'),
    // Device preferences are not scoped: theme, language and density belong to the device rather
    // than to a chain. The chain slice itself is, because each chain has its own shops, staff
    // and credentials; only the pointer at the active chain lives outside the scope.
    settings: 'beepos.persist.settings',
    org: scoped('org'),
  } as const;
}

/** Every persisted key, so a full wipe needs no enumeration API from the platform storage. */
export function persistedKeys(): string[] {
  return [...Object.values(keysForActiveOrg()), ACTIVE_ORG_KEY];
}

function buildEntries(): PersistedStore[] {
  const KEY = keysForActiveOrg();
  return [
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
        deliveryNotes: state.deliveryNotes,
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
      KEY.suppliers,
      useSupplierStore,
      (state) => ({ suppliers: state.suppliers }),
      VERSION.suppliers,
    ),
    persistStore(
      KEY.storePrices,
      useStorePriceStore,
      (state) => ({ prices: state.prices }),
      VERSION.storePrices,
    ),
    // Cash in and out during a shift, plus the free-text note each entry was saved with. A
    // drawer entry that a reload loses is a drawer that cannot be reconciled at close.
    persistStore(
      KEY.cash,
      useCashMovementStore,
      (state) => ({ movements: state.movements, notes: state.notes }),
      VERSION.cash,
    ),
    // The log is append-only and is the record of who did what; it has to outlive a reload or
    // it is not a log.
    persistStore(KEY.audit, useAuditStore, (state) => ({ events: state.events }), VERSION.audit),
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
    // What a buyer pays: groups, lists, rules, promotions and the loyalty maths. Editing a
    // price list has to outlive a reload or the screen is a demo of a form, not of a price.
    persistStore(
      KEY.pricing,
      usePricingStore,
      (state) => ({
        customerGroups: state.customerGroups,
        priceLists: state.priceLists,
        priceRules: state.priceRules,
        promotions: state.promotions,
        loyaltyRule: state.loyaltyRule,
      }),
      VERSION.pricing,
    ),
    // Receivables, payables, the bank and the cash book. A collection that a reload loses is a
    // customer who is still shown as owing money they have paid.
    persistStore(
      KEY.ledger,
      useLedgerStore,
      (state) => ({
        entries: state.entries,
        bankAccounts: state.bankAccounts,
        cashBook: state.cashBook,
      }),
      VERSION.ledger,
    ),
    persistStore(
      KEY.costing,
      useCostingStore,
      (state) => ({ history: state.history }),
      VERSION.costing,
    ),
    persistStore(
      KEY.returns,
      useReturnsStore,
      (state) => ({ returns: state.returns, writeOffs: state.writeOffs }),
      VERSION.returns,
    ),
    persistStore(
      KEY.purchasing,
      usePurchasingStore,
      (state) => ({
        purchaseOrders: state.purchaseOrders,
        supplierReturns: state.supplierReturns,
      }),
      VERSION.purchasing,
    ),
    persistStore(KEY.lots, useLotStore, (state) => ({ lots: state.lots }), VERSION.lots),
    persistStore(
      KEY.orgSettings,
      useOrgSettingsStore,
      (state) => ({
        storeSettings: state.storeSettings,
        memberships: state.memberships,
        orgDirectory: state.orgDirectory,
      }),
      VERSION.orgSettings,
    ),
    // Read marks are the state worth keeping here: the rows themselves are recomputed from the
    // other slices, but which of them the owner has already seen is not derivable.
    persistStore(
      KEY.notifications,
      useNotificationStore,
      (state) => ({ notifications: state.notifications }),
      VERSION.notifications,
    ),
  ];
}

let hydration: Promise<void> | null = null;
let hydrated = false;

/** The registered slices. Empty until the chain scope their keys are built from is known. */
let entries: PersistedStore[] = [];

function registerSlices(): void {
  if (entries.length === 0) entries = buildEntries();
}

/**
 * Web only: `localStorage` answers without a turn of the event loop, so the stores are filled
 * at import time and the first frame is already the saved session, theme and open orders.
 * Native storage is async, so there the boot goes through `hydrateAll()` and the gate below.
 */
function hydrateSyncAll(): boolean {
  const done = entries.map((entry) => entry.hydrateSync());
  return done.length > 0 && done.every(Boolean);
}

if (getPlatformStorage().getItemSync) {
  registerSlices();
  if (hydrateSyncAll()) {
    hydrated = true;
    hydration = Promise.resolve();
  }
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
    if (entries.length === 0) {
      // Native: the stored chain is only readable asynchronously, so it is resolved here,
      // before a key or a seed is derived from it. The org store was created on the demo
      // chain's seed at import; the chain actually in use puts its own shops, staff and
      // credentials back before the slices are registered and read.
      await loadActiveOrgId();
      useOrgStore.setState(seedForActiveOrg());
      registerSlices();
    }
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
