import { BottomActionBar, Text } from '@beemvp/beeui-ui';
import { Pressable, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { PRIMARY_MOBILE_TABS, SECONDARY_MOBILE_ITEMS } from './nav-items';

/** Bottom tab bar for narrow screens (< 768): 4 primary areas plus a "More" sheet trigger. */
export function BottomTabBar({ onMorePress }: { onMorePress: () => void }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  // Large Dynamic Type: five labels no longer fit a phone width, keep icons only (labels stay
  // available to assistive tech through accessibilityLabel).
  const iconOnly = useWindowDimensions().fontScale >= 1.3;

  const tabs = [
    ...PRIMARY_MOBILE_TABS.map((item) => ({
      key: item.id,
      label: t(item.labelKey),
      icon: item.icon,
      active: pathname.startsWith(item.href),
      onPress: () => router.navigate(item.href as never),
    })),
    {
      key: 'more',
      label: t('common.nav.more'),
      icon: '⋯',
      active: SECONDARY_MOBILE_ITEMS.some((item) => pathname.startsWith(item.href)),
      onPress: onMorePress,
    },
  ];

  return (
    <BottomActionBar className="flex-row items-stretch justify-between px-0">
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          onPress={tab.onPress}
          className="min-w-0 flex-1 items-center gap-0.5 px-1 py-1"
        >
          <Text className="text-lg">{tab.icon}</Text>
          {iconOnly ? null : (
          <Text
            numberOfLines={1}
            className={
              tab.active ? 'text-[11px] font-medium text-primary' : 'text-[11px] text-muted-foreground'
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
