/**
 * Minimal persistence layer for the zustand stores.
 *
 * A registered store keeps a picked slice of its state in device storage (`localStorage` on
 * web, AsyncStorage on native), writes it back at most once per debounce window, and reads it
 * once at boot. Everything stored is app-owned demo data, so the only hard requirements are:
 * a reload must not lose work, a schema change must not resurrect an incompatible slice, and a
 * storage failure must never take the app down with it.
 */
import { AppState, Platform, type AppStateStatus, type NativeEventSubscription } from 'react-native';

/** The async key/value surface both platforms are adapted to. */
export interface PersistStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  /**
   * Only web `localStorage` can answer a read without a turn of the event loop. When it is
   * there the stores are filled before the first render, which is what keeps the web app from
   * flashing the seed catalogue or the default theme on reload.
   */
  getItemSync?(key: string): string | null;
  /**
   * Synchronous write, again web only. A page that is being unloaded has no time left for a
   * promise, so this is what keeps the last 300 ms of work (a login, a scanned line) from
   * being lost when the cashier reloads straight after it.
   */
  setItemSync?(key: string, value: string): void;
}

export interface PersistOptions {
  /** Storage double for tests; defaults to the platform storage. */
  storage?: PersistStorage;
  /** Write debounce window in ms. */
  debounceMs?: number;
}

/** Handle returned per registered store; `persistence-bootstrap.ts` drives these. */
export interface PersistedStore {
  readonly key: string;
  /** Reads the slice back into the store. Idempotent: a later call is a no-op. */
  hydrate(): Promise<void>;
  /**
   * Same as `hydrate()` without awaiting, for storages that can read synchronously. Returns
   * `false` (and changes nothing) when the storage has no synchronous read.
   */
  hydrateSync(): boolean;
  /** Writes any pending change immediately. */
  flush(): Promise<void>;
  /** Same, without awaiting: for `pagehide`, where nothing async is allowed to finish. */
  flushSync(): void;
  /** Restores the slice captured at registration (the seed state) and drops the stored copy. */
  reset(): Promise<void>;
  /** Stops writing. Used by tests; the app keeps its stores for the whole session. */
  stop(): void;
}

/** The subset of a zustand store this module needs, so tests can pass a plain store. */
export interface StoreLike<T> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: (state: T, previous: T) => void): () => void;
}

interface Envelope {
  v: number;
  s: Record<string, unknown>;
}

const DATE_TAG = '__beepos_date';

interface DateBox {
  [DATE_TAG]: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * `JSON.stringify` calls `Date.prototype.toJSON` before the replacer sees the value, so the
 * replacer reads the raw value off the holder instead of trusting its argument.
 */
function dateReplacer(this: Record<string, unknown>, key: string, value: unknown): unknown {
  const raw = this[key];
  if (raw instanceof Date) {
    const box: DateBox = { [DATE_TAG]: Number.isNaN(raw.getTime()) ? '' : raw.toISOString() };
    return box;
  }
  return value;
}

function dateReviver(_key: string, value: unknown): unknown {
  if (isPlainObject(value) && typeof value[DATE_TAG] === 'string') {
    return new Date(value[DATE_TAG] as string);
  }
  return value;
}

export function serialiseSlice(slice: unknown, version: number): string {
  return JSON.stringify({ v: version, s: slice }, dateReplacer);
}

/**
 * Parses an envelope written by `serialiseSlice`. Returns `null` for anything that is not a
 * well-formed envelope of the expected version: unreadable, hand-edited or stale slices are
 * discarded rather than merged into a store.
 */
export function parseSlice(raw: string | null, version: number): Record<string, unknown> | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, dateReviver);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  const envelope = parsed as Partial<Envelope>;
  if (typeof envelope.v !== 'number' || envelope.v !== version) return null;
  if (!isPlainObject(envelope.s)) return null;
  return envelope.s;
}

/**
 * Shallow structural check of a stored slice against the shape the store started with:
 * array stays array, object stays object, primitive keeps its type (null is allowed either
 * way, since optional state such as `staff` is `null` until login). Unknown keys are rejected
 * so a renamed field cannot smuggle dead state back in.
 */
export function isCompatibleSlice(
  reference: Record<string, unknown>,
  candidate: Record<string, unknown>,
): boolean {
  const keys = Object.keys(candidate);
  if (keys.length === 0) return false;
  for (const key of keys) {
    if (!(key in reference)) return false;
    const expected = reference[key];
    const actual = candidate[key];
    if (expected === null || expected === undefined || actual === null || actual === undefined) continue;
    if (Array.isArray(expected) !== Array.isArray(actual)) return false;
    if (typeof expected !== typeof actual) return false;
  }
  return true;
}

/** In-memory storage, used on web when `localStorage` is unavailable and by tests. */
export function createMemoryStorage(): PersistStorage {
  const map = new Map<string, string>();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

function webStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode or a blocked-storage policy.
    return null;
  }
}

const memoryFallback = createMemoryStorage();

function createWebStorage(): PersistStorage {
  return {
    getItemSync: (key) => {
      const storage = webStorage();
      if (!storage) return null;
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    getItem: async (key) => {
      const storage = webStorage();
      if (!storage) return memoryFallback.getItem(key);
      try {
        return storage.getItem(key);
      } catch {
        return memoryFallback.getItem(key);
      }
    },
    setItemSync: (key, value) => {
      const storage = webStorage();
      if (!storage) {
        void memoryFallback.setItem(key, value);
        return;
      }
      try {
        storage.setItem(key, value);
      } catch (error) {
        // Quota exceeded or a blocked-storage policy: the session keeps running unpersisted.
        console.warn(`[persist] could not write "${key}":`, error);
      }
    },
    setItem: async (key, value) => {
      const storage = webStorage();
      if (!storage) return memoryFallback.setItem(key, value);
      try {
        storage.setItem(key, value);
      } catch (error) {
        console.warn(`[persist] could not write "${key}":`, error);
      }
    },
    removeItem: async (key) => {
      const storage = webStorage();
      if (!storage) return memoryFallback.removeItem(key);
      try {
        storage.removeItem(key);
      } catch (error) {
        console.warn(`[persist] could not clear "${key}":`, error);
      }
    },
  };
}

function createNativeStorage(): PersistStorage {
  // Resolved once, eagerly: a test runner or a bare Node context has no native module, and the
  // in-memory fallback must then behave like storage rather than reject on every call.
  let target: PersistStorage = memoryFallback;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    target = require('@react-native-async-storage/async-storage').default as PersistStorage;
  } catch (error) {
    // Silent under the test runner, where "no native module" is the expected state and the
    // in-memory fallback is what the suites exercise; on a device it is worth reporting.
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[persist] AsyncStorage unavailable, staying in memory:', error);
    }
  }

  return {
    getItem: async (key) => {
      try {
        return (await target.getItem(key)) ?? null;
      } catch (error) {
        console.warn(`[persist] could not read "${key}":`, error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        await target.setItem(key, value);
      } catch (error) {
        console.warn(`[persist] could not write "${key}":`, error);
      }
    },
    removeItem: async (key) => {
      try {
        await target.removeItem(key);
      } catch (error) {
        console.warn(`[persist] could not clear "${key}":`, error);
      }
    },
  };
}

let platformStorage: PersistStorage | null = null;

/** The storage the app uses: `localStorage` on web, AsyncStorage on native. */
export function getPlatformStorage(): PersistStorage {
  if (!platformStorage) {
    platformStorage = Platform.OS === 'web' ? createWebStorage() : createNativeStorage();
  }
  return platformStorage;
}

/**
 * Native has no `pagehide`. The last notice an app gets before it can be killed from the app
 * switcher or reclaimed for memory is the `AppState` change to `inactive` / `background`, so
 * that is where the debounced writes have to be turned into real ones. Without it a change
 * made inside the 300 ms window (a scanned line, a login) is lost with the process.
 *
 * The registry holds every store `persistStore` created; `stop()` takes it back out, and the
 * subscription only exists while at least one store is registered.
 */
const registered = new Set<PersistedStore>();
let appStateSubscription: NativeEventSubscription | null = null;

/** Writes the pending change of every registered store. One failing store never stops another. */
export function flushRegisteredStores(): Promise<void> {
  const writes = [...registered].map(async (entry) => {
    try {
      await entry.flush();
    } catch (error) {
      console.warn(`[persist] background flush failed for "${entry.key}":`, error);
    }
  });
  return Promise.all(writes).then(() => undefined);
}

function onAppStateChange(status: AppStateStatus): void {
  // `inactive` is the iOS app-switcher / Control-Centre state and comes before `background`;
  // flushing on both costs nothing, because a write with an unchanged payload is skipped.
  if (status !== 'background' && status !== 'inactive') return;
  void flushRegisteredStores();
}

function watchAppState(): void {
  // Web already flushes through `pagehide` in the persistence bootstrap; adding an AppState
  // listener there would duplicate it (react-native-web maps AppState onto visibilitychange).
  if (appStateSubscription || Platform.OS === 'web') return;
  if (typeof AppState?.addEventListener !== 'function') return;
  appStateSubscription = AppState.addEventListener('change', onAppStateChange);
}

function unwatchAppStateWhenIdle(): void {
  if (registered.size > 0 || !appStateSubscription) return;
  appStateSubscription.remove();
  appStateSubscription = null;
}

/**
 * Subscribes to `store` and keeps `pick(state)` in storage under `key`.
 *
 * Writes start only after `hydrate()` has run, so a slow storage read can never be overwritten
 * by the seed state it is about to replace.
 */
export function persistStore<T extends object, S extends Partial<T>>(
  key: string,
  store: StoreLike<T>,
  pick: (state: T) => S,
  version: number,
  options: PersistOptions = {},
): PersistedStore {
  const storage = options.storage ?? getPlatformStorage();
  const debounceMs = options.debounceMs ?? 300;
  /** The slice as it was before any user edit: what `reset()` puts back. */
  const seedSlice = pick(store.getState());

  let ready = false;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastWritten: string | null = null;
  let pending: Promise<void> = Promise.resolve();

  function write(): Promise<void> {
    if (stopped) return Promise.resolve();
    const payload = serialiseSlice(pick(store.getState()), version);
    if (payload === lastWritten) return Promise.resolve();
    lastWritten = payload;
    pending = storage.setItem(key, payload).catch((error: unknown) => {
      console.warn(`[persist] could not write "${key}":`, error);
    });
    return pending;
  }

  function schedule(): void {
    if (!ready || stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void write();
    }, debounceMs);
  }

  const unsubscribe = store.subscribe(schedule);

  function discard(): Promise<void> {
    return storage.removeItem(key).catch(() => undefined);
  }

  /** Applies a raw payload to the store and opens the write path. */
  function consume(raw: string | null): Promise<void> {
    const slice = parseSlice(raw, version);
    let dropped: Promise<void> = Promise.resolve();

    if (raw && !slice) {
      // Stale version or unreadable payload: drop it instead of leaving it to fail again.
      dropped = discard();
    } else if (slice && isCompatibleSlice(seedSlice as Record<string, unknown>, slice)) {
      store.setState(slice as Partial<T>);
      lastWritten = serialiseSlice(pick(store.getState()), version);
    } else if (slice) {
      console.warn(`[persist] discarded incompatible slice for "${key}"`);
      dropped = discard();
    }

    ready = true;
    return dropped;
  }

  const handle: PersistedStore = {
    key,

    async hydrate() {
      if (ready) return;
      let raw: string | null = null;
      try {
        raw = await storage.getItem(key);
      } catch (error) {
        console.warn(`[persist] could not read "${key}":`, error);
      }
      await consume(raw);
    },

    hydrateSync() {
      if (!storage.getItemSync) return false;
      if (ready) return true;
      let raw: string | null = null;
      try {
        raw = storage.getItemSync(key);
      } catch (error) {
        console.warn(`[persist] could not read "${key}":`, error);
      }
      void consume(raw);
      return true;
    },

    async flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        await write();
      }
      await pending;
    },

    flushSync() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!ready || stopped) return;
      const setItemSync = storage.setItemSync;
      if (!setItemSync) {
        void write();
        return;
      }
      const payload = serialiseSlice(pick(store.getState()), version);
      if (payload === lastWritten) return;
      lastWritten = payload;
      setItemSync(key, payload);
    },

    async reset() {
      store.setState({ ...(seedSlice as Partial<T>) });
      // The setState above queued a write through the subscription; drop it so the key stays
      // cleared until the next real edit.
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastWritten = serialiseSlice(pick(store.getState()), version);
      await storage.removeItem(key).catch((error: unknown) => {
        console.warn(`[persist] could not clear "${key}":`, error);
      });
    },

    stop() {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      unsubscribe();
      registered.delete(handle);
      unwatchAppStateWhenIdle();
    },
  };

  registered.add(handle);
  watchAppState();
  return handle;
}
