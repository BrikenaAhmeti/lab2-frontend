import { notificationApiClient } from '@/lib/api/axios';
import type {
  Notification,
  NotificationListParams,
  ReadAllNotificationsResponse,
} from './notificationTypes';

type NotificationEnvelope = {
  notification?: Notification;
  data?: Notification | Notification[];
};

type NotificationListEnvelope = {
  data?: Notification[];
  notifications?: Notification[];
  items?: Notification[];
  results?: Notification[];
  total?: number;
  count?: number;
  unreadCount?: number;
  meta?: {
    total?: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function notificationsFromResponse(value: unknown): Notification[] {
  if (Array.isArray(value)) return value as Notification[];
  if (!isRecord(value)) return [];

  const envelope = value as NotificationListEnvelope;
  const candidates = [envelope.data, envelope.notifications, envelope.items, envelope.results];
  const list = candidates.find(Array.isArray);
  return (list ?? []) as Notification[];
}

function notificationFromResponse(value: unknown): Notification {
  if (isRecord(value)) {
    const envelope = value as NotificationEnvelope;
    if (envelope.notification) return envelope.notification;
    if (envelope.data && !Array.isArray(envelope.data)) return envelope.data;
  }
  return value as Notification;
}

function totalFromResponse(value: unknown) {
  if (!isRecord(value)) return undefined;
  const envelope = value as NotificationListEnvelope;
  return envelope.total ?? envelope.count ?? envelope.unreadCount ?? envelope.meta?.total;
}

export const notificationsApi = {
  list(params: NotificationListParams = {}) {
    return notificationApiClient
      .get<unknown>('/api/notifications', { params })
      .then((response) => notificationsFromResponse(response.data));
  },
  unreadCount() {
    return notificationApiClient
      .get<unknown>('/api/notifications', { params: { isRead: false, page: 1, limit: 1 } })
      .then((response) => totalFromResponse(response.data) ?? notificationsFromResponse(response.data).length);
  },
  markAsRead(id: string) {
    return notificationApiClient
      .put<unknown>(`/api/notifications/${id}/read`)
      .then((response) => notificationFromResponse(response.data));
  },
  markAllAsRead() {
    return notificationApiClient
      .put<ReadAllNotificationsResponse>('/api/notifications/read-all')
      .then((response) => response.data);
  },
  delete(id: string) {
    return notificationApiClient.delete(`/api/notifications/${id}`).then((response) => response.data);
  },
};
