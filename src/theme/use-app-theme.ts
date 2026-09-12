import { useEffect } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { Uniwind } from 'uniwind';
import { useSettingsStore, type ThemeMode } from '../data/settings-store';

export type ResolvedTheme = 'light' | 'dark';

function resolveRuntimeTheme(mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedTheme {
  if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return mode;
}

/**
 * Wires settings-store theme (light | dark | system) to Uniwind's runtime theme switch and
 * returns what that resolves to, so chrome outside the Uniwind tree (the status bar) can
 * follow the same answer instead of reading the OS scheme a second time.
 */
export function useAppTheme(): ResolvedTheme {
  const themeMode = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();
  const resolved = resolveRuntimeTheme(themeMode, systemScheme);

  useEffect(() => {
    Uniwind.setTheme(resolved);
  }, [resolved]);

  return resolved;
}
