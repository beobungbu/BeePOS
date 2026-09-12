import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen, SafeArea } from '@beemvp/beeui-ui';
import { usePathname } from 'expo-router';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useSettingsStore } from '../../data/settings-store';
import { CommandPalette } from '../command-palette';
import { ShortcutHelp } from '../shortcut-help';
import { ShellHeader } from './shell-header';
import { useOverlayShortcuts } from './overlay-store';
import { isFocusedSellRoute, useShellRail } from './use-shell-rail';
import { NavRail } from './nav-rail';
import { Sidebar } from './sidebar';
import { BottomTabBar } from './bottom-tab-bar';
import { MoreSheet } from './more-sheet';
import { useSidebarShortcut } from './sidebar-toggle';

/**
 * Widest the admin screens are allowed to grow. Past roughly 1600 pt a six column table
 * stretches its cells into a line the eye has to track back across, so the content column
 * centres instead; POS is the exception and always takes the full width.
 */
const ADMIN_MAX_WIDTH = 'w-full max-w-[1600px] self-center';

/**
 * Responsive shell per `docs/design/design-direction.md` section 1: bottom tabs on phone,
 * a 72 pt icon rail on tablet, a 240 pt sidebar on desktop. Rail and sidebar run the full
 * height with the header inside the content column, matching the mockups.
 *
 * Desktop adds a collapse: the sidebar is 17 percent of a 1440 pt screen and the cashier
 * does not need nine labels to stay legible, so the preference in the settings store swaps it
 * for the same rail the tablet gets. `/pos*` forces the rail whatever the preference says,
 * because the sell screen spends every point it gets on catalogue columns.
 *
 * Uses a single outer `SafeArea` covering all four edges instead of per-section SafeArea
 * (one for the header's top edges, one for the tab bar's bottom edges) because that
 * doc-recommended split composition (see BeeUI's provider-safe-area guide) made `AppHeader`
 * throw `styleq: tailwind typeof undefined is not "string" or "null"` once on mount, on web.
 * See docs/beeui-audit/findings-00-scaffold.md, finding scaffold-08.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const breakpoint = useBreakpoint();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const setPosSidebarCollapsed = useSettingsStore((state) => state.setPosSidebarCollapsed);
  const showRail = useShellRail();

  const isDesktop = breakpoint === 'desktop';
  const isPos = isFocusedSellRoute(pathname);

  useSidebarShortcut(isDesktop);
  useOverlayShortcuts();

  // Leaving the sell screen arms the rail again, so POS is always entered focused.
  useEffect(() => {
    if (!isPos) setPosSidebarCollapsed(true);
  }, [isPos, setPosSidebarCollapsed]);

  // Both app-level dialogs are mounted once, outside the breakpoint branches: `Cmd+K` and `?`
  // are bound app wide, so the dialog they open has to exist at every width.
  const overlays = (
    <>
      <CommandPalette />
      <ShortcutHelp />
    </>
  );

  if (breakpoint === 'phone') {
    return (
      <Screen>
        <SafeArea className="flex-1 text-foreground" edges={['top', 'bottom', 'left', 'right']}>
          <ShellHeader />
          <View className="flex-1">{children}</View>
          <BottomTabBar onMorePress={() => setMoreOpen(true)} />
        </SafeArea>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
        {overlays}
      </Screen>
    );
  }

  // Tablet has no sidebar to collapse, so it keeps the rail and hides the toggle.
  const railOnly = breakpoint === 'tablet';

  return (
    <Screen>
      <SafeArea className="flex-1 flex-row text-foreground" edges={['top', 'bottom', 'left', 'right']}>
        {showRail ? <NavRail showToggle={!railOnly} /> : <Sidebar />}
        <View className="min-w-0 flex-1">
          <ShellHeader />
          <View className={isDesktop && !isPos ? `min-h-0 flex-1 ${ADMIN_MAX_WIDTH}` : 'flex-1'}>
            {children}
          </View>
        </View>
      </SafeArea>
      {overlays}
    </Screen>
  );
}
