/**
 * Which of the two desktop navigations the shell is showing, and how to flip it.
 *
 * One hook rather than two reads of the settings store, because the POS catalogue also needs
 * the answer: a rail gives it a fifth column and an expanded sidebar leaves room for four
 * (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decisions 1 and 6).
 */
import { usePathname } from 'expo-router';
import { useSettingsStore } from '../../data/settings-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';

/** Routes that open in rail mode whatever the saved preference says. */
export function isFocusedSellRoute(pathname: string): boolean {
  return pathname.startsWith('/pos');
}

/**
 * True when the rail is on screen: always at tablet, and at desktop whenever the preference
 * is collapsed or the route is the sell screen. Phone has neither and answers false.
 */
export function useShellRail(): boolean {
  const breakpoint = useBreakpoint();
  const pathname = usePathname();
  const collapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const posCollapsed = useSettingsStore((state) => state.posSidebarCollapsed);

  if (breakpoint === 'phone') return false;
  if (breakpoint === 'tablet') return true;
  return isFocusedSellRoute(pathname) ? posCollapsed : collapsed;
}

/**
 * Flips the navigation for the current route. Inside POS it flips the session-only override,
 * so expanding the sidebar to find a screen does not rewrite the preference the cashier set
 * for the admin screens, and coming back to POS shows the rail again.
 */
export function toggleShellRail(pathname: string): void {
  const state = useSettingsStore.getState();
  if (isFocusedSellRoute(pathname)) {
    state.setPosSidebarCollapsed(!state.posSidebarCollapsed);
    return;
  }
  state.setSidebarCollapsed(!state.sidebarCollapsed);
}
