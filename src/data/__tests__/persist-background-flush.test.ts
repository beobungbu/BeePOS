/**
 * The native counterpart of the web `pagehide` flush: a store must write its debounced change
 * when the app leaves the foreground, because the process can be killed from the app switcher
 * without any further notice.
 *
 * The AppState listener is installed by the first `persistStore` call, so the spy has to be in
 * place before this file creates one.
 */
import { AppState, Platform, type AppStateStatus } from 'react-native';

type Listener = (status: AppStateStatus) => void;

const listeners = new Set<Listener>();
const addEventListener = jest
  .spyOn(AppState, 'addEventListener')
  .mockImplementation((_type: string, handler: Listener) => {
    listeners.add(handler);
    return {
      remove: () => {
        listeners.delete(handler);
      },
    } as ReturnType<typeof AppState.addEventListener>;
  });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { persistStore, parseSlice } = require('../persist') as typeof import('../persist');

interface Counter {
  count: number;
  bump(): void;
}

function makeStore() {
  let state: Counter = {
    count: 0,
    bump: () => {
      state = { ...state, count: state.count + 1 };
      for (const listener of subscribers) listener(state, state);
    },
  };
  const subscribers = new Set<(next: Counter, previous: Counter) => void>();
  return {
    getState: () => state,
    setState: (partial: Partial<Counter>) => {
      state = { ...state, ...partial };
      for (const listener of subscribers) listener(state, state);
    },
    subscribe: (listener: (next: Counter, previous: Counter) => void) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    map,
    storage: {
      getItem: async (key: string) => map.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        map.set(key, value);
      },
      removeItem: async (key: string) => {
        map.delete(key);
      },
    },
  };
}

const pick = (state: Counter) => ({ count: state.count });

async function emit(status: AppStateStatus): Promise<void> {
  for (const listener of [...listeners]) listener(status);
  await Promise.resolve();
  await Promise.resolve();
}

describe('background flush', () => {
  it('subscribes to AppState once, on native, however many stores register', () => {
    // Guard rather than assume: the web build keeps using `pagehide`.
    expect(Platform.OS).not.toBe('web');
    const { storage } = fakeStorage();
    const one = persistStore('one', makeStore(), pick, 1, { storage, debounceMs: 10_000 });
    const two = persistStore('two', makeStore(), pick, 1, { storage, debounceMs: 10_000 });

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener.mock.calls[0][0]).toBe('change');
    expect(listeners.size).toBe(1);

    one.stop();
    two.stop();
  });

  it.each(['background', 'inactive'] as AppStateStatus[])(
    'writes the debounced change when the app goes %s',
    async (status) => {
      const store = makeStore();
      const { storage, map } = fakeStorage();
      const persisted = persistStore('bg', store, pick, 1, { storage, debounceMs: 10_000 });
      await persisted.hydrate();

      store.getState().bump();
      expect(map.get('bg')).toBeUndefined();

      await emit(status);

      expect(parseSlice(map.get('bg') ?? null, 1)?.count).toBe(1);
      persisted.stop();
    },
  );

  it('ignores a return to the foreground', async () => {
    const store = makeStore();
    const { storage, map } = fakeStorage();
    const persisted = persistStore('fg', store, pick, 1, { storage, debounceMs: 10_000 });
    await persisted.hydrate();

    store.getState().bump();
    await emit('active');

    expect(map.get('fg')).toBeUndefined();
    persisted.stop();
  });

  it('flushes every registered store and drops the ones that stopped', async () => {
    const first = makeStore();
    const second = makeStore();
    const a = fakeStorage();
    const b = fakeStorage();
    const persistedA = persistStore('a', first, pick, 1, { storage: a.storage, debounceMs: 10_000 });
    const persistedB = persistStore('b', second, pick, 1, { storage: b.storage, debounceMs: 10_000 });
    await Promise.all([persistedA.hydrate(), persistedB.hydrate()]);

    first.getState().bump();
    second.getState().bump();
    persistedB.stop();
    await emit('background');

    expect(parseSlice(a.map.get('a') ?? null, 1)?.count).toBe(1);
    expect(b.map.get('b')).toBeUndefined();
    persistedA.stop();
  });

  it('survives a storage that rejects', async () => {
    const store = makeStore();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('disk full');
      },
      removeItem: async () => undefined,
    };
    const persisted = persistStore('boom', store, pick, 1, { storage, debounceMs: 10_000 });
    await persisted.hydrate();

    store.getState().bump();
    await expect(emit('background')).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    persisted.stop();
    warn.mockRestore();
  });

  it('removes the subscription once the last store stops', async () => {
    const store = makeStore();
    const { storage } = fakeStorage();
    const persisted = persistStore('last', store, pick, 1, { storage, debounceMs: 10_000 });
    await persisted.hydrate();

    persisted.stop();

    expect(listeners.size).toBe(0);
  });
});
