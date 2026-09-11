// Shared helpers for phase-07 Worker A behavior-claim tests.
//
// react-test-renderer's `findByType(X)` matches by strict reference equality
// on `X`. That fails for react-native's own primitives (Pressable, View,
// TextInput, ActivityIndicator, ...) here: the installed @beemvp/beeui-ui
// build and this test file each resolve their own 'react-native' import
// through Jest's module graph, and for at least `Pressable` the two
// resolved values are not reference-equal even though they render
// identically and share the same `displayName`/`name` (verified empirically
// while building this harness — `findByType(Pressable)` reports "No
// instances found" while a display-name search finds the exact same node).
// Matching by displayName/name sidesteps that entirely and is what every
// claim test in this directory uses instead of `findByType` for RN
// primitives.
import type { ReactTestInstance } from 'react-test-renderer';

export function findByDisplayName(root: ReactTestInstance, name: string): ReactTestInstance {
  return root.find(
    (i) => typeof i.type !== 'string' && !!i.type && ((i.type as { displayName?: string }).displayName === name || (i.type as { name?: string }).name === name)
  );
}

export function findAllByDisplayName(root: ReactTestInstance, name: string): ReactTestInstance[] {
  return root.findAll(
    (i) => typeof i.type !== 'string' && !!i.type && ((i.type as { displayName?: string }).displayName === name || (i.type as { name?: string }).name === name)
  );
}

/** Spy on console.warn for the duration of `fn`, returning the calls made. Restores afterward. */
export function withWarnSpy(fn: () => void): string[] {
  const calls: string[] = [];
  const spy = jest.spyOn(console, 'warn').mockImplementation((msg: string) => {
    calls.push(msg);
  });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return calls;
}
