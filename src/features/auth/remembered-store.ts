/**
 * "Ghi nhớ cửa hàng này": the last store code the cashier signed in with, used to prefill
 * the login field and to mark the recent branch on `/select-store`.
 *
 * Web keeps it in `localStorage` so a reload still remembers the till's own branch. Native
 * has no storage dependency in this prototype, so it lives in module memory for the session
 * and is gone on relaunch; nothing in the UI claims otherwise.
 */
import { Platform } from 'react-native';

const STORAGE_KEY = 'beepos.remembered-store-code';

let inMemoryCode: string | null = null;

function webStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode or a blocked-storage policy: fall back to memory rather than throwing.
    return null;
  }
}

export function getRememberedStoreCode(): string | null {
  const storage = webStorage();
  if (!storage) return inMemoryCode;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return inMemoryCode;
  }
}

export function setRememberedStoreCode(code: string | null): void {
  inMemoryCode = code;
  const storage = webStorage();
  if (!storage) return;
  try {
    if (code) storage.setItem(STORAGE_KEY, code);
    else storage.removeItem(STORAGE_KEY);
  } catch {
    // Memory copy above already holds the value for this session.
  }
}
