import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { AppIcon } from '../icons';
import { BrandMark } from './brand-mark';
import { SETTINGS_NAV_ITEM, WIDE_NAV_ITEMS, type NavItem } from './nav-items';

/**
 * 72 pt icon rail for tablets (768 to 1279). A 240 pt sidebar at this width costs the
 * catalog a whole column and truncates product names, so the rail carries every area as an
 * icon with a 10 pt label and Cài đặt pinned to the bottom.
 */
export function NavRail() {
  const pathname = usePathname();

  return (
    <View className="w-[72px] shrink-0 items-center gap-0.5 border-r border-border bg-surface py-3">
      <View className="mb-2.5">
        <BrandMark />
      </View>
      {WIDE_NAV_ITEMS.map((item) => (
        <RailItem key={item.id} item={item} active={pathname.startsWith(item.href)} />
      ))}
      <View className="flex-1" />
      <RailItem item={SETTINGS_NAV_ITEM} active={pathname.startsWith(SETTINGS_NAV_ITEM.href)} />
    </View>
  );
}

function RailItem({ item, active }: { item: NavItem; active: boolean }) {
  const t = useT();
  const router = useRouter();
  const label = t(item.labelKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(item.href as never)}
      className={`min-h-touch-target w-[60px] items-center justify-center gap-1 rounded-md px-1 py-1.5 ${
        active ? 'bg-primary/15' : ''
      }`}
    >
      <AppIcon name={item.icon} size={24} tone={active ? 'primary-pressed' : 'muted-foreground'} />
      {/* Two lines, not an ellipsis: "Khách hàng" must stay readable in 60 pt. */}
      <Text
        numberOfLines={2}
        className={
          active
            ? 'text-center text-[10px] font-semibold leading-3 text-primary-pressed'
            : 'text-center text-[10px] font-medium leading-3 text-muted-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
