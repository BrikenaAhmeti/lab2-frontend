import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { selectAccessToken } from '@/features/auth/authSelectors';
import { notificationKeys, recentNotificationsParams } from './notificationKeys';
import { notificationsApi } from './notificationsApi';
import {
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
} from './notificationCache';
import type { Notification } from './notificationTypes';

export function useRecentNotifications() {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery({
    queryKey: notificationKeys.list(recentNotificationsParams),
    queryFn: () => notificationsApi.list(recentNotificationsParams),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  const accessToken = useAppSelector(selectAccessToken);

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (notification: Notification) => notificationsApi.markAsRead(notification.id),
    onSuccess: (updated) => {
      markNotificationReadInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'inactive' });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      markAllNotificationsReadInCache(queryClient);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'inactive' });
    },
  });

  return { markAsRead, markAllAsRead };
}
