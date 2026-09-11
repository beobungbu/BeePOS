import { useEffect } from 'react';
import { Uniwind } from 'uniwind';
import { applyDensity } from '@beemvp/beeui-tokens';
import { useSettingsStore } from '../../../data/settings-store';

const RUNTIME_THEMES = ['light', 'dark'] as const;

/**
 * Wires `settings-store`'s density (compact | comfortable) to Uniwind's density CSS
 * variables via `@beemvp/beeui-tokens`'s `applyDensity`, mirroring how `use-app-theme.ts`
 * wires theme mode. Called once per runtime theme per the density guide, since a mode
 * switch (light/dark) does not re-apply density on its own.
 */
export function useDensitySync(): void {
  const density = useSettingsStore((state) => state.density);

  useEffect(() => {
    for (const theme of RUNTIME_THEMES) {
      applyDensity(Uniwind, theme, density);
    }
  }, [density]);
}
