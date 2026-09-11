import { BottomActionBar, Text } from '@beemvp/beeui-ui';
import { Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { PRIMARY_MOBILE_TABS, SECONDARY_MOBILE_ITEMS } from './nav-items';

/** Bottom tab bar for narrow screens (< 768): 4 primary areas plus a "More" sheet trigger. */
export function BottomTabBar({ onMorePress }: { onMorePress: () => void }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

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
    <BottomActionBar className="flex-row items-center justify-around">
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          accessibilityRole="button"
          accessibilityLabel={tab.label}
          onPress={tab.onPress}
          className="items-center gap-1 px-3 py-1"
        >
          <Text className="text-lg">{tab.icon}</Text>
          <Text
            className={
              tab.active ? 'text-xs font-medium text-primary' : 'text-xs text-muted-foreground'
            }
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </BottomActionBar>
  );
}
