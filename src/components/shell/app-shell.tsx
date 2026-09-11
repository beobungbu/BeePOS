import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Screen, SafeArea } from '@beemvp/beeui-ui';
import { ShellHeader } from './shell-header';
import { Sidebar } from './sidebar';
import { BottomTabBar } from './bottom-tab-bar';
import { MoreSheet } from './more-sheet';

const WIDE_BREAKPOINT = 768;

/**
 * Responsive shell: persistent sidebar on wide screens, bottom tabs + more sheet on narrow.
 *
 * Uses a single outer `SafeArea` covering all four edges instead of per-section SafeArea
 * (one for the header's top edges, one for the tab bar's bottom edges) because that
 * doc-recommended split composition (see BeeUI's provider-safe-area guide) made `AppHeader`
 * throw `styleq: tailwind typeof undefined is not "string" or "null"` once on mount, on web.
 * See docs/beeui-audit/findings-00-scaffold.md, finding scaffold-08.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['top', 'bottom', 'left', 'right']}>
        <ShellHeader />
        <View className="flex-1 flex-row">
          {isWide && <Sidebar />}
          <View className="flex-1">{children}</View>
        </View>
        {!isWide && <BottomTabBar onMorePress={() => setMoreOpen(true)} />}
      </SafeArea>
      {!isWide && <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />}
    </Screen>
  );
}
