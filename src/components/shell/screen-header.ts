/**
 * What the app header should say on the current route. The mockups put the screen title in
 * the app header (`Đơn hàng` over `Tạp hoá Cầu Giấy · 12/09/2026`), so a screen registers its
 * title here instead of drawing a second header row of its own.
 *
 * Keyed by route path rather than by a single slot: a pushed route leaves the screen under it
 * mounted, so "last writer wins" would leave a detail screen wearing the list's title, and a
 * screen that registers nothing correctly falls back to the store name.
 */

import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { create } from 'zustand';

export interface ScreenHeaderConfig {
  /** Screen title, e.g. `Đơn hàng`. */
  title: string;
  /** Extra context after the store name, e.g. `7 ngày · 56 đơn`. */
  subtitle?: string;
  /** One short badge before the avatar, e.g. the order being paid at checkout. */
  badge?: string;
  /** Set on pushed routes: the header shows a back control, falling back to this route. */
  backTo?: string;
}

interface ScreenHeaderState {
  byPath: Record<string, ScreenHeaderConfig>;
  setScreenHeader: (path: string, config: ScreenHeaderConfig) => void;
  clearScreenHeader: (path: string) => void;
}

export const useScreenHeaderStore = create<ScreenHeaderState>((set) => ({
  byPath: {},
  setScreenHeader: (path, config) =>
    set((state) => ({ byPath: { ...state.byPath, [path]: config } })),
  clearScreenHeader: (path) =>
    set((state) => {
      if (!(path in state.byPath)) return state;
      const byPath = { ...state.byPath };
      delete byPath[path];
      return { byPath };
    }),
}));

/**
 * Registers this screen's header content for as long as the screen is mounted. Takes the
 * fields apart so the effect depends on strings only and a re-render cannot loop.
 */
export function useScreenHeader({ title, subtitle, badge, backTo }: ScreenHeaderConfig): void {
  const pathname = usePathname();

  useEffect(() => {
    const { setScreenHeader, clearScreenHeader } = useScreenHeaderStore.getState();
    setScreenHeader(pathname, { title, subtitle, badge, backTo });
    return () => clearScreenHeader(pathname);
  }, [pathname, title, subtitle, badge, backTo]);
}

/** The header content for the route being shown, or undefined when the screen registered none. */
export function useCurrentScreenHeader(): ScreenHeaderConfig | undefined {
  const pathname = usePathname();
  return useScreenHeaderStore((state) => state.byPath[pathname]);
}
