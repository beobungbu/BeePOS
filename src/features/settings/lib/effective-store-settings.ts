/**
 * What a branch actually prints and charges: its own setting when it has one, the chain's
 * otherwise.
 *
 * This is the single answer to "which receipt header does HN02 use", and the receipt screen,
 * the Z report and the store settings form all have to give the same one. An empty field on a
 * branch means inherit, never "print nothing", which is why the resolver works on
 * `undefined` rather than on empty strings.
 *
 * `resolveStoreSettings` is pure and is what the tests exercise;
 * `effectiveStoreSettings(orgId, storeId)` is the convenience the screens call, reading the
 * two stores through `getState()` so it works outside a React render as well.
 */

import { useOrgSettingsStore, settingsForStore } from '../../../data/org-settings-store';
import { useSettingsStore } from '../../../data/settings-store';
import type { StoreSettings } from '../../../domain/types';
import { printerNameFor } from './printers';

/** The chain-level values a branch falls back to. */
export interface ChainSettings {
  receiptHeader: string;
  receiptFooter: string;
  /** Fraction, not percent: 0.08 is eight percent, the same shape as the chain setting. */
  taxRate: number;
  openingHours: string;
  printerName?: string;
}

/** Which of the five values the branch set for itself. */
export type StoreSettingField = 'receiptHeader' | 'receiptFooter' | 'taxRate' | 'openingHours' | 'printerName';

export interface EffectiveStoreSettings {
  storeId: string;
  receiptHeader: string;
  receiptFooter: string;
  taxRate: number;
  openingHours: string;
  printerName?: string;
  /** The fields this branch overrides; everything else follows the chain. */
  overrides: StoreSettingField[];
}

/** The chain default for opening hours, used when neither the branch nor the chain says. */
export const DEFAULT_OPENING_HOURS = '08:00 - 21:00';

function overridden(value: string | number | undefined): boolean {
  if (value === undefined) return false;
  return typeof value === 'string' ? value.trim().length > 0 : true;
}

export function resolveStoreSettings(
  storeSettings: readonly StoreSettings[],
  storeId: string,
  chain: ChainSettings,
): EffectiveStoreSettings {
  const own = settingsForStore(storeSettings, storeId);
  const fields: StoreSettingField[] = [
    'receiptHeader',
    'receiptFooter',
    'taxRate',
    'openingHours',
    'printerName',
  ];

  return {
    storeId,
    receiptHeader: overridden(own?.receiptHeader) ? (own?.receiptHeader as string) : chain.receiptHeader,
    receiptFooter: overridden(own?.receiptFooter) ? (own?.receiptFooter as string) : chain.receiptFooter,
    taxRate: overridden(own?.taxRate) ? (own?.taxRate as number) : chain.taxRate,
    openingHours: overridden(own?.openingHours) ? (own?.openingHours as string) : chain.openingHours,
    printerName: overridden(own?.printerName) ? (own?.printerName as string) : chain.printerName,
    overrides: fields.filter((field) => overridden(own?.[field])),
  };
}

/** The chain half of the answer, read off the device settings store. */
export function chainSettings(): ChainSettings {
  const settings = useSettingsStore.getState();
  return {
    receiptHeader: settings.receiptHeader,
    receiptFooter: settings.receiptFooter,
    taxRate: settings.defaultTaxRate,
    openingHours: DEFAULT_OPENING_HOURS,
    printerName: printerNameFor(settings.printerId),
  };
}

/**
 * The values a branch prints and charges with, chain defaults filled in.
 *
 * `orgId` is taken for the call to read as what it is (settings belong to a chain's branch)
 * and to keep the signature stable once more than one chain's settings are in memory at once;
 * the persisted slices are already namespaced per chain, so today it identifies rather than
 * filters.
 */
export function effectiveStoreSettings(orgId: string, storeId: string): EffectiveStoreSettings {
  void orgId;
  return resolveStoreSettings(useOrgSettingsStore.getState().storeSettings, storeId, chainSettings());
}

/** Hook form, for screens that must re-render when either side changes. */
export function useEffectiveStoreSettings(storeId: string): EffectiveStoreSettings {
  const storeSettings = useOrgSettingsStore((state) => state.storeSettings);
  const receiptHeader = useSettingsStore((state) => state.receiptHeader);
  const receiptFooter = useSettingsStore((state) => state.receiptFooter);
  const taxRate = useSettingsStore((state) => state.defaultTaxRate);
  const printerId = useSettingsStore((state) => state.printerId);

  return resolveStoreSettings(storeSettings, storeId, {
    receiptHeader,
    receiptFooter,
    taxRate,
    openingHours: DEFAULT_OPENING_HOURS,
    printerName: printerNameFor(printerId),
  });
}
