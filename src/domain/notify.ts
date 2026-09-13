/**
 * The notification centre's rules: state in, notifications out.
 *
 * Pure and idempotent. Every notification's id is derived from what it is about, so running
 * the rules again over the same state produces the same ids and the store can merge rather
 * than pile up duplicates. Read state is preserved by the caller keying on those ids.
 *
 * The domain owns no locale, so the copy comes in as templates (same arrangement as the
 * receipt and Z report formatters); `{placeholder}` tokens are filled from the row.
 *
 * Every notification carries its `kind`, its `templateKey` and the `params` the rule computed
 * alongside the rendered `title`/`body`. A screen with a dictionary should render from those
 * three through {@link renderNotification} and ignore the stored strings, which are only a
 * fallback: a row written in Vietnamese and read back after a language switch would otherwise
 * stay Vietnamese forever.
 */

import type {
  AppNotification,
  Customer,
  LedgerEntry,
  Lot,
  NotificationKind,
  Product,
  PurchaseOrder,
  Shift,
  StockLevel,
  Store,
  Supplier,
} from './types';
import { balances } from './ledger';

/** Lots closer than this to their expiry date raise a notification. */
export const EXPIRY_WARNING_DAYS = 30;

/** A shift left open longer than this raises a notification. */
export const UNCLOSED_SHIFT_HOURS = 16;

export interface NotificationTemplate {
  title: string;
  body: string;
}

/** One template per rule. Every `{token}` is replaced from the values the rule computes. */
export interface NotificationLabels {
  lowStock: NotificationTemplate;
  outOfStock: NotificationTemplate;
  expiringLot: NotificationTemplate;
  unclosedShift: NotificationTemplate;
  overdueReceivable: NotificationTemplate;
  poAwaiting: NotificationTemplate;
}

/** The variants a rule can produce; `AppNotification.templateKey` is one of these. */
export type NotificationTemplateKey = keyof NotificationLabels;

/** The template variants a kind can produce, for a UI mapping kinds to dictionary keys. */
export const TEMPLATE_KEYS_BY_KIND: Readonly<
  Record<NotificationKind, readonly NotificationTemplateKey[]>
> = {
  low_stock: ['lowStock', 'outOfStock'],
  expiring_lot: ['expiringLot'],
  shift_open: ['unclosedShift'],
  overdue_receivable: ['overdueReceivable'],
  po_awaiting: ['poAwaiting'],
};

export interface NotificationInput {
  orgId: string;
  /** Anchor for every "how long ago" and "how soon" comparison. */
  now: Date;
  labels: NotificationLabels;
  products?: readonly Product[];
  stores?: readonly Store[];
  stockLevels?: readonly StockLevel[];
  lots?: readonly Lot[];
  shifts?: readonly Shift[];
  ledgerEntries?: readonly LedgerEntry[];
  customers?: readonly Customer[];
  purchaseOrders?: readonly PurchaseOrder[];
  suppliers?: readonly Supplier[];
  /** Cap on rows per rule, so one bad stock take cannot produce 500 notifications. */
  limitPerRule?: number;
}

const DEFAULT_LIMIT_PER_RULE = 20;

/** Replaces `{key}` tokens. An unknown token is left alone rather than blanked. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

function nameById<T extends { id: string; name: string }>(items: readonly T[]): Map<string, string> {
  return new Map(items.map((item) => [item.id, item.name]));
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

function make(
  input: NotificationInput,
  kind: NotificationKind,
  id: string,
  templateKey: NotificationTemplateKey,
  values: Record<string, string | number>,
  extras: { storeId?: string; refType?: string; refId?: string; createdAt?: Date },
): AppNotification {
  const template = input.labels[templateKey];
  return {
    id,
    orgId: input.orgId,
    storeId: extras.storeId,
    kind,
    title: fillTemplate(template.title, values),
    body: fillTemplate(template.body, values),
    params: values,
    templateKey,
    refType: extras.refType,
    refId: extras.refId,
    createdAt: extras.createdAt ?? input.now,
  };
}

/**
 * Re-renders a stored notification against a template the caller just looked up, so the
 * notification centre shows the current language rather than the one the row was written in.
 * A row with no `params` (written before this existed) keeps its stored copy.
 */
export function renderNotification(
  notification: AppNotification,
  template: NotificationTemplate,
): NotificationTemplate {
  if (!notification.params) {
    return { title: notification.title, body: notification.body };
  }
  return {
    title: fillTemplate(template.title, notification.params),
    body: fillTemplate(template.body, notification.params),
  };
}

/** Products at or below their minimum level, worst shortfall first. */
export function lowStockNotifications(input: NotificationInput): AppNotification[] {
  const levels = input.stockLevels ?? [];
  const productNames = nameById(input.products ?? []);
  const storeNames = nameById(input.stores ?? []);

  return levels
    .filter((level) => level.onHand <= level.minLevel && productNames.has(level.productId))
    .sort((a, b) => a.onHand - b.onHand || a.productId.localeCompare(b.productId))
    .slice(0, input.limitPerRule ?? DEFAULT_LIMIT_PER_RULE)
    .map((level) => {
      const out = level.onHand <= 0;
      return make(
        input,
        'low_stock',
        `notif-low-stock-${level.storeId}-${level.productId}`,
        out ? 'outOfStock' : 'lowStock',
        {
          product: productNames.get(level.productId) ?? level.productId,
          store: storeNames.get(level.storeId) ?? level.storeId,
          onHand: level.onHand,
          minLevel: level.minLevel,
        },
        { storeId: level.storeId, refType: 'product', refId: level.productId },
      );
    });
}

/** Lots expiring inside {@link EXPIRY_WARNING_DAYS}, soonest first. Expired lots included. */
export function expiringLotNotifications(input: NotificationInput): AppNotification[] {
  const productNames = nameById(input.products ?? []);
  const storeNames = nameById(input.stores ?? []);

  return (input.lots ?? [])
    .filter((lot) => lot.onHand > 0 && lot.expiresAt !== undefined)
    .map((lot) => ({ lot, days: daysBetween(input.now, lot.expiresAt as Date) }))
    .filter((row) => row.days <= EXPIRY_WARNING_DAYS)
    .sort((a, b) => a.days - b.days || a.lot.id.localeCompare(b.lot.id))
    .slice(0, input.limitPerRule ?? DEFAULT_LIMIT_PER_RULE)
    .map((row) =>
      make(
        input,
        'expiring_lot',
        `notif-expiring-lot-${row.lot.id}`,
        'expiringLot',
        {
          product: productNames.get(row.lot.productId) ?? row.lot.productId,
          store: storeNames.get(row.lot.storeId) ?? row.lot.storeId,
          lotCode: row.lot.lotCode,
          days: row.days,
          qty: row.lot.onHand,
        },
        { storeId: row.lot.storeId, refType: 'lot', refId: row.lot.id },
      ),
    );
}

/** Shifts still open more than {@link UNCLOSED_SHIFT_HOURS} after they were started. */
export function unclosedShiftNotifications(input: NotificationInput): AppNotification[] {
  const storeNames = nameById(input.stores ?? []);
  const cutoffMs = UNCLOSED_SHIFT_HOURS * 3_600_000;

  return (input.shifts ?? [])
    .filter((shift) => !shift.closedAt)
    .map((shift) => ({ shift, openMs: input.now.getTime() - new Date(shift.openedAt).getTime() }))
    .filter((row) => row.openMs >= cutoffMs)
    .sort((a, b) => b.openMs - a.openMs)
    .slice(0, input.limitPerRule ?? DEFAULT_LIMIT_PER_RULE)
    .map((row) =>
      make(
        input,
        'shift_open',
        `notif-shift-open-${row.shift.id}`,
        'unclosedShift',
        {
          store: storeNames.get(row.shift.storeId) ?? row.shift.storeId,
          hours: Math.floor(row.openMs / 3_600_000),
          orderCount: row.shift.orderCount,
        },
        { storeId: row.shift.storeId, refType: 'shift', refId: row.shift.id },
      ),
    );
}

/** Customers with money past its due date, largest overdue amount first. */
export function overdueReceivableNotifications(input: NotificationInput): AppNotification[] {
  const customerNames = nameById(input.customers ?? []);

  return balances(input.ledgerEntries ?? [], 'customer', input.now)
    .filter((row) => row.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || a.partyId.localeCompare(b.partyId))
    .slice(0, input.limitPerRule ?? DEFAULT_LIMIT_PER_RULE)
    .map((row) =>
      make(
        input,
        'overdue_receivable',
        `notif-overdue-${row.partyId}`,
        'overdueReceivable',
        {
          customer: customerNames.get(row.partyId) ?? row.partyId,
          overdue: row.overdue,
          balance: row.balance,
          days: row.oldestDueDate ? Math.max(0, daysBetween(row.oldestDueDate, input.now)) : 0,
        },
        { refType: 'customer', refId: row.partyId },
      ),
    );
}

/** Purchase orders sent or part-received and still waiting on goods, oldest expected first. */
export function poAwaitingNotifications(input: NotificationInput): AppNotification[] {
  const supplierNames = nameById(input.suppliers ?? []);
  const storeNames = nameById(input.stores ?? []);

  return (input.purchaseOrders ?? [])
    .filter((order) => order.status === 'sent' || order.status === 'partial')
    .sort((a, b) => {
      const aAt = (a.expectedAt ?? a.createdAt).getTime();
      const bAt = (b.expectedAt ?? b.createdAt).getTime();
      return aAt - bAt || a.id.localeCompare(b.id);
    })
    .slice(0, input.limitPerRule ?? DEFAULT_LIMIT_PER_RULE)
    .map((order) => {
      const ordered = order.lines.reduce((total, line) => total + line.qty, 0);
      const received = order.lines.reduce((total, line) => total + line.receivedQty, 0);
      return make(
        input,
        'po_awaiting',
        `notif-po-${order.id}`,
        'poAwaiting',
        {
          code: order.code,
          supplier: supplierNames.get(order.supplierId) ?? order.supplierId,
          store: storeNames.get(order.storeId) ?? order.storeId,
          remaining: Math.max(0, ordered - received),
          ordered,
        },
        { storeId: order.storeId, refType: 'purchase-order', refId: order.id },
      );
    });
}

/**
 * Every rule, in the order the notification centre lists them: what stops a sale first
 * (stock), then what spoils (lots), then the till, then the money.
 */
export function buildNotifications(input: NotificationInput): AppNotification[] {
  return [
    ...lowStockNotifications(input),
    ...expiringLotNotifications(input),
    ...unclosedShiftNotifications(input),
    ...overdueReceivableNotifications(input),
    ...poAwaitingNotifications(input),
  ];
}

/**
 * Merges a freshly computed list into the stored one: an id already present keeps its
 * `readAt` and its original `createdAt`, an id that no longer applies is dropped, and a new
 * id is added. That is what makes re-running the rules on every boot safe.
 */
export function mergeNotifications(
  existing: readonly AppNotification[],
  computed: readonly AppNotification[],
): AppNotification[] {
  const byId = new Map(existing.map((notification) => [notification.id, notification]));
  return computed.map((notification) => {
    const previous = byId.get(notification.id);
    if (!previous) return notification;
    return { ...notification, readAt: previous.readAt, createdAt: previous.createdAt };
  });
}

/** Unread count, for the bell badge. */
export function unreadCount(notifications: readonly AppNotification[]): number {
  return notifications.filter((notification) => !notification.readAt).length;
}
