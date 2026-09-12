import { useState } from 'react';
import { View } from 'react-native';
import { Screen, SafeArea } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { ShellHeader } from './shell-header';
import { NavRail } from './nav-rail';
import { Sidebar } from './sidebar';
import { BottomTabBar } from './bottom-tab-bar';
import { MoreSheet } from './more-sheet';

/**
 * Responsive shell per `docs/design/design-direction.md` section 1: bottom tabs on phone,
 * a 72 pt icon rail on tablet, a 240 pt sidebar on desktop. Rail and sidebar run the full
 * height with the header inside the content column, matching the mockups.
 *
 * Uses a single outer `SafeArea` covering all four edges instead of per-section SafeArea
 * (one for the header's top edges, one for the tab bar's bottom edges) because that
 * doc-recommended split composition (see BeeUI's provider-safe-area guide) made `AppHeader`
 * throw `styleq: tailwind typeof undefined is not "string" or "null"` once on mount, on web.
 * See docs/beeui-audit/findings-00-scaffold.md, finding scaffold-08.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const breakpoint = useBreakpoint();
  const [moreOpen, setMoreOpen] = useState(false);

  if (breakpoint === 'phone') {
    return (
      <Screen>
        <SafeArea className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
          <ShellHeader />
          <View className="flex-1">{children}</View>
          <BottomTabBar onMorePress={() => setMoreOpen(true)} />
        </SafeArea>
        <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
      </Screen>
    );
  }

  return (
    <Screen>
      <SafeArea className="flex-1 flex-row" edges={['top', 'bottom', 'left', 'right']}>
        {breakpoint === 'tablet' ? <NavRail /> : <Sidebar />}
        <View className="min-w-0 flex-1">
          <ShellHeader />
          <View className="flex-1">{children}</View>
        </View>
      </SafeArea>
    </Screen>
  );
}
