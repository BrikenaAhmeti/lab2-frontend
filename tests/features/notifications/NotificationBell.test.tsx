import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '@/app/store';
import NotificationBell from '@/components/layout/NotificationBell';
import NotificationSocketBridge from '@/features/notifications/NotificationSocketBridge';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { clearToasts } from '@/features/ui/uiSlice';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import type { Notification } from '@/features/notifications/notificationTypes';

const socketState = vi.hoisted(() => {
  const handlers = new Map<string, Array<(payload: unknown) => void>>();
  const socket = {
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    }),
    disconnect: vi.fn(),
  };

  return {
    handlers,
    socket,
    io: vi.fn(() => socket),
    emit(event: string, payload: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
    reset() {
      handlers.clear();
      socket.on.mockClear();
      socket.disconnect.mockClear();
      this.io.mockClear();
    },
  };
});

vi.mock('socket.io-client', () => ({
  io: socketState.io,
}));

vi.mock('@/features/notifications/notificationsApi', () => ({
  notificationsApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
}));

const unreadNotification: Notification = {
  id: 'notification-1',
  userId: 'user-1',
  type: 'lab_result',
  title: 'Lab result ready',
  message: 'A new lab result is ready for review.',
  link: null,
  channels: ['in_app'],
  isRead: false,
  readAt: null,
  createdAt: '2026-05-18T08:00:00.000Z',
};

function queryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function setAuthenticatedSession() {
  store.dispatch(
    setSession({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        email: 'admin@medsphere.test',
        roles: ['Admin'],
        permissions: [],
      },
    })
  );
}

function renderNotificationBell(withSocket = false) {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient()}>
        <MemoryRouter>
          {withSocket && <NotificationSocketBridge />}
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketState.reset();
    store.dispatch(clearSession());
    store.dispatch(clearToasts());
    setAuthenticatedSession();
    vi.mocked(notificationsApi.markAllAsRead).mockResolvedValue({ count: 0 });
  });

  it('renders the unread count badge', async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue([unreadNotification]);
    vi.mocked(notificationsApi.unreadCount).mockResolvedValue(3);

    renderNotificationBell();

    expect(await screen.findByRole('button', { name: /3 unread/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks a notification as read from the dropdown', async () => {
    vi.mocked(notificationsApi.list).mockResolvedValue([unreadNotification]);
    vi.mocked(notificationsApi.unreadCount).mockResolvedValue(1);
    vi.mocked(notificationsApi.markAsRead).mockResolvedValue({
      ...unreadNotification,
      isRead: true,
      readAt: '2026-05-18T08:05:00.000Z',
    });

    renderNotificationBell();

    fireEvent.click(await screen.findByRole('button', { name: /1 unread/i }));
    fireEvent.click(await screen.findByText('Lab result ready'));

    await waitFor(() => expect(notificationsApi.markAsRead).toHaveBeenCalledWith('notification-1'));
  });

  it('updates the bell and list when a socket notification arrives', async () => {
    const incoming: Notification = {
      ...unreadNotification,
      id: 'notification-2',
      title: 'Appointment confirmed',
      message: 'Your appointment was confirmed.',
      type: 'appointment_confirmed',
      createdAt: '2026-05-18T09:00:00.000Z',
    };

    vi.mocked(notificationsApi.list).mockResolvedValue([]);
    vi.mocked(notificationsApi.unreadCount).mockResolvedValue(0);

    renderNotificationBell(true);

    await waitFor(() => expect(notificationsApi.list).toHaveBeenCalled());
    await waitFor(() =>
      expect(socketState.io).toHaveBeenCalledWith('http://localhost:3008', {
        auth: { token: 'access-token' },
      })
    );

    socketState.emit('notification:new', incoming);

    expect(await screen.findByRole('button', { name: /1 unread/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /1 unread/i }));

    expect(await screen.findByText('Appointment confirmed')).toBeInTheDocument();
    expect(screen.getByText('Your appointment was confirmed.')).toBeInTheDocument();
  });
});
