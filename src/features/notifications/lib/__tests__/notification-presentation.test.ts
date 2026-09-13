import { t } from '../../../../i18n';
import type { AppNotification } from '../../../../domain/types';
import {
  dayLabel,
  groupByDay,
  kindLabel,
  notificationLabels,
  notificationRoute,
  notificationText,
  relativeTime,
  templateKeyFor,
} from '../notification-presentation';

const NOW = new Date('2026-09-11T09:00:00.000Z');
const vi = (key: string) => t(key, 'vi');
const en = (key: string) => t(key, 'en');

function makeNotification(overrides: Partial<AppNotification>): AppNotification {
  return {
    id: 'notif-1',
    orgId: 'org-1',
    kind: 'low_stock',
    title: 'stored title',
    body: 'stored body',
    templateKey: 'lowStock',
    params: { product: 'Gạo ST25', store: 'HN01', onHand: 9, minLevel: 15 },
    createdAt: new Date('2026-09-11T08:55:00.000Z'),
    ...overrides,
  };
}

describe('notificationLabels', () => {
  it('reads all six rule templates out of the dictionary', () => {
    const labels = notificationLabels(vi);
    expect(Object.keys(labels)).toHaveLength(6);
    expect(labels.lowStock.title).toContain('{product}');
    expect(labels.poAwaiting.body).toContain('{remaining}');
  });
});

describe('notificationText', () => {
  it('renders from the params, ignoring the stored strings', () => {
    const text = notificationText(makeNotification({}), vi);
    expect(text.title).toBe('Gạo ST25 dưới định mức tại HN01');
    expect(text.body).toBe('Còn 9 trên định mức 15');
  });

  it('follows the language rather than the one the row was written in', () => {
    const text = notificationText(makeNotification({}), en);
    expect(text.title).toBe('Gạo ST25 below its minimum at HN01');
  });

  it('formats money params instead of printing raw dong', () => {
    const text = notificationText(
      makeNotification({
        kind: 'overdue_receivable',
        templateKey: 'overdueReceivable',
        params: { customer: 'Minh Long', overdue: 33_800_000, balance: 52_400_000, days: 57 },
      }),
      vi,
    );
    expect(text.title).toContain('33.800.000');
    expect(text.title).not.toContain('33800000');
  });

  it('says expired rather than a negative countdown once the date has passed', () => {
    const expired = makeNotification({
      kind: 'expiring_lot',
      templateKey: 'expiringLot',
      params: { product: 'Sữa tươi', store: 'HN01', lotCode: 'LOT-1', days: -3, qty: 12 },
    });
    expect(templateKeyFor(expired)).toBe('expiredLot');
    const text = notificationText(expired, vi);
    expect(text.title).toBe('Lô LOT-1 đã hết hạn');
    expect(text.body).toContain('quá hạn 3 ngày');
  });

  it('falls back to the kind default when the stored key is not one this rule produces', () => {
    expect(templateKeyFor(makeNotification({ templateKey: 'nonsense' }))).toBe('lowStock');
  });

  it('keeps the stored copy for a row written before params existed', () => {
    const text = notificationText(makeNotification({ params: undefined }), vi);
    expect(text).toEqual({ title: 'stored title', body: 'stored body' });
  });
});

describe('kindLabel', () => {
  it('names every kind', () => {
    expect(kindLabel('low_stock', vi)).toBe('Tồn thấp');
    expect(kindLabel('po_awaiting', vi)).toBe('Đặt hàng');
  });
});

describe('notificationRoute', () => {
  it('points at the thing the row is about', () => {
    expect(notificationRoute(makeNotification({ refType: 'product', refId: 'p1' }))).toBe('/products/p1');
    expect(notificationRoute(makeNotification({ refType: 'customer', refId: 'c1' }))).toBe('/customers/c1');
    expect(notificationRoute(makeNotification({ refType: 'shift', refId: 's1' }))).toBe('/pos/shift');
  });

  it('goes nowhere rather than guessing at an unknown ref', () => {
    expect(notificationRoute(makeNotification({ refType: 'galaxy', refId: 'x' }))).toBeUndefined();
    expect(notificationRoute(makeNotification({ refType: undefined }))).toBeUndefined();
  });
});

describe('groupByDay', () => {
  it('groups newest first and names today and yesterday', () => {
    const days = groupByDay(
      [
        makeNotification({ id: 'a', createdAt: new Date('2026-09-10T20:00:00.000Z') }),
        makeNotification({ id: 'b', createdAt: new Date('2026-09-11T08:00:00.000Z') }),
        makeNotification({ id: 'c', createdAt: new Date('2026-09-02T08:00:00.000Z') }),
      ],
      NOW,
      vi,
    );
    expect(days.map((day) => day.label)).toEqual(['Hôm nay', 'Hôm qua', '02/09/2026']);
    expect(days[0].items.map((item) => item.id)).toEqual(['b']);
  });

  it('labels a day older than yesterday with its date', () => {
    expect(dayLabel('2026-08-30', NOW, vi)).toBe('30/08/2026');
  });
});

describe('relativeTime', () => {
  it('uses the coarsest unit that still says something', () => {
    expect(relativeTime(new Date('2026-09-11T08:59:40.000Z'), NOW, vi)).toBe('Vừa xong');
    expect(relativeTime(new Date('2026-09-11T08:55:00.000Z'), NOW, vi)).toBe('5 phút trước');
    expect(relativeTime(new Date('2026-09-11T07:00:00.000Z'), NOW, vi)).toBe('2 giờ trước');
    expect(relativeTime(new Date('2026-09-09T09:00:00.000Z'), NOW, vi)).toBe('2 ngày trước');
  });
});
