import { EmptyState } from '@beemvp/beeui-ui';
import { View } from 'react-native';

/**
 * Placeholder screen for areas not yet implemented. Later phases replace the route file
 * that renders this, they never edit this shared component.
 *
 * Intentionally does not render its own `Screen`/`SafeArea`: those are owned once by
 * `AppShell` (`src/components/shell/app-shell.tsx`), which already wraps every area route.
 * Nesting a second `Screen`/`SafeArea` here caused a one-time `styleq: tailwind typeof
 * undefined is not "string" or "null"` console error on the first area screen mount
 * (see docs/beeui-audit/findings-00-scaffold.md, finding scaffold-08).
 */
export function AreaPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <View className="flex-1">
      <EmptyState title={title} description={description} />
    </View>
  );
}
