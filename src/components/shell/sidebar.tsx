import { Pressable, View } from 'react-native';
import { Avatar, Text } from '@beemvp/beeui-ui';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { AppIcon } from '../icons';
import { BrandBlock, initialsOf } from './brand-mark';
import { SETTINGS_NAV_ITEM, WIDE_NAV_ITEMS, type NavItem } from './nav-items';

/**
 * 240 pt sidebar for desktop (>= 1280): brand block on top, every area in the middle, then
 * Cài đặt and the signed-in cashier pinned to the bottom.
 */
export function Sidebar() {
  const t = useT();
  const pathname = usePathname();
  const staff = useSessionStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);

  return (
    <View className="w-60 shrink-0 border-r border-border bg-surface px-3 py-4">
      <View className="px-2 pb-4">
        <BrandBlock />
      </View>

      {WIDE_NAV_ITEMS.map((item) => (
        <SidebarItem key={item.id} item={item} active={pathname.startsWith(item.href)} />
      ))}

      <View className="flex-1" />

      <SidebarItem item={SETTINGS_NAV_ITEM} active={pathname.startsWith(SETTINGS_NAV_ITEM.href)} />

      {staff ? (
        <View className="mt-2 flex-row items-center gap-2.5 border-t border-border px-2 pb-1 pt-3">
          <Avatar fallback={initialsOf(staff.name)} size="sm" />
          <View className="min-w-0 flex-1">
            <Text className="text-label font-semibold text-foreground" numberOfLines={1}>
              {staff.name}
            </Text>
            <Text className="text-caption text-muted-foreground" numberOfLines={1}>
              {store ? `${t(`staff.role.${staff.role}`)} · ${store.code}` : t(`staff.role.${staff.role}`)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  const t = useT();
  const router = useRouter();
  const label = t(item.labelKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={() => router.navigate(item.href as never)}
      className={`h-touch-target flex-row items-center gap-3 rounded-md px-3 ${
        active ? 'bg-primary/15' : ''
      }`}
    >
      <AppIcon name={item.icon} tone={active ? 'primary-pressed' : 'muted-foreground'} />
      <Text
        numberOfLines={1}
        className={
          active
            ? 'text-label font-semibold text-primary-pressed'
            : 'text-label font-medium text-muted-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
