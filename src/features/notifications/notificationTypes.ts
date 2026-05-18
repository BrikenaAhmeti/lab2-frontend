export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  channels: string[];
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface ReadAllNotificationsResponse {
  count: number;
}
