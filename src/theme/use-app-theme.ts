import { useEffect } from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { Uniwind } from 'uniwind';
import { useSettingsStore, type ThemeMode } from '../data/settings-store';

function resolveRuntimeTheme(mode: ThemeMode, systemScheme: ColorSchemeName) {
  if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return mode;
}

/** Wires settings-store theme (light | dark | system) to Uniwind's runtime theme switch. */
export function useAppTheme(): void {
  const themeMode = useSettingsStore((state) => state.theme);
  const systemScheme = useColorScheme();

  useEffect(() => {
    Uniwind.setTheme(resolveRuntimeTheme(themeMode, systemScheme));
  }, [themeMode, systemScheme]);
}
