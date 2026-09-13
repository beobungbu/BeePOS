import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Badge,
  Button,
  ButtonLabel,
  SafeArea,
  Screen,
  Text,
  useToast,
  VStack,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useNotificationStore } from '../../data/notification-store';
import { useT } from '../../i18n';
import type { AppNotification } from '../../domain/types';
import {
  TONE_BY_KIND,
  groupByDay,
  kindLabel,
  notificationRoute,
  notificationText,
  relativeTime,
} from './lib/notification-presentation';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

type Filter = 'all' | 'unread';

/**
 * The notification centre as a screen: the phone's only form of it, and where the desktop
 * popover's "Xem tất cả" lands.
 *
 * Rows are grouped by day because "what happened today" is the question being asked, and each
 * one carries a second line with a concrete number, which is what decides whether it is worth
 * opening (`docs/design/specs/commerce.md` section G). Reading a row marks it read and takes
 * the reader to the thing it is about; a row about something with no screen of its own still
 * marks itself read rather than doing nothing at all.
 */
export function NotificationsScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const [filter, setFilter] = useState<Filter>('all');

  const unread = notifications.filter((row) => !row.readAt).length;
  useScreenHeader({
    title: t('notifications.title'),
    subtitle:
      unread > 0 ? t('notifications.unread').replace('{count}', String(unread)) : t('notifications.allRead'),
  });

  const days = useMemo(() => {
    const now = new Date();
    const rows = filter === 'unread' ? notifications.filter((row) => !row.readAt) : notifications;
    return groupByDay(rows, now, t);
    // `t` is a new closure per render; the locale it is bound to is what matters and it is
    // already a dependency through `notifications` re-rendering on a language change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, filter]);

  function handleOpen(notification: AppNotification) {
    markRead(notification.id);
    const route = notificationRoute(notification);
    if (route) router.push(route as never);
  }

  function handleMarkAll() {
    markAllRead();
    toast.show({ title: t('notifications.toast.markedAll'), variant: 'success' });
  }

  const now = new Date();

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <VStack gap="lg" className={GUTTER[breakpoint]}>
            <View className="flex-row flex-wrap items-center gap-2">
              <FilterChip
                label={t('notifications.filter.all')}
                selected={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <FilterChip
                label={t('notifications.filter.unread')}
                selected={filter === 'unread'}
                onPress={() => setFilter('unread')}
              />
              <View className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onPress={handleMarkAll}
                disabled={unread === 0}
                accessibilityLabel={t('notifications.markAllRead')}
              >
                {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the variant,
                    which is unreadable on an outline button in dark (findings-18-w-c). */}
                <ButtonLabel className="text-foreground">{t('notifications.markAllRead')}</ButtonLabel>
              </Button>
            </View>

            {days.length === 0 ? (
              <Text tone="muted">
                {filter === 'unread' ? t('notifications.emptyUnread') : t('notifications.empty')}
              </Text>
            ) : (
              days.map((day) => (
                <VStack gap="sm" key={day.key}>
                  <Text variant="caption" className="font-semibold uppercase text-muted-foreground">
                    {day.label}
                  </Text>
                  <View className="overflow-hidden rounded-lg border border-border bg-surface">
                    {day.items.map((notification, index) => (
                      <NotificationRow
                        key={notification.id}
                        notification={notification}
                        now={now}
                        first={index === 0}
                        onPress={() => handleOpen(notification)}
                      />
                    ))}
                  </View>
                </VStack>
              ))
            )}
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      accessibilityLabel={label}
      className={`h-9 items-center justify-center rounded-full px-4 ${selected ? 'bg-primary' : 'bg-muted'}`}
    >
      <Text
        variant="label"
        className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NotificationRow({
  notification,
  now,
  first,
  onPress,
}: {
  notification: AppNotification;
  now: Date;
  first: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const text = notificationText(notification, t);
  const isUnread = !notification.readAt;
  const kind = kindLabel(notification.kind, t);
  const when = relativeTime(notification.createdAt, now, t);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      // One name carrying everything the row says, so a screen reader does not have to walk
      // four separate strings to find out whether this is worth opening.
      accessibilityLabel={`${kind} · ${text.title} · ${text.body} · ${when}`}
      className={`min-h-touch-target flex-row items-start gap-3 px-4 py-3 active:bg-muted ${
        first ? '' : 'border-t border-border'
      }`}
    >
      <View className="pt-1.5">
        <View
          className={`h-2 w-2 rounded-full ${isUnread ? 'bg-info' : 'bg-transparent'}`}
        />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Badge variant={TONE_BY_KIND[notification.kind]}>{kind}</Badge>
          <Text variant="caption" className="text-muted-foreground">
            {when}
          </Text>
        </View>
        <Text
          variant="label"
          className={isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}
        >
          {text.title}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {text.body}
        </Text>
      </View>
    </Pressable>
  );
}
