import {
  AUDIT_ACTIONS,
  AUDIT_ACTION_TONE,
  countAuditActions,
  filterAuditEvents,
  isAuditAction,
  isAuditEntity,
  EMPTY_AUDIT_FILTERS,
} from '../audit';
import type { AuditEvent } from '../types';

function event(partial: Partial<AuditEvent> & Pick<AuditEvent, 'id' | 'action'>): AuditEvent {
  return {
    orgId: 'org-1',
    staffId: 'staff-1',
    entity: 'order',
    entityId: 'HD-HN01-20260913-001',
    summary: 'Huỷ đơn 36.000 đ',
    createdAt: new Date('2026-09-13T07:00:00.000Z'),
    ...partial,
  };
}

const EVENTS: AuditEvent[] = [
  event({ id: 'a1', action: 'orderVoid' }),
  event({ id: 'a2', action: 'orderRefund', staffId: 'staff-2', summary: 'Hoàn 42.000 đ' }),
  event({ id: 'a3', action: 'orderVoid', staffId: 'staff-2', entityId: 'HD-HN02-20260913-009' }),
  event({ id: 'a4', action: 'cashOut', entity: 'cash', entityId: 'cash-31', summary: 'Rút 5.000.000 đ' }),
];

describe('filterAuditEvents', () => {
  it('returns everything with the empty filters', () => {
    expect(filterAuditEvents(EVENTS, EMPTY_AUDIT_FILTERS)).toHaveLength(4);
  });

  it('narrows by staff', () => {
    const rows = filterAuditEvents(EVENTS, { ...EMPTY_AUDIT_FILTERS, staffId: 'staff-2' });
    expect(rows.map((row) => row.id)).toEqual(['a2', 'a3']);
  });

  it('narrows by action', () => {
    const rows = filterAuditEvents(EVENTS, { ...EMPTY_AUDIT_FILTERS, action: 'orderVoid' });
    expect(rows.map((row) => row.id)).toEqual(['a1', 'a3']);
  });

  it('combines staff and action', () => {
    const rows = filterAuditEvents(EVENTS, { staffId: 'staff-2', action: 'orderVoid', query: '' });
    expect(rows.map((row) => row.id)).toEqual(['a3']);
  });

  it('searches the entity id and the summary, case-insensitively', () => {
    expect(filterAuditEvents(EVENTS, { ...EMPTY_AUDIT_FILTERS, query: 'hn02' })).toHaveLength(1);
    expect(filterAuditEvents(EVENTS, { ...EMPTY_AUDIT_FILTERS, query: 'rút' })).toHaveLength(1);
    expect(filterAuditEvents(EVENTS, { ...EMPTY_AUDIT_FILTERS, query: 'không có' })).toHaveLength(0);
  });
});

describe('audit vocabulary', () => {
  it('counts each action in the visible rows', () => {
    const counts = countAuditActions(EVENTS);
    expect(counts.orderVoid).toBe(2);
    expect(counts.orderRefund).toBe(1);
    expect(counts.cashOut).toBe(1);
    expect(counts.login).toBe(0);
  });

  it('gives every action a tone, so no badge falls through to an unstyled default', () => {
    for (const action of AUDIT_ACTIONS) expect(AUDIT_ACTION_TONE[action]).toBeDefined();
  });

  it('rejects values that are not part of the vocabulary', () => {
    expect(isAuditAction('orderVoid')).toBe(true);
    expect(isAuditAction('somethingElse')).toBe(false);
    expect(isAuditEntity('order')).toBe(true);
    expect(isAuditEntity('spaceship')).toBe(false);
  });
});
