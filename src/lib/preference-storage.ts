/**
 * Small key/value store for UI preferences that must outlive a page reload.
 *
 * Web writes `localStorage`, which is what makes "the sidebar stays collapsed after F5" true.
 * Native has no storage dependency in this prototype (the same trade
 * `src/features/auth/remembered-store.ts` documents), so the value lives in module memory for
 * the session and is gone on relaunch; nothing in the UI claims otherwise.
 */
import { Platform } from 'react-native';

const memory = new Map<string, string>();

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
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // The memory copy above already holds the value for this session.
  }
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
