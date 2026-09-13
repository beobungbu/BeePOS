/**
 * The notification centre's starting contents.
 *
 * Produced by running `src/domain/notify.ts` over the seeded state rather than by writing
 * eight rows out by hand, so the seed cannot claim a shortage the stock table does not have.
 * Two rows per rule keeps all five rules represented; the first eight are kept, which is a
 * list long enough to scroll on a phone and short enough to read.
 *
 * The copy lives here rather than in a dictionary because the domain owns no locale and the
 * shared vi/en dictionaries belong to the screen phase. The settings worker replaces
 * `SEED_NOTIFICATION_LABELS` with dictionary lookups when the notification screen lands.
 */

import type { AppNotification } from '../../domain/types';
import { buildNotifications, type NotificationLabels } from '../../domain/notify';
import { DEMO_ORG_ID } from './org';
import { SEED_NOW } from './clock';
import { products } from './products';
import { stores } from './stores';
import { stockLevels } from './stock';
import { lots } from './lots';
import { shifts } from './orders';
import { customers } from './customers';
import { suppliers } from './suppliers';
import { ledgerEntries } from './money';
import { purchaseOrders } from './purchasing';

/** How many notifications the seeded centre starts with. */
export const SEED_NOTIFICATION_COUNT = 8;

export const SEED_NOTIFICATION_LABELS: NotificationLabels = {
  lowStock: {
    title: 'Sắp hết hàng',
    body: '{product} tại {store} chỉ còn {onHand}, mức tối thiểu là {minLevel}.',
  },
  outOfStock: {
    title: 'Hết hàng',
    body: '{product} tại {store} đã hết, mức tối thiểu là {minLevel}.',
  },
  expiringLot: {
    title: 'Lô hàng sắp hết hạn',
    body: 'Lô {lotCode} của {product} tại {store} còn {qty}, hạn sử dụng còn {days} ngày.',
  },
  unclosedShift: {
    title: 'Ca chưa chốt',
    body: 'Ca tại {store} đã mở {hours} giờ với {orderCount} đơn mà chưa chốt.',
  },
  overdueReceivable: {
    title: 'Công nợ quá hạn',
    body: '{customer} còn nợ quá hạn {overdue} đ, trễ {days} ngày.',
  },
  poAwaiting: {
    title: 'Đơn đặt hàng chờ nhận',
    body: 'Đơn {code} từ {supplier} về {store} còn {remaining}/{ordered} chưa nhận.',
  },
};

export const notifications: AppNotification[] = buildNotifications({
  orgId: DEMO_ORG_ID,
  now: SEED_NOW,
  labels: SEED_NOTIFICATION_LABELS,
  products,
  stores,
  stockLevels,
  lots,
  shifts,
  ledgerEntries,
  customers,
  purchaseOrders,
  suppliers,
  limitPerRule: 2,
})
  .slice(0, SEED_NOTIFICATION_COUNT)
  // The two oldest arrive already read, so the unread badge is not simply the list length.
  .map((notification, index) =>
    index >= SEED_NOTIFICATION_COUNT - 2 ? { ...notification, readAt: SEED_NOW } : notification,
  );
