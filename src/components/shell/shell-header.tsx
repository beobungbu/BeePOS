import {
  AppHeader,
  Avatar,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  HStack,
  Text,
} from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { BrandMark, initialsOf } from './brand-mark';

/**
 * App header per the mockup: store name with a secondary line, the store code as a badge
 * from tablet up, and an avatar that opens the store switcher and sign-out menu. The phone
 * header adds the brand mark on the leading edge because there is no rail or sidebar to
 * carry it.
 */
export function ShellHeader() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);
  const logout = useSessionStore((state) => state.logout);

  const isPhone = breakpoint === 'phone';
  const roleLine = staff ? `${staff.name} · ${t(`staff.role.${staff.role}`)}` : undefined;
  const secondaryLine = isPhone ? roleLine : store?.address;

  return (
    <AppHeader
      className="min-h-14 bg-surface py-2"
      leading={isPhone ? <BrandMark size="sm" /> : undefined}
      title={
        <View className="gap-0.5">
          <Text className="text-body font-semibold text-foreground" numberOfLines={1}>
            {store?.name ?? 'BeePOS'}
          </Text>
          {secondaryLine ? (
            <Text className="text-caption text-muted-foreground" numberOfLines={1}>
              {secondaryLine}
            </Text>
          ) : null}
        </View>
      }
      trailing={
        <HStack className="items-center gap-3">
          {!isPhone && store ? (
            <Badge variant="outline" className="rounded-sm border-transparent bg-muted">
              {store.code}
            </Badge>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger
              variant="ghost"
              accessibilityLabel={t('common.shell.profile')}
              className="h-11 w-11 items-center justify-center rounded-full p-0"
            >
              <Avatar fallback={initialsOf(staff?.name)} size="md" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {staff ? <DropdownMenuLabel>{staff.name}</DropdownMenuLabel> : null}
              {storeOptions.length > 1 ? (
                <>
                  <DropdownMenuSeparator />
                  {storeOptions.map((option) => (
                    <DropdownMenuItem key={option.id} onSelect={() => selectStore(option.id)}>
                      <Text>{`${option.code} · ${option.name}`}</Text>
                    </DropdownMenuItem>
                  ))}
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  logout();
                  router.replace('/login');
                }}
              >
                <Text>{t('common.auth.logout')}</Text>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </HStack>
      }
    />
  );
}
