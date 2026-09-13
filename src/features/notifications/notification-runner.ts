/**
 * Keeps the notification centre in step with the data it reports on.
 *
 * The rules in `src/domain/notify.ts` are a pure function of stock, lots, shifts, the ledger
 * and the purchase orders, so there is nothing to push: the runner re-computes them once the
 * app is up and again whenever one of those slices changes. Ids are derived from the subject,
 * so re-running is idempotent and a row that was read stays read
 * (`mergeNotifications`).
 *
 * The recompute is debounced because receiving a delivery writes stock, costs and the receipt
 * in three separate store updates, and running five rules over the whole catalogue three times
 * in a frame is work nobody asked for.
 */

import { useEffect, useRef } from 'react';
import { useCatalogStore } from '../../data/catalog-store';
import { useCustomerStore } from '../../data/customer-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useLedgerStore } from '../../data/ledger-store';
import { useLotStore } from '../../data/lot-store';
import { useNotificationStore } from '../../data/notification-store';
import { useOrderStore } from '../../data/order-store';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { usePurchasingStore } from '../../data/purchasing-store';
import { useSessionStore } from '../../data/session-store';
import { useSupplierStore } from '../../data/supplier-store';
import { useSettingsStore } from '../../data/settings-store';
import { t as translate } from '../../i18n';
import { notificationLabels } from './lib/notification-presentation';

/** Rows one rule may raise. Enough to be useful, few enough that one bad count cannot flood. */
const LIMIT_PER_RULE = 5;

/** How long the runner waits for a burst of store writes to settle. */
const DEBOUNCE_MS = 400;

/** Every slice a rule reads. Subscribed to as a list so adding a rule is one line here. */
const SOURCES = [
  useCatalogStore,
  useCustomerStore,
  useInventoryStore,
  useLedgerStore,
  useLotStore,
  useOrderStore,
  useOrgStore,
  usePurchasingStore,
  useSupplierStore,
] as const;

/** Recomputes now, against the current state of every source. */
export function refreshNotifications(locale: 'vi' | 'en'): void {
  useNotificationStore.getState().refresh({
    orgId: currentOrgId(),
    now: new Date(),
    labels: notificationLabels((key) => translate(key, locale)),
    products: useCatalogStore.getState().products,
    stores: useOrgStore.getState().stores,
    stockLevels: useInventoryStore.getState().stockLevels,
    lots: useLotStore.getState().lots,
    shifts: useOrderStore.getState().shifts,
    ledgerEntries: useLedgerStore.getState().entries,
    customers: useCustomerStore.getState().customers,
    purchaseOrders: usePurchasingStore.getState().purchaseOrders,
    suppliers: useSupplierStore.getState().suppliers,
    limitPerRule: LIMIT_PER_RULE,
  });
}

/**
 * Registered once, from the app shell, so every screen behind the sign-in shares one runner.
 * Mounting it in a screen instead would restart the subscriptions on every navigation.
 */
export function useNotificationRunner(): void {
  const locale = useSettingsStore((state) => state.locale);
  const signedIn = useSessionStore((state) => state.session !== null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!signedIn) return undefined;

    function schedule() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        try {
          refreshNotifications(locale);
        } catch (cause) {
          // A rule that throws must not take the shell down with it: the bell simply keeps
          // showing what it had.
          console.warn('[notifications] refresh failed:', cause);
        }
      }, DEBOUNCE_MS);
    }

    schedule();
    const unsubscribes = SOURCES.map((store) => store.subscribe(schedule));

    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [locale, signedIn]);
}
