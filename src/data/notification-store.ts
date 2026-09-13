/**
 * The notification centre.
 *
 * The list is derived state: `src/domain/notify.ts` recomputes it from stock, lots, shifts,
 * the ledger and the purchase orders, and `refresh` merges the result so a notification that
 * was read stays read and one that no longer applies disappears rather than lingering.
 */

import { create } from 'zustand';
import type { AppNotification } from '../domain/types';
import {
  buildNotifications,
  mergeNotifications,
  unreadCount,
  type NotificationInput,
} from '../domain/notify';
import { notifications as seedNotifications } from './seed';
import { demoSeed } from './chain-seed';

interface NotificationState {
  notifications: AppNotification[];
  /** Recomputes from current state, preserving read marks. Returns the new list. */
  refresh: (input: NotificationInput) => AppNotification[];
  markRead: (notificationId: string, at?: Date) => void;
  markAllRead: (at?: Date) => void;
  dismiss: (notificationId: string) => void;
}

/** The alerts a chain starts with; a new chain has nothing to be alerted about yet. */
export function notificationSeedForActiveOrg(): Pick<NotificationState, 'notifications'> {
  return { notifications: demoSeed(seedNotifications, []) };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...notificationSeedForActiveOrg(),

  refresh: (input) => {
    const merged = mergeNotifications(get().notifications, buildNotifications(input));
    set({ notifications: merged });
    return merged;
  },

  markRead: (notificationId, at = new Date()) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId && !notification.readAt
          ? { ...notification, readAt: at }
          : notification,
      ),
    })),

  markAllRead: (at = new Date()) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt: at },
      ),
    })),

  dismiss: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    })),
}));

/** Unread count for the bell badge. */
export function useUnreadNotificationCount(): number {
  return useNotificationStore((state) => unreadCount(state.notifications));
}
