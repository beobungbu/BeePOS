import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Text,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useNotificationStore, useUnreadNotificationCount } from '../../data/notification-store';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import {
  kindLabel,
  notificationRoute,
  notificationText,
  relativeTime,
} from '../../features/notifications/lib/notification-presentation';
import { ShellIcon } from './shell-icons';

/** Rows the popover carries before it starts hiding things; the screen has the rest. */
const POPOVER_ROWS = 5;

/**
 * The bell in the header, at every width (`docs/design/specs/commerce.md` section G). Tablet
 * and desktop open a popover with the newest rows, because a manager checking whether anything
 * needs them should not lose the screen they are on; the phone has no room for a 400 pt
 * popover and goes straight to the screen.
 *
 * The badge counts what is unread, not what exists: a list that always shows "8" stops being
 * read after a week.
 */
export function NotificationBell() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const unread = useUnreadNotificationCount();
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const label =
    unread > 0
      ? `${t('notifications.title')} · ${t('common.shell.unreadBadge').replace('{count}', String(unread))}`
      : t('notifications.title');

  if (breakpoint === 'phone') {
    return (
      <BellButton label={label} unread={unread} onPress={() => router.push('/notifications')} />
    );
  }

  const now = new Date();
  const newest = [...notifications]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id))
    .slice(0, POPOVER_ROWS);

  function open(notificationId: string) {
    const notification = notifications.find((row) => row.id === notificationId);
    if (!notification) return;
    markRead(notification.id);
    const route = notificationRoute(notification);
    if (route) router.push(route as never);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        variant="ghost"
        accessibilityLabel={label}
        className="h-11 w-11 items-center justify-center rounded-full p-0"
      >
        <BellGlyph unread={unread} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[360px]">
        <DropdownMenuLabel>{t('notifications.title')}</DropdownMenuLabel>
        {unread > 0 ? (
          <DropdownMenuItem onSelect={() => markAllRead()}>
            <Text variant="label" className="font-semibold text-info">
              {t('notifications.markAllRead')}
            </Text>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {newest.length === 0 ? (
          <DropdownMenuLabel>{t('notifications.empty')}</DropdownMenuLabel>
        ) : (
          newest.map((notification) => {
            const text = notificationText(notification, t);
            return (
              <DropdownMenuItem key={notification.id} onSelect={() => open(notification.id)}>
                <View className="min-w-0 gap-0.5">
                  <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                    {`${kindLabel(notification.kind, t)} · ${relativeTime(notification.createdAt, now, t)}`}
                  </Text>
                  <Text
                    variant="label"
                    className={
                      notification.readAt
                        ? 'font-medium text-muted-foreground'
                        : 'font-semibold text-foreground'
                    }
                    numberOfLines={1}
                  >
                    {text.title}
                  </Text>
                  <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                    {text.body}
                  </Text>
                </View>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/notifications')}>
          <Text variant="label" className="font-semibold text-info">
            {t('notifications.viewAll')}
          </Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BellButton({
  label,
  unread,
  onPress,
}: {
  label: string;
  unread: number;
  onPress: () => void;
}) {
  return (
    <IconButton accessibilityLabel={label} onPress={onPress} variant="ghost">
      <BellGlyph unread={unread} />
    </IconButton>
  );
}

/**
 * The glyph with its count. The badge is a sibling rather than a wrapper so it can sit over
 * the corner of the bell without changing the control's 44 pt hit area, and it carries no
 * accessible name of its own: the count is already in the button's label, and a screen reader
 * announcing "3" twice reads as two different threes.
 */
function BellGlyph({ unread }: { unread: number }) {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <ShellIcon name="bell" size={22} tone="muted-foreground" />
      {unread > 0 ? (
        <View
          pointerEvents="none"
          className="absolute -right-1.5 -top-1 min-w-4 items-center justify-center rounded-full bg-destructive px-1"
        >
          <Text variant="caption" className="text-[10px] font-bold leading-4 text-primary-foreground">
            {unread > 9 ? '9+' : String(unread)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
