import { useEffect, useSyncExternalStore } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import { useSettingsStore } from '../data/settings-store';
import { resolveRuntimeTheme, type ResolvedTheme, type SystemColorScheme } from './theme-mode';

export type { ResolvedTheme } from './theme-mode';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function webMediaQuery(): MediaQueryList | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(DARK_QUERY);
}

function subscribeWebScheme(onChange: () => void): () => void {
  const query = webMediaQuery();
  if (!query) return () => undefined;
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function readWebScheme(): SystemColorScheme {
  const query = webMediaQuery();
  if (!query) return null;
  return query.matches ? 'dark' : 'light';
}

/**
 * What the OS is asking for, read from the platform rather than from whatever theme the app
 * last applied. `Uniwind.setTheme('light' | 'dark')` pins the colour scheme, and a pinned
 * scheme is also what `useColorScheme()` answers from then on, so on web the media query is
 * subscribed to directly. On native `useColorScheme()` is the source, and the caller keeps
 * the pin released while the mode is "theo hệ thống" so that answer stays truthful.
 */
function useSystemColorScheme(): SystemColorScheme {
  const nativeScheme = useColorScheme();
  const webScheme = useSyncExternalStore(subscribeWebScheme, readWebScheme, readWebScheme);

  return Platform.OS === 'web' ? webScheme : nativeScheme;
}

/**
 * Wires settings-store theme (light | dark | system) to Uniwind's runtime theme switch and
 * returns what that resolves to, so chrome outside the Uniwind tree (the status bar) can
 * follow the same answer instead of reading the OS scheme a second time.
 *
 * "Theo hệ thống" has to keep following the OS after an explicit Sáng/Tối has been pressed,
 * which takes two things: the app resolves the OS scheme from the platform itself (above),
 * and native releases React Native's colour-scheme override that the explicit choice pinned.
 * Without the release the app would render the last explicit choice for the rest of the
 * process, whatever the setting says and whatever the OS does.
 */
export function useAppTheme(): ResolvedTheme {
  const themeMode = useSettingsStore((state) => state.theme);
  const systemScheme = useSystemColorScheme();
  const resolved = resolveRuntimeTheme(themeMode, systemScheme);

  useEffect(() => {
    Uniwind.setTheme(resolved);
    // react-native-web has no override to release (and no `setColorScheme` to call it with).
    if (themeMode === 'system' && Platform.OS !== 'web') {
      Appearance.setColorScheme('unspecified');
    }
  }, [themeMode, resolved]);

  return resolved;
}
