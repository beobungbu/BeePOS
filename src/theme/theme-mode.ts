import type { ThemeMode } from '../data/settings-store';

export type ResolvedTheme = 'light' | 'dark';

/**
 * What `useColorScheme()` can answer, spelled out rather than imported so this module stays
 * free of React Native: `'unspecified'` is what the platform reports before it knows.
 */
export type SystemColorScheme = ResolvedTheme | 'unspecified' | null | undefined;

/**
 * What the stored theme mode resolves to for chrome that cannot read a CSS variable (the
 * status bar, the keyboard appearance). Kept free of React and Uniwind so it can be tested
 * on its own; `use-app-theme.ts` is the wiring around it.
 *
 * An unknown system scheme (the OS has not answered yet) reads as light, which is the value
 * the app renders with before the first `Appearance` event lands.
 */
export function resolveRuntimeTheme(mode: ThemeMode, systemScheme: SystemColorScheme): ResolvedTheme {
  if (mode === 'system') return systemScheme === 'dark' ? 'dark' : 'light';
  return mode;
}
