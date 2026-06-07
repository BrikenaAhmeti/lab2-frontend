import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  Bell,
  CalendarClock,
  CheckCheck,
  FlaskConical,
  Info,
  MessageSquare,
  PackageCheck,
  Pill,
  type LucideIcon,
} from 'lucide-react';
import {
  useNotificationActions,
  useRecentNotifications,
  useUnreadNotificationCount,
} from '@/features/notifications/useNotifications';
import type { Notification } from '@/features/notifications/notificationTypes';

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

function notificationIcon(type: string): LucideIcon {
  const normalized = type.toLowerCase();
  if (normalized.includes('appointment')) return CalendarClock;
  if (normalized.includes('lab')) return FlaskConical;
  if (normalized.includes('prescription') || normalized.includes('pharmacy')) return Pill;
  if (normalized.includes('inventory') || normalized.includes('stock')) return PackageCheck;
  if (normalized.includes('chat') || normalized.includes('message')) return MessageSquare;
  return Info;
}

function preview(message: string) {
  return message.length > 96 ? `${message.slice(0, 93)}...` : message;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useRecentNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { markAsRead, markAllAsRead } = useNotificationActions();
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const goToNotification = (notification: Notification) => {
    const link = notification.link?.trim();
    if (!link) return;

    if (/^https?:\/\//.test(link)) {
      window.location.assign(link);
      return;
    }

    navigate(link.startsWith('/') ? link : `/${link}`);
  };

  const onNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead.mutateAsync(notification);
      }
    } finally {
      goToNotification(notification);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground shadow-soft transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <section
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-card shadow-panel"
          aria-label="Recent notifications"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => markAllAsRead.mutate()}
              disabled={unreadCount === 0 || markAllAsRead.isPending}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all
            </button>
          </div>

          <ul className="max-h-96 overflow-y-auto py-2">
            {isLoading && (
              <li className="px-4 py-6 text-center text-sm text-muted">Loading notifications...</li>
            )}

            {!isLoading && notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">No notifications yet</li>
            )}

            {!isLoading &&
              notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={clsx(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring',
                        !notification.isRead && 'bg-primary/5'
                      )}
                      onClick={() => onNotificationClick(notification)}
                    >
                      <span
                        className={clsx(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                          notification.isRead
                            ? 'bg-surface text-muted'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span className="line-clamp-1 text-sm font-semibold text-foreground">
                            {notification.title}
                          </span>
                          <time className="shrink-0 text-xs text-muted" dateTime={notification.createdAt}>
                            {relativeTime(notification.createdAt)}
                          </time>
                        </span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                          {preview(notification.message)}
                        </span>
                      </span>
                      {!notification.isRead && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary">
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      )}
    </div>
  );
}
