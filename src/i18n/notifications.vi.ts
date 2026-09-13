import { registerDictionary } from './registry';

/**
 * The notification centre. `template.*` entries carry `{token}` placeholders filled from the
 * params each rule computed (`src/domain/notify.ts`), so a row written last week renders in
 * whatever language is current now.
 */
export const notificationsVi = {
  title: 'Thông báo',
  unread: '{count} chưa đọc',
  allRead: 'Đã đọc hết',
  empty: 'Không có thông báo nào',
  emptyUnread: 'Không còn thông báo chưa đọc',
  markAllRead: 'Đánh dấu đã đọc tất cả',
  markRead: 'Đánh dấu đã đọc',
  viewAll: 'Xem tất cả thông báo',
  filter: {
    all: 'Tất cả',
    unread: 'Chưa đọc',
  },
  day: {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
  },
  time: {
    justNow: 'Vừa xong',
    minutes: '{count} phút trước',
    hours: '{count} giờ trước',
    days: '{count} ngày trước',
  },
  kind: {
    low_stock: 'Tồn thấp',
    expiring_lot: 'Hạn dùng',
    shift_open: 'Ca làm việc',
    overdue_receivable: 'Công nợ',
    po_awaiting: 'Đặt hàng',
  },
  template: {
    lowStock: {
      title: '{product} dưới định mức tại {store}',
      body: 'Còn {onHand} trên định mức {minLevel}',
    },
    outOfStock: {
      title: '{product} đã hết hàng tại {store}',
      body: 'Định mức {minLevel}, quầy không bán tiếp được',
    },
    expiringLot: {
      title: 'Lô {lotCode} sắp hết hạn',
      body: '{product} tại {store}, còn {qty}, hết hạn sau {days} ngày',
    },
    expiredLot: {
      title: 'Lô {lotCode} đã hết hạn',
      body: '{product} tại {store}, còn {qty}, quá hạn {days} ngày',
    },
    unclosedShift: {
      title: '{store} chưa đóng ca',
      body: 'Ca đã mở {hours} giờ với {orderCount} đơn',
    },
    overdueReceivable: {
      title: '{customer} quá hạn {overdue}',
      body: 'Tổng nợ {balance}, hoá đơn cũ nhất quá hạn {days} ngày',
    },
    poAwaiting: {
      title: '{code} chờ nhận hàng',
      body: '{supplier} · còn {remaining} trên {ordered} sản phẩm về {store}',
    },
  },
  toast: {
    markedAll: 'Đã đánh dấu tất cả là đã đọc',
  },
};

registerDictionary('vi', 'notifications', notificationsVi);
