import { View } from 'react-native';
import { useBreakpoint } from '../hooks/use-breakpoint';

/**
 * The one filter row every admin list screen draws directly under the app header
 * (`plans/260912-1054-beepos-design-pass/phase-04-desktop-density.md`, decision 3).
 *
 * Desktop is a single 56 pt row that never wraps: filters from the left, primary actions
 * pushed to the right edge. Below 1280 the same children wrap, because at 768 a search field,
 * two selects and two buttons on one line leave the search box too narrow to read its own
 * placeholder. The result count is not in here: it belongs to the pagination footer, which is
 * the only place it stays true after a page change.
 */
export function Toolbar({
  children,
  actions,
}: {
  /** Search and filters, laid out left to right. Absent on a screen that has none. */
  children?: React.ReactNode;
  /** Primary actions, right aligned on desktop. */
  actions?: React.ReactNode;
}) {
  const isDesktop = useBreakpoint() === 'desktop';

  return (
    <View
      className={
        isDesktop
          ? 'h-14 flex-row items-center gap-2'
          : 'flex-row flex-wrap items-center gap-2 py-2'
      }
    >
      {children}
      {actions ? (
        <View className={`flex-row items-center gap-2 ${isDesktop ? 'ml-auto' : ''}`}>{actions}</View>
      ) : null}
    </View>
  );
}
