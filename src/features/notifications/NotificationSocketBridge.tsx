import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { appointmentQueryKey } from '@/features/appointments/hooks/useAppointments';
import { selectAccessToken, selectAuthUser, selectIsAuthenticated } from '@/features/auth/authSelectors';
import { enqueueToast } from '@/features/ui/uiSlice';
import { env } from '@/config/env';
import { addChatMessageToCache, markRoomReadInChatCache } from '@/features/chat/chatCache';
import { chatKeys } from '@/features/chat/chatKeys';
import { addActivityToDashboardCache, activityFromSocketPayload } from '@/features/dashboard/dashboardCache';
import { dashboardKeys } from '@/features/dashboard/dashboardKeys';
import type { ChatMessage, ChatReadPayload } from '@/features/chat/chatTypes';
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
  const user = useAppSelector(selectAuthUser);
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

    socket.on('activity:new', (payload: unknown) => {
      const activity = activityFromSocketPayload(payload);

      if (!activity) return;

      addActivityToDashboardCache(queryClient, activity);
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.activity({ page: 1, limit: 20 }), refetchType: 'inactive' });
    });

    socket.on('chat:message', (message: ChatMessage) => {
      addChatMessageToCache(queryClient, message, user?.id);
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), refetchType: 'inactive' });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount(), refetchType: 'inactive' });
    });

    socket.on('chat:read', (payload: ChatReadPayload) => {
      markRoomReadInChatCache(queryClient, payload, user?.id);
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), refetchType: 'inactive' });
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount(), refetchType: 'inactive' });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, dispatch, isAuthenticated, queryClient, user?.id]);

  return null;
}
