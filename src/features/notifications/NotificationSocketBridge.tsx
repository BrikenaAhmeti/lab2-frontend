import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { appointmentQueryKey } from '@/features/appointments/hooks/useAppointments';
import { selectAccessToken, selectIsAuthenticated } from '@/features/auth/authSelectors';
import { enqueueToast } from '@/features/ui/uiSlice';
import { env } from '@/config/env';
import { notificationKeys } from './notificationKeys';
import {
  addNotificationToCache,
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
} from './notificationCache';
import type { Notification } from './notificationTypes';

export default function NotificationSocketBridge() {
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(env.NOTIFICATION_SOCKET_URL, { auth: { token: accessToken } });

    socket.on('notification:new', (notification: Notification) => {
      addNotificationToCache(queryClient, notification);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'inactive' });
      dispatch(
        enqueueToast({
          id: `notification-${notification.id}`,
          title: notification.title,
          description: notification.message,
          variant: 'info',
        })
      );
    });

    socket.on('notification:read', (notification: Notification) => {
      markNotificationReadInCache(queryClient, notification);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'inactive' });
    });

    socket.on('notification:all-read', () => {
      markAllNotificationsReadInCache(queryClient);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all, refetchType: 'inactive' });
    });

    socket.on('appointment-status', () => {
      queryClient.invalidateQueries({ queryKey: appointmentQueryKey.all });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, dispatch, isAuthenticated, queryClient]);

  return null;
}
