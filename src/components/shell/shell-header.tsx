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
  IconButton,
  Text,
} from '@beemvp/beeui-ui';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { AppIcon } from '../icons';
import { openCommandPalette } from './overlay-store';
import { useT } from '../../i18n';
import { useSessionStore } from '../../data/session-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { goBackOr } from '../../lib/navigation';
import { BrandMark, initialsOf } from './brand-mark';
import { NAV_ITEMS } from './nav-items';
import { useCurrentScreenHeader } from './screen-header';

/**
 * App header per the mockup. A screen registers its title through `useScreenHeader`, and the
 * header then reads `Đơn hàng` over `Tạp hoá Cầu Giấy · 7 ngày · 56 đơn`, which is what stops
 * a screen drawing a second header row under this one. With no screen title it falls back to
 * the store, as the POS catalogue does.
 *
 * Desktop is one 48 pt row instead of two stacked lines: the title with its context inline
 * and muted on the left, the store switcher and the avatar on the right. The store name was
 * on every screen twice (header line and sidebar) and its address a third time, so the
 * address moves inside the switcher menu where it is the thing that tells two branches apart.
 *
 * A pushed route asks for a back control here (`backTo`) and keeps its way home; the phone
 * header otherwise carries the brand mark, because there is no rail or sidebar to carry it.
 */
export function ShellHeader() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const breakpoint = useBreakpoint();
  const screen = useCurrentScreenHeader();
  const store = useSessionStore((state) => state.store);
  const staff = useSessionStore((state) => state.staff);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);
  const logout = useSessionStore((state) => state.logout);

  const isPhone = breakpoint === 'phone';
  const isDesktop = breakpoint === 'desktop';
  const roleLine = staff ? `${staff.name} · ${t(`staff.role.${staff.role}`)}` : undefined;
  // The phone header has room for one of the two: the screen's own line wins there, because
  // the store name is already the fallback title and repeating it truncates both.
  const screenLine = isPhone
    ? screen?.subtitle ?? store?.name
    : [store?.name, screen?.subtitle].filter(Boolean).join(' · ');
  const secondaryLine = screen ? screenLine : isPhone ? roleLine : store?.address;

  // Desktop names the area even when the screen registers nothing (the POS catalogue), so
  // the one title slot never falls back to the store name the switcher already carries.
  const navLabel = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  const desktopTitle = screen?.title ?? (navLabel ? t(navLabel.labelKey) : 'BeePOS');

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

  // Tablet and desktop get a visible way into the palette: the chord is invisible affordance,
  // and a tablet on a counter has no keyboard at all. Phone has no room for it and reaches the
  // same screens through the bottom tabs.
  const paletteButton = isPhone ? null : (
    <IconButton
      accessibilityLabel={t('common.command.title')}
      onPress={openCommandPalette}
      variant="ghost"
    >
      <AppIcon name="search" tone="muted-foreground" />
    </IconButton>
  );

  const avatarMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        variant="ghost"
        accessibilityLabel={t('common.shell.profile')}
        className="h-11 w-11 items-center justify-center rounded-full p-0"
      >
        {/* `fallbackClassName` is not decoration: the initials inherit react-native-web's
            default black otherwise, which is 1.4:1 on the muted circle in dark
            (docs/beeui-audit/findings-18-w-c.md, 18-02). */}
        <Avatar fallback={initialsOf(staff?.name)} fallbackClassName="text-foreground" size="md" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {staff ? <DropdownMenuLabel>{staff.name}</DropdownMenuLabel> : null}
        {/* Below desktop the store switcher has no chip of its own, so it stays here. */}
        {!isDesktop && storeOptions.length > 1 ? (
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
  );

  if (isDesktop) {
    return (
      <AppHeader
        className="min-h-12 border-b border-border bg-surface px-6 py-0"
        leading={leading}
        title={
          <View className="min-w-0 flex-row items-baseline gap-2">
            {/* The type step comes from `variant`: a text size in `className` loses to the
                component's own variant (docs/beeui-audit/findings-15-polish.md, 15-02). */}
            <Text variant="body" className="shrink-0 font-semibold text-foreground" numberOfLines={1}>
              {desktopTitle}
            </Text>
            {screen?.subtitle ? (
              <Text variant="caption" className="min-w-0 text-muted-foreground" numberOfLines={1}>
                {screen.subtitle}
              </Text>
            ) : null}
          </View>
        }
        trailing={
          <HStack className="items-center gap-2">
            {screen?.badge ? (
              <View className="rounded-sm bg-muted px-2 py-1">
                <Text variant="caption" className="font-semibold text-foreground">
                  {screen.badge}
                </Text>
              </View>
            ) : null}
            {paletteButton}
            <StoreSwitcher />
            {avatarMenu}
          </HStack>
        }
      />
    );
  }

  return (
    <AppHeader
      className="min-h-14 bg-surface py-2"
      leading={leading}
      title={
        <View className="gap-0.5">
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
          {paletteButton}
          {!isPhone && store ? (
            <Badge variant="outline" className="rounded-sm border-transparent bg-muted">
              {store.code}
            </Badge>
          ) : null}
          {avatarMenu}
        </HStack>
      }
    />
  );
}

/**
 * Desktop store chip: `HN01 · Tạp hoá Cầu Giấy`, opening the branches this cashier is
 * assigned to. The address rides inside the menu item rather than in the header, because it
 * is only needed at the moment two branches have to be told apart.
 *
 * It has to read as a control, not as a caption: a 44 pt row, a chevron that says a menu is
 * behind it, and a fill on hover and on press. Without those the chip was indistinguishable
 * from the title beside it and nobody tried pressing it.
 */
function StoreSwitcher() {
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const store = useSessionStore((state) => state.store);
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);

  if (!store) return null;

  const chip = `${store.code} · ${store.name}`;

  // One branch is not a choice: the chip stays as a plain label so it cannot be pressed, and
  // it carries no chevron, which would promise a menu that does not exist.
  if (storeOptions.length < 2) {
    return (
      <View className="h-9 justify-center rounded-md bg-muted px-2.5">
        <Text variant="label" className="font-medium text-foreground" numberOfLines={1}>
          {chip}
        </Text>
      </View>
    );
  }

  return (
    <DropdownMenu>
      {/* Hover lives on a wrapper because the trigger is a BeeUI component and takes no
          pointer callbacks of its own; `active:` on the trigger covers the pressed state. */}
      <View
        className={`rounded-md ${hovered ? 'bg-muted' : ''}`}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <DropdownMenuTrigger
          variant="ghost"
          accessibilityLabel={`${t('common.shell.switchStore')} · ${chip}`}
          className="h-11 flex-row items-center gap-1.5 px-2.5 active:bg-muted"
        >
          <Text variant="label" className="font-medium text-foreground" numberOfLines={1}>
            {chip}
          </Text>
          {/* lucide's chevron-down is not in the app's icon set (`src/components/icons.tsx`,
              owned elsewhere this phase), and a quarter turn of chevron-right is the same
              glyph. Replace with `chevron-down` once the icon list gains it. */}
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <AppIcon name="chevron-right" size={16} tone="muted-foreground" />
          </View>
        </DropdownMenuTrigger>
      </View>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('common.shell.switchStore')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {storeOptions.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => selectStore(option.id)}>
            <View className="min-w-0 gap-0.5">
              <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                {`${option.code} · ${option.name}`}
              </Text>
              <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                {option.address}
              </Text>
            </View>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
