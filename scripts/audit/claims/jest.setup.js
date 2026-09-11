// Own setup for phase-07 Worker A behavior-claim tests. Auto-stubs the
// native gesture/bottom-sheet modules (react-native-gesture-handler,
// @gorhom/bottom-sheet -> react-native-reanimated -> react-native-worklets)
// that BeeUI's Sheet `.native.tsx` implementation pulls in transitively —
// those have no native host under plain Jest (no simulator/device), so
// without a stub every claim test that merely *imports* @beemvp/beeui-ui
// (its package index re-exports Sheet) crashes in
// `NativeWorklets.loadUnpackers` before a single assertion runs. The
// classic `react-native-reanimated/mock` no longer fully insulates from
// react-native-worklets on the installed reanimated 4.x / worklets 0.10.x
// pairing, so this stubs the actual trigger (@gorhom/bottom-sheet) instead.
// The app itself has no jest setup for this (package.json's "jest" key has
// no setupFiles, since it has never run a component test before phase 07)
// — this file lives only under scripts/audit/claims/ and is never
// referenced by the app's own jest config.
try {
  // eslint-disable-next-line global-require
  require('react-native-gesture-handler/jestSetup');
} catch {
  // optional; not every claim test touches gesture-handler-dependent paths
}

// Inlined into the jest.mock() factory itself (rather than calling a
// module-scope helper) because babel-plugin-jest-hoist forbids a
// jest.mock() factory from referencing any out-of-scope variable/function —
// it must be fully self-contained.
// Same rationale, targeting the other native-only entry point Sheet's
// `.native.tsx` imports directly (not only via @gorhom/bottom-sheet):
// react-native-reanimated itself, which (as of the installed 4.5.1 /
// react-native-worklets 0.10.1 pairing) pulls in the same native
// `NativeWorklets` chain even through its own published `/mock` entry
// point. None of this phase's claim tests assert real animation timing —
// they assert prop-driven React state/accessibility behavior — so a
// generic auto-stub (hooks return inert values, components pass through
// their RN equivalent, `createAnimatedComponent` is the identity function)
// is sufficient and keeps every claim runnable under plain Jest.
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line global-require
  const RN = require('react-native');
  const passthroughComponents = { View: RN.View, Text: RN.Text, ScrollView: RN.ScrollView, Image: RN.Image };
  const AnimatedDefault = new Proxy(
    { createAnimatedComponent: (Component) => Component },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string' && prop in passthroughComponents) return passthroughComponents[prop];
        return RN.View;
      },
    }
  );
  const cache = new Map();
  const hooksAndFns = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== 'string') return undefined;
        if (cache.has(prop)) return cache.get(prop);
        let value;
        if (prop === 'default') value = AnimatedDefault;
        else if (prop === 'Easing') value = new Proxy({}, { get: () => (x) => x });
        else if (prop === 'useSharedValue') value = (initial) => ({ value: initial });
        else if (prop === 'useAnimatedRef') value = () => ({ current: null });
        else if (/^use[A-Z]/.test(prop)) value = () => ({});
        else if (/^[A-Z]/.test(prop)) value = passthroughComponents[prop] || RN.View;
        else value = (x) => x; // withTiming/withSpring/runOnJS/runOnUI/interpolate/... identity-ish
        cache.set(prop, value);
        return value;
      },
    }
  );
  return hooksAndFns;
});

jest.mock('@gorhom/bottom-sheet', () => {
  const cache = new Map();
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== 'string') return undefined;
        if (cache.has(prop)) return cache.get(prop);
        // eslint-disable-next-line global-require
        const React = require('react');
        let value;
        if (/^use[A-Z]/.test(prop)) {
          value = () => ({});
        } else if (/^[A-Z]/.test(prop)) {
          value = React.forwardRef(function AutoMockComponent(props, _ref) {
            return props && props.children != null ? props.children : null;
          });
          value.displayName = `AutoMock(${prop})`;
        } else {
          value = () => undefined;
        }
        cache.set(prop, value);
        return value;
      },
    }
  );
});
