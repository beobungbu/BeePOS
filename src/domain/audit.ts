/**
 * The audit vocabulary: which acts are recorded, what they are recorded against, and how the
 * log is narrowed. Pure, so the seed, the store and the screen all agree on one closed set of
 * actions instead of each writing its own free-text verb.
 *
 * Free text was the alternative and it does not work: a log whose action column is whatever
 * the calling screen typed cannot be filtered, cannot be counted and cannot be given a
 * meaning ("this one is destructive"). The summary stays free text, because that is the
 * sentence a person reads; the action is an enum, because that is what a machine reads.
 */
import type { AuditEvent } from './types';

/**
 * Every act worth answering for later. Names are flat identifiers rather than dotted paths:
 * they are also i18n keys (`chain.audit.actions.<action>`), and a dot inside one would be
 * read as another level of the dictionary.
 */
export const AUDIT_ACTIONS = [
  'orderVoid',
  'orderRefund',
  'orderDiscount',
  'productPrice',
  'storePrice',
  'stockAdjust',
  'stockCount',
  'staffPinReset',
  'staffInvite',
  'cashIn',
  'cashOut',
  'shiftOpen',
  'shiftClose',
  'login',
  'logout',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** What the act was performed on; names the object column and picks its i18n label. */
export const AUDIT_ENTITIES = [
  'order',
  'product',
  'stock',
  'staff',
  'account',
  'cash',
  'shift',
  'session',
] as const;

export type AuditEntity = (typeof AUDIT_ENTITIES)[number];

/**
 * Badge colour per action (mockup section 7): voiding an order is destructive, a refund, a
 * PIN reset, a cash withdrawal and a stock correction are warnings, and the rest are
 * neutral. Colour is the only reason this mapping exists, so it lives beside the actions
 * rather than inside the screen that paints them.
 */
export type AuditTone = 'neutral' | 'warning' | 'destructive';

export const AUDIT_ACTION_TONE: Record<AuditAction, AuditTone> = {
  orderVoid: 'destructive',
  orderRefund: 'warning',
  orderDiscount: 'neutral',
  productPrice: 'neutral',
  storePrice: 'neutral',
  stockAdjust: 'warning',
  stockCount: 'warning',
  staffPinReset: 'warning',
  staffInvite: 'neutral',
  cashIn: 'neutral',
  cashOut: 'warning',
  shiftOpen: 'neutral',
  shiftClose: 'neutral',
  login: 'neutral',
  logout: 'neutral',
};

/** True when the string came out of {@link AUDIT_ACTIONS}; anything else is shown verbatim. */
export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

/** Same guard for the object column, so a stale persisted row cannot print a dictionary key. */
export function isAuditEntity(value: string): value is AuditEntity {
  return (AUDIT_ENTITIES as readonly string[]).includes(value);
}

export interface AuditFilters {
  /** `null` means every member. */
  staffId: string | null;
  /** `null` means every action. */
  action: AuditAction | null;
  /** Matched against the entity id and the summary, case-insensitively. */
  query: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = { staffId: null, action: null, query: '' };

/** Narrows the log. Newest first is the store's job; this only removes rows. */
export function filterAuditEvents(
  events: readonly AuditEvent[],
  { staffId, action, query }: AuditFilters,
): AuditEvent[] {
  const needle = query.trim().toLowerCase();
  return events.filter((event) => {
    if (staffId && event.staffId !== staffId) return false;
    if (action && event.action !== action) return false;
    if (!needle) return true;
    return (
      event.entityId.toLowerCase().includes(needle) || event.summary.toLowerCase().includes(needle)
    );
  });
}

/** How many of each action the visible log holds, for the strip above the table. */
export function countAuditActions(events: readonly AuditEvent[]): Record<AuditAction, number> {
  const counts = Object.fromEntries(AUDIT_ACTIONS.map((action) => [action, 0])) as Record<
    AuditAction,
    number
  >;
  for (const event of events) {
    if (isAuditAction(event.action)) counts[event.action] += 1;
  }
  return counts;
}
