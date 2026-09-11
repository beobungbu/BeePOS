import { ListGroup, ListGroupHeader, ListItem } from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useT } from '../../i18n';
import { NAV_ITEMS } from './nav-items';

/** Persistent left sidebar for wide screens (>= 768): every area, always visible. */
export function Sidebar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="w-64 border-r border-border bg-background">
      <ListGroup>
        <ListGroupHeader title="BeePOS" />
        {NAV_ITEMS.map((item) => (
          <ListItem
            key={item.id}
            title={`${item.icon} ${t(item.labelKey)}`}
            className={pathname.startsWith(item.href) ? 'bg-accent' : ''}
            onPress={() => router.navigate(item.href as never)}
          />
        ))}
      </ListGroup>
    </View>
  );
}
