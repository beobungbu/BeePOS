/**
 * Small key/value store for UI preferences that must outlive a page reload.
 *
 * Reads are synchronous because stores read a preference while they are being created. Web
 * reads `localStorage` directly; native keeps the value in module memory and mirrors it to the
 * async device storage, so `hydratePreferences()` (awaited by the persistence bootstrap before
 * the UI renders) is what makes a native preference survive a relaunch.
 */
import { Platform } from 'react-native';
import { getPlatformStorage } from '../data/persist';

const memory = new Map<string, string>();

/**
 * Every preference key, so the native hydration can read them back without an enumeration API
 * and `clearPreferences()` knows what to drop.
 */
const PREFERENCE_KEYS = ['beepos.sidebar-collapsed'] as const;

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode or a blocked-storage policy: fall back to memory rather than throwing.
    return null;
  }
}

export function readPreference(key: string): string | null {
  const storage = webStorage();
  if (!storage) return memory.get(key) ?? null;
  try {
    return storage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writePreference(key: string, value: string): void {
  memory.set(key, value);
  const storage = webStorage();
  if (!storage) {
    if (Platform.OS !== 'web') void getPlatformStorage().setItem(key, value);
    return;
  }
  try {
    storage.setItem(key, value);
  } catch {
    // The memory copy above already holds the value for this session.
  }
}

/**
 * Native only: pulls the saved preferences into the synchronous memory map. On web the values
 * are already readable from `localStorage`, so this resolves without touching storage.
 */
export async function hydratePreferences(): Promise<void> {
  if (Platform.OS === 'web') return;
  const storage = getPlatformStorage();
  await Promise.all(
    PREFERENCE_KEYS.map(async (key) => {
      const value = await storage.getItem(key);
      if (value !== null) memory.set(key, value);
    }),
  );
}

/** Drops every stored preference. Used by the "reset demo data" action. */
export async function clearPreferences(): Promise<void> {
  const storage = getPlatformStorage();
  for (const key of PREFERENCE_KEYS) memory.delete(key);
  await Promise.all(PREFERENCE_KEYS.map((key) => storage.removeItem(key)));
}

export function readBooleanPreference(key: string, fallback: boolean): boolean {
  const raw = readPreference(key);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

export function writeBooleanPreference(key: string, value: boolean): void {
  writePreference(key, value ? 'true' : 'false');
}
