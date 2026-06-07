import type { NotificationListParams } from './notificationTypes';

export const recentNotificationsParams = { page: 1, limit: 8 } as const;

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationListParams = {}) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};
