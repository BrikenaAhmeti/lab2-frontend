import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from '@/pages/portals/AdminDashboardPage';
import NotificationSocketBridge from '@/features/notifications/NotificationSocketBridge';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { dashboardApi } from '@/lib/api/dashboard-api';
import type { DashboardActivity, DashboardStats } from '@/features/dashboard/dashboardTypes';

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

vi.mock('@/features/dashboard/components/DashboardCharts', () => ({
  default: () => (
    <section>
      <h3>Appointments by Status</h3>
      <h3>Revenue Trend</h3>
    </section>
  ),
}));

vi.mock('@/lib/api/dashboard-api', () => ({
  dashboardApi: {
    stats: vi.fn(),
    activity: vi.fn(),
  },
}));

function makeStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    appointments: {
      scheduled: 8,
      checkedIn: 4,
      completed: 6,
      cancelled: 1,
      noShow: 1,
      total: 20,
    },
    checkedInPatients: 4,
    pendingLabOrders: 9,
    lowStockItems: 2,
    revenue: {
      today: 820,
      week: 6400,
      month: 21800,
    },
    revenueTrend: [
      { date: '2026-05-21', total: 700 },
      { date: '2026-05-22', total: 920 },
      { date: '2026-05-23', total: 1100 },
    ],
    updatedAt: '2026-05-27T09:55:00.000Z',
    ...overrides,
  };
}

function makeActivity(overrides: Partial<DashboardActivity> = {}): DashboardActivity {
  return {
    id: 'activity-1',
    actionType: 'appointment_checked_in',
    description: 'Arta Krasniqi checked in for General Consultation',
    actorName: 'Reception Desk',
    entityLabel: 'Open appointment',
    entityLink: '/admin/appointments/appointment-1',
    createdAt: '2026-05-27T09:50:00.000Z',
    ...overrides,
  };
}

function renderPage(withSocket = false) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: {
      auth: {
        accessToken: 'access-token',
        tokens: { accessToken: 'access-token' },
        status: 'authenticated' as const,
        user: {
          id: 'admin-user',
          email: 'admin@medsphere.local',
          roles: ['Admin'],
          permissions: ['dashboard:read'],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          {withSocket && <NotificationSocketBridge />}
          <AdminDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketState.reset();
    vi.mocked(dashboardApi.stats).mockResolvedValue(makeStats());
    vi.mocked(dashboardApi.activity).mockResolvedValue({
      items: [makeActivity()],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('loads MS-54 stats, charts, and recent activity from the backend contracts', async () => {
    renderPage();

    expect(await screen.findByText('Facility Command Center')).toBeInTheDocument();
    expect(await screen.findByText("Today's appointments")).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/4 checked in/)).toBeInTheDocument();
    expect(screen.getByText('Pending lab orders')).toBeInTheDocument();
    expect(screen.getByText('Low stock items')).toBeInTheDocument();
    expect(screen.getByText('Revenue today')).toBeInTheDocument();
    expect(await screen.findByText('Appointments by Status')).toBeInTheDocument();
    expect(screen.getByText('Revenue Trend')).toBeInTheDocument();
    expect(await screen.findByText('Arta Krasniqi checked in for General Consultation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open appointment' })).toHaveAttribute(
      'href',
      '/admin/appointments/appointment-1'
    );
    expect(dashboardApi.stats).toHaveBeenCalledTimes(1);
    expect(dashboardApi.activity).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('adds activity from activity:new and refetches live stats', async () => {
    vi.mocked(dashboardApi.activity).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    renderPage(true);

    expect(await screen.findByText('No activity yet.')).toBeInTheDocument();
    await waitFor(() =>
      expect(socketState.io).toHaveBeenCalledWith('http://localhost:3005', {
        auth: { token: 'access-token' },
      })
    );

    socketState.emit(
      'activity:new',
      makeActivity({
        id: 'activity-2',
        actionType: 'payment_recorded',
        description: 'Payment recorded for BILL-20260527-001',
        actorName: 'Billing Desk',
        entityLabel: 'Open billing',
        entityLink: '/admin/billing',
      })
    );

    expect(await screen.findByText('Payment recorded for BILL-20260527-001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open billing' })).toHaveAttribute('href', '/admin/billing');
    await waitFor(() => expect(dashboardApi.stats).toHaveBeenCalledTimes(2));
  });
});
