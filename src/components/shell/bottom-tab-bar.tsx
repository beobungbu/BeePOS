import { BottomActionBar, Text } from '@beemvp/beeui-ui';
import { Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { useLargeText } from '../../hooks/use-large-text';
import { ShellIcon, type ShellIconName } from './shell-icons';
import { useVisibleNavItems } from './nav-items';

/** Bottom tab bar for phones (< 768): 4 primary areas plus a "Thêm" menu trigger. */
export function BottomTabBar({ onMorePress }: { onMorePress: () => void }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  // Large Dynamic Type: five labels no longer fit a phone width, keep icons only (labels stay
  // available to assistive tech through accessibilityLabel).
  const iconOnly = useLargeText();
  const items = useVisibleNavItems();
  const primary = items.filter((item) => item.primaryOnMobile);
  const secondary = items.filter((item) => !item.primaryOnMobile);

  const tabs: { key: string; label: string; icon: ShellIconName; active: boolean; onPress: () => void }[] = [
    ...primary.map((item) => ({
      key: item.id,
      label: t(item.labelKey),
      icon: item.icon,
      active: pathname.startsWith(item.href),
      onPress: () => router.navigate(item.href as never),
    })),
    {
      key: 'more',
      label: t('common.nav.more'),
      icon: 'ellipsis' as ShellIconName,
      active: secondary.some((item) => pathname.startsWith(item.href)),
      onPress: onMorePress,
    },
  ];

  return (
    <BottomActionBar className="flex-row items-stretch justify-between border-t border-border bg-surface-raised px-0 py-0">
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: tab.active }}
          onPress={tab.onPress}
          className="min-h-touch-target min-w-0 flex-1 items-center justify-center gap-1 px-1 py-2"
        >
          <ShellIcon name={tab.icon} size={24} tone={tab.active ? 'primary-pressed' : 'muted-foreground'} />
          {iconOnly ? null : (
            <Text
              numberOfLines={1}
              className={
                tab.active
                  ? 'text-[11px] font-semibold leading-4 text-primary-pressed'
                  : 'text-[11px] font-medium leading-4 text-muted-foreground'
              }
            >
              {tab.label}
            </Text>
          )}
        </Pressable>
      ))}
    </BottomActionBar>
  );
}
