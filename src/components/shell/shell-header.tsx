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
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '../icons';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { goBackOr } from '../../lib/navigation';
import { BrandMark, initialsOf } from './brand-mark';
import { useCurrentScreenHeader } from './screen-header';

/**
 * App header per the mockup. A screen registers its title through `useScreenHeader`, and the
 * header then reads `Đơn hàng` over `Tạp hoá Cầu Giấy · 7 ngày · 56 đơn`, which is what stops
 * a screen drawing a second header row under this one. With no screen title it falls back to
 * the store, as the POS catalogue does.
 *
 * A pushed route asks for a back control here (`backTo`) and keeps its way home; the phone
 * header otherwise carries the brand mark, because there is no rail or sidebar to carry it.
 */
export function ShellHeader() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const screen = useCurrentScreenHeader();
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);
  const logout = useSessionStore((state) => state.logout);

  const isPhone = breakpoint === 'phone';
  const roleLine = staff ? `${staff.name} · ${t(`staff.role.${staff.role}`)}` : undefined;
  // The phone header has room for one of the two: the screen's own line wins there, because
  // the store name is already the fallback title and repeating it truncates both.
  const screenLine = isPhone
    ? screen?.subtitle ?? store?.name
    : [store?.name, screen?.subtitle].filter(Boolean).join(' · ');
  const secondaryLine = screen ? screenLine : isPhone ? roleLine : store?.address;

  const leading = screen?.backTo ? (
    <Pressable
      onPress={() => goBackOr(screen.backTo as string)}
      accessibilityRole="button"
      accessibilityLabel={t('common.actions.back')}
      className="h-11 w-11 items-center justify-center rounded-full active:bg-muted"
    >
      <AppIcon name="chevron-left" />
    </Pressable>
  ) : isPhone ? (
    <BrandMark size="sm" />
  ) : undefined;

  return (
    <AppHeader
      className="min-h-14 bg-surface py-2"
      leading={leading}
      title={
        <View className="gap-0.5">
          {/* The type step comes from `variant`: a text size in `className` loses to the
              component's own variant (docs/beeui-audit/findings-15-polish.md, 15-02). */}
          <Text variant="body" className="font-semibold text-foreground" numberOfLines={1}>
            {screen?.title ?? store?.name ?? 'BeePOS'}
          </Text>
          {secondaryLine ? (
            <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
              {secondaryLine}
            </Text>
          ) : null}
        </View>
      }
      trailing={
        <HStack className="items-center gap-3">
          {screen?.badge ? (
            <View className="rounded-sm bg-muted px-2 py-1">
              <Text variant="caption" className="font-semibold text-foreground">
                {screen.badge}
              </Text>
            </View>
          ) : null}
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
