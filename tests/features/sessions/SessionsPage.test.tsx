import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SessionsPage from '@/features/sessions/pages/SessionsPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { sessionsApi } from '@/lib/api/auth-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  sessionsApi: {
    list: vi.fn(),
    logs: vi.fn(),
    revoke: vi.fn(),
    adminRevoke: vi.fn(),
  },
}));

function renderSessionsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/sessions']}>
          <Routes>
            <Route path="/admin/sessions" element={<SessionsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setAdminSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'admin-1',
        email: 'admin@medsphere.local',
        roles: ['Super Admin'],
        permissions: ['users:read:all', 'users:update:all'],
      },
    })
  );
}

describe('SessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAdminSession();
    vi.mocked(sessionsApi.list).mockResolvedValue([
      {
        id: 'session-1',
        userId: 'admin-1',
        deviceInfo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36',
        ipAddress: '::ffff:172.20.0.1',
        createdAt: '2026-06-02T12:00:00.000Z',
        lastUsedAt: '2026-06-02T12:10:00.000Z',
        expiresAt: '2026-06-09T12:00:00.000Z',
        user: {
          id: 'admin-1',
          email: 'admin@medsphere.local',
          username: 'admin',
          firstName: 'System',
          lastName: 'Admin',
        },
      },
    ]);
    vi.mocked(sessionsApi.logs).mockResolvedValue({
      items: [
        {
          id: 'audit-1',
          userId: 'admin-1',
          action: 'session.revoked.admin',
          entity: 'refresh_token',
          entityId: 'session-2',
          oldValue: {
            user: { email: 'doctor@medsphere.local', username: 'doctor' },
            deviceInfo: 'Chrome on macOS',
          },
          newValue: { status: 'revoked', revokedByUserId: 'admin-1' },
          ipAddress: '127.0.0.1',
          userAgent: 'node',
          createdAt: '2026-06-02T13:00:00.000Z',
          actor: {
            id: 'admin-1',
            email: 'admin@medsphere.local',
            username: 'admin',
            firstName: 'System',
            lastName: 'Admin',
          },
        },
      ],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
  });

  it('shows active sessions as readable user/device cards', async () => {
    renderSessionsPage();

    expect(await screen.findByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('System Admin')).toBeInTheDocument();
    expect(screen.getByText('@admin · admin@medsphere.local')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin revoke' })).toBeInTheDocument();
  });

  it('shows log tab filters and actor details', async () => {
    renderSessionsPage();

    fireEvent.click(screen.getByRole('tab', { name: 'Logs' }));

    expect(await screen.findByText('Performed by')).toBeInTheDocument();
    expect(screen.getAllByText('Session revoked by admin').length).toBeGreaterThan(0);
    expect(screen.getByText('@admin · admin@medsphere.local')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('User'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'session.revoked.admin' } });
    fireEvent.change(screen.getByLabelText('Change or detail'), { target: { value: 'device' } });

    await waitFor(() =>
      expect(sessionsApi.logs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userSearch: 'admin',
          action: 'session.revoked.admin',
          changed: 'device',
        })
      )
    );
  });
});
