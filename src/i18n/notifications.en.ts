import { registerDictionary } from './registry';

export const notificationsEn = {
  title: 'Notifications',
  unread: '{count} unread',
  allRead: 'All read',
  empty: 'Nothing to report',
  emptyUnread: 'No unread notifications left',
  markAllRead: 'Mark all as read',
  markRead: 'Mark as read',
  viewAll: 'See all notifications',
  filter: {
    all: 'All',
    unread: 'Unread',
  },
  day: {
    today: 'Today',
    yesterday: 'Yesterday',
  },
  time: {
    justNow: 'Just now',
    minutes: '{count} min ago',
    hours: '{count} h ago',
    days: '{count} d ago',
  },
  kind: {
    low_stock: 'Low stock',
    expiring_lot: 'Expiry',
    shift_open: 'Shift',
    overdue_receivable: 'Receivable',
    po_awaiting: 'Purchase order',
  },
  template: {
    lowStock: {
      title: '{product} below its minimum at {store}',
      body: '{onHand} on hand against a minimum of {minLevel}',
    },
    outOfStock: {
      title: '{product} is out of stock at {store}',
      body: 'Minimum {minLevel}, the till cannot sell it',
    },
    expiringLot: {
      title: 'Lot {lotCode} expires soon',
      body: '{product} at {store}, {qty} left, {days} days to expiry',
    },
    expiredLot: {
      title: 'Lot {lotCode} has expired',
      body: '{product} at {store}, {qty} left, {days} days past its date',
    },
    unclosedShift: {
      title: '{store} has a shift still open',
      body: 'Open for {hours} h with {orderCount} orders',
    },
    overdueReceivable: {
      title: '{customer} is {overdue} overdue',
      body: 'Balance {balance}, oldest invoice {days} days past due',
    },
    poAwaiting: {
      title: '{code} is waiting to be received',
      body: '{supplier} · {remaining} of {ordered} items still due at {store}',
    },
  },
  toast: {
    markedAll: 'Everything marked as read',
  },
};

registerDictionary('en', 'notifications', notificationsEn);
