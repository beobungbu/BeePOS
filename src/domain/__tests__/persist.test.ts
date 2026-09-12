import { createStore } from 'zustand/vanilla';
import { useCatalogStore } from '../../data/catalog-store';
import { useSettingsStore } from '../../data/settings-store';
import { flushAll, hydrateAll, resetDemoData } from '../../data/persistence-bootstrap';
import {
  isCompatibleSlice,
  parseSlice,
  persistStore,
  serialiseSlice,
  type PersistStorage,
} from '../../data/persist';

interface Counter {
  count: number;
  label: string;
  transient: number;
  startedAt: Date;
  bump: () => void;
}

/** Storage double: synchronous map behind the async surface, with call counters. */
function fakeStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  const writes: string[] = [];
  const storage: PersistStorage = {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      writes.push(key);
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
  return { storage, map, writes };
}

function makeStore() {
  return createStore<Counter>((set) => ({
    count: 0,
    label: 'seed',
    transient: 0,
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    bump: () => set((state) => ({ count: state.count + 1 })),
  }));
}

const pick = (state: Counter) => ({
  count: state.count,
  label: state.label,
  startedAt: state.startedAt,
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('serialiseSlice / parseSlice', () => {
  it('revives Date values written as ISO strings', () => {
    const raw = serialiseSlice({ at: new Date('2026-03-04T05:06:07.000Z'), n: 2 }, 1);
    expect(raw).toContain('2026-03-04T05:06:07.000Z');

    const slice = parseSlice(raw, 1);
    expect(slice?.at).toBeInstanceOf(Date);
    expect((slice?.at as Date).toISOString()).toBe('2026-03-04T05:06:07.000Z');
    expect(slice?.n).toBe(2);
  });

  it('discards a slice written by another schema version', () => {
    const raw = serialiseSlice({ count: 3 }, 1);
    expect(parseSlice(raw, 2)).toBeNull();
  });

  it('discards unreadable or malformed payloads', () => {
    expect(parseSlice(null, 1)).toBeNull();
    expect(parseSlice('', 1)).toBeNull();
    expect(parseSlice('{not json', 1)).toBeNull();
    expect(parseSlice('[]', 1)).toBeNull();
    expect(parseSlice('{"v":"1","s":{}}', 1)).toBeNull();
    expect(parseSlice('{"v":1}', 1)).toBeNull();
  });
});

describe('isCompatibleSlice', () => {
  const reference = { list: [1], map: { a: 1 }, flag: true, staff: null };

  it('accepts a slice whose keys keep their shape', () => {
    expect(isCompatibleSlice(reference, { list: [2, 3], flag: false })).toBe(true);
    // null in either position is allowed: optional state is null until it is filled in.
    expect(isCompatibleSlice(reference, { staff: { id: 'st-1' } })).toBe(true);
  });

  it('rejects unknown keys, swapped containers and swapped primitives', () => {
    expect(isCompatibleSlice(reference, { gone: 1 })).toBe(false);
    expect(isCompatibleSlice(reference, { list: { a: 1 } })).toBe(false);
    expect(isCompatibleSlice(reference, { map: [1] })).toBe(false);
    expect(isCompatibleSlice(reference, { flag: 'true' })).toBe(false);
    expect(isCompatibleSlice(reference, {})).toBe(false);
  });
});

describe('persistStore', () => {
  it('writes only the picked slice, once per debounce window', async () => {
    const store = makeStore();
    const { storage, map, writes } = fakeStorage();
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();
    store.getState().bump();
    store.getState().bump();
    store.setState({ transient: 9 });
    await settle();

    expect(writes).toEqual(['k']);
    const slice = parseSlice(map.get('k') ?? null, 1);
    expect(slice).toEqual({ count: 2, label: 'seed', startedAt: new Date('2026-01-01T00:00:00.000Z') });
    expect(slice).not.toHaveProperty('transient');
    expect(slice).not.toHaveProperty('bump');
    persisted.stop();
  });

  it('does not write before hydration has read the stored slice', async () => {
    const store = makeStore();
    const { storage, writes } = fakeStorage();
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    store.getState().bump();
    await settle();
    expect(writes).toEqual([]);
    persisted.stop();
  });

  it('hydrates a stored slice into the store and revives its dates', async () => {
    const store = makeStore();
    const stored = serialiseSlice(
      { count: 7, label: 'restored', startedAt: new Date('2026-02-02T00:00:00.000Z') },
      1,
    );
    const { storage } = fakeStorage({ k: stored });
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();

    expect(store.getState().count).toBe(7);
    expect(store.getState().label).toBe('restored');
    expect(store.getState().startedAt).toBeInstanceOf(Date);
    expect(store.getState().startedAt.toISOString()).toBe('2026-02-02T00:00:00.000Z');
    expect(typeof store.getState().bump).toBe('function');
    persisted.stop();
  });

  it('drops a slice stored under an older version and keeps the seed state', async () => {
    const store = makeStore();
    const { storage, map } = fakeStorage({ k: serialiseSlice({ count: 99 }, 1) });
    const persisted = persistStore('k', store, pick, 2, { storage, debounceMs: 5 });

    await persisted.hydrate();

    expect(store.getState().count).toBe(0);
    expect(map.has('k')).toBe(false);
    persisted.stop();
  });

  it('drops a slice whose shape no longer matches the store', async () => {
    const store = makeStore();
    const { storage, map } = fakeStorage({ k: serialiseSlice({ count: [1, 2] }, 1) });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();

    expect(store.getState().count).toBe(0);
    expect(map.has('k')).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    persisted.stop();
  });

  it('survives a storage that throws on read and on write', async () => {
    const store = makeStore();
    const storage: PersistStorage = {
      getItem: async () => {
        throw new Error('read blocked');
      },
      setItem: async () => {
        throw new Error('quota exceeded');
      },
      removeItem: async () => undefined,
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();
    store.getState().bump();
    await persisted.flush();
    await settle();

    expect(store.getState().count).toBe(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    persisted.stop();
  });

  it('flush writes the pending change immediately', async () => {
    const store = makeStore();
    const { storage, map } = fakeStorage();
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 10_000 });

    await persisted.hydrate();
    store.getState().bump();
    await persisted.flush();

    expect(parseSlice(map.get('k') ?? null, 1)?.count).toBe(1);
    persisted.stop();
  });

  it('flushSync writes through a synchronous storage without awaiting', async () => {
    const store = makeStore();
    const map = new Map<string, string>();
    const storage: PersistStorage = {
      getItem: async (key) => map.get(key) ?? null,
      setItem: async (key, value) => {
        map.set(key, value);
      },
      removeItem: async (key) => {
        map.delete(key);
      },
      getItemSync: (key) => map.get(key) ?? null,
      setItemSync: (key, value) => {
        map.set(key, value);
      },
    };
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 10_000 });

    expect(persisted.hydrateSync()).toBe(true);
    store.getState().bump();
    persisted.flushSync();

    expect(parseSlice(map.get('k') ?? null, 1)?.count).toBe(1);
    persisted.stop();
  });

  it('reset restores the slice captured at registration and clears the key', async () => {
    const store = makeStore();
    const { storage, map } = fakeStorage();
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();
    store.setState({ count: 5, label: 'edited' });
    await persisted.flush();
    expect(map.has('k')).toBe(true);

    await persisted.reset();
    await settle();

    expect(store.getState().count).toBe(0);
    expect(store.getState().label).toBe('seed');
    expect(map.has('k')).toBe(false);
    persisted.stop();
  });

  it('bootstrap keeps an edit across a flush and puts the seed back on reset', async () => {
    await hydrateAll();
    const seedCount = useCatalogStore.getState().products.length;
    const first = useCatalogStore.getState().products[0];

    useCatalogStore.getState().removeProduct(first.id);
    useSettingsStore.getState().setTheme('dark');
    await flushAll();
    expect(useCatalogStore.getState().products).toHaveLength(seedCount - 1);

    await resetDemoData();

    expect(useCatalogStore.getState().products).toHaveLength(seedCount);
    expect(useCatalogStore.getState().products[0].id).toBe(first.id);
    expect(useSettingsStore.getState().theme).toBe('system');
  });

  it('stop ends further writes', async () => {
    const store = makeStore();
    const { storage, writes } = fakeStorage();
    const persisted = persistStore('k', store, pick, 1, { storage, debounceMs: 5 });

    await persisted.hydrate();
    persisted.stop();
    store.getState().bump();
    await settle();

    expect(writes).toEqual([]);
  });
});
