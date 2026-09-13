/**
 * Turning a stored `AppNotification` into what the notification centre shows.
 *
 * The rules in `src/domain/notify.ts` own no locale: they hand back a `kind`, a `templateKey`
 * and the `params` they computed, plus a rendered fallback in whatever language was current
 * when the row was written. Everything here renders from the first three, so switching the
 * app to English rewrites yesterday's notifications too.
 *
 * Pure: it takes a `translate` function rather than calling the hook, so the grouping and the
 * copy can be tested without a renderer.
 */

import {
  renderNotification,
  TEMPLATE_KEYS_BY_KIND,
  type NotificationLabels,
  type NotificationTemplate,
  type NotificationTemplateKey,
} from '../../../domain/notify';
import { formatVND } from '../../../domain/money';
import type { AppNotification, NotificationKind } from '../../../domain/types';

/**
 * Params that are money rather than a count. The rules compute plain numbers, so a template
 * would otherwise read "quá hạn 33800000": formatting happens here, where the locale is.
 */
const MONEY_PARAMS = new Set(['overdue', 'balance']);

function formatParams(
  params: Record<string, string | number> | undefined,
): Record<string, string | number> | undefined {
  if (!params) return params;
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) =>
      MONEY_PARAMS.has(key) && typeof value === 'number' ? [key, formatVND(value)] : [key, value],
    ),
  );
}

export type Translate = (key: string) => string;

/** Badge tone per kind: what the notification reports decides its colour, not its age. */
export const TONE_BY_KIND: Record<NotificationKind, 'warning' | 'destructive' | 'secondary'> = {
  low_stock: 'warning',
  expiring_lot: 'destructive',
  overdue_receivable: 'destructive',
  po_awaiting: 'secondary',
  shift_open: 'secondary',
};

function template(translate: Translate, key: string): NotificationTemplate {
  return {
    title: translate(`notifications.template.${key}.title`),
    body: translate(`notifications.template.${key}.body`),
  };
}

/** The six templates `buildNotifications` needs, read out of the dictionary. */
export function notificationLabels(translate: Translate): NotificationLabels {
  return {
    lowStock: template(translate, 'lowStock'),
    outOfStock: template(translate, 'outOfStock'),
    expiringLot: template(translate, 'expiringLot'),
    unclosedShift: template(translate, 'unclosedShift'),
    overdueReceivable: template(translate, 'overdueReceivable'),
    poAwaiting: template(translate, 'poAwaiting'),
  };
}

/**
 * Which dictionary entry renders this row.
 *
 * A lot past its date is a different sentence from one that expires in a fortnight, and the
 * rule cannot tell them apart: it computes a single `days` that goes negative once the date
 * has passed, and "hết hạn còn -3 ngày" is not a sentence. The kind and the sign pick the
 * wording here, where the copy lives.
 */
export function templateKeyFor(notification: AppNotification): NotificationTemplateKey | 'expiredLot' {
  if (notification.kind === 'expiring_lot' && Number(notification.params?.days ?? 0) < 0) {
    return 'expiredLot';
  }
  // The stored key is a plain string on the record, so it is checked against the keys the
  // rule for this kind can actually produce before it is trusted to name a dictionary entry.
  const stored = notification.templateKey;
  const allowed: readonly string[] = TEMPLATE_KEYS_BY_KIND[notification.kind];
  if (stored && allowed.includes(stored)) return stored as NotificationTemplateKey;
  return fallbackKeyFor(notification.kind);
}

function fallbackKeyFor(kind: NotificationKind): NotificationTemplateKey {
  switch (kind) {
    case 'low_stock':
      return 'lowStock';
    case 'expiring_lot':
      return 'expiringLot';
    case 'shift_open':
      return 'unclosedShift';
    case 'overdue_receivable':
      return 'overdueReceivable';
    default:
      return 'poAwaiting';
  }
}

/**
 * Title and body in the current language. `expiredLot` is rendered with the days token made
 * positive, so the copy can say "quá hạn {days} ngày" without a minus sign in the middle.
 */
export function notificationText(
  notification: AppNotification,
  translate: Translate,
): NotificationTemplate {
  const key = templateKeyFor(notification);
  const params = formatParams(notification.params);
  if (key === 'expiredLot' && params) {
    const positiveDays = { ...params, days: Math.abs(Number(notification.params?.days ?? 0)) };
    return renderNotification({ ...notification, params: positiveDays }, template(translate, 'expiredLot'));
  }
  return renderNotification({ ...notification, params }, template(translate, key));
}

/** The word on the badge: what kind of trouble this is. */
export function kindLabel(kind: NotificationKind, translate: Translate): string {
  return translate(`notifications.kind.${kind}`);
}

/**
 * Where tapping the row goes. An unknown ref is left alone rather than guessed at: a row that
 * navigates nowhere is better than one that navigates to a 404.
 */
export function notificationRoute(notification: AppNotification): string | undefined {
  const { refType, refId } = notification;
  if (!refType) return undefined;
  switch (refType) {
    case 'product':
      return refId ? `/products/${refId}` : '/products';
    case 'customer':
      return refId ? `/customers/${refId}` : '/customers';
    case 'purchase-order':
      return refId ? `/inventory/purchase-orders/${refId}` : '/inventory/purchase-orders';
    case 'shift':
      return '/pos/shift';
    case 'lot':
      return '/inventory';
    default:
      return undefined;
  }
}

/** Calendar day in `YYYY-MM-DD` (UTC), the key the list groups on. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `Hôm nay`, `Hôm qua`, or the date itself for anything older. */
export function dayLabel(key: string, now: Date, translate: Translate): string {
  if (key === dayKey(now)) return translate('notifications.day.today');
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return translate('notifications.day.yesterday');
  const [year, month, day] = key.split('-');
  return `${day}/${month}/${year}`;
}

export interface NotificationDay {
  key: string;
  label: string;
  items: AppNotification[];
}

/** Newest first, grouped by the day each row was raised. */
export function groupByDay(
  notifications: readonly AppNotification[],
  now: Date,
  translate: Translate,
): NotificationDay[] {
  const sorted = [...notifications].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id),
  );
  const days: NotificationDay[] = [];
  for (const notification of sorted) {
    const key = dayKey(notification.createdAt);
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(notification);
    else days.push({ key, label: dayLabel(key, now, translate), items: [notification] });
  }
  return days;
}

/**
 * How long ago, in the coarsest unit that still says something: minutes under an hour, hours
 * under a day, days after that. The template carries the unit, so `{count}` is all this fills.
 */
export function relativeTime(createdAt: Date, now: Date, translate: Translate): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60_000));
  if (minutes < 1) return translate('notifications.time.justNow');
  if (minutes < 60) return translate('notifications.time.minutes').replace('{count}', String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate('notifications.time.hours').replace('{count}', String(hours));
  const days = Math.floor(hours / 24);
  return translate('notifications.time.days').replace('{count}', String(days));
}
