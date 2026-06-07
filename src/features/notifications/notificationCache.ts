import type { QueryClient } from '@tanstack/react-query';
import { notificationKeys } from './notificationKeys';
import type { Notification } from './notificationTypes';

function notificationKnown(queryClient: QueryClient, id: string) {
  return queryClient
    .getQueriesData<Notification[]>({ queryKey: notificationKeys.lists() })
    .some(([, notifications]) => notifications?.some((notification) => notification.id === id));
}

function decrementUnreadCount(queryClient: QueryClient) {
  queryClient.setQueryData<number>(notificationKeys.unreadCount(), (count) => Math.max((count ?? 0) - 1, 0));
}

export function addNotificationToCache(queryClient: QueryClient, notification: Notification) {
  const wasKnown = notificationKnown(queryClient, notification.id);

  queryClient.setQueriesData<Notification[]>({ queryKey: notificationKeys.lists() }, (notifications) => {
    if (!notifications) return notifications;
    if (notifications.some((item) => item.id === notification.id)) return notifications;
    return [notification, ...notifications];
  });

  if (!wasKnown && !notification.isRead) {
    queryClient.setQueryData<number>(notificationKeys.unreadCount(), (count) => (count ?? 0) + 1);
  }
}

export function markNotificationReadInCache(queryClient: QueryClient, notification: Notification) {
  let wasFound = false;
  let wasUnread = false;

  queryClient.setQueriesData<Notification[]>({ queryKey: notificationKeys.lists() }, (notifications) => {
    if (!notifications) return notifications;

    return notifications.map((item) => {
      if (item.id !== notification.id) return item;
      wasFound = true;
      if (!item.isRead) wasUnread = true;
      return { ...item, ...notification, isRead: true };
    });
  });

  if (wasUnread || (!wasFound && notification.isRead)) decrementUnreadCount(queryClient);
}

export function markAllNotificationsReadInCache(queryClient: QueryClient) {
  queryClient.setQueriesData<Notification[]>({ queryKey: notificationKeys.lists() }, (notifications) =>
    notifications?.map((notification) => ({
      ...notification,
      isRead: true,
      readAt: notification.readAt ?? new Date().toISOString(),
    }))
  );
  queryClient.setQueryData(notificationKeys.unreadCount(), 0);
}
