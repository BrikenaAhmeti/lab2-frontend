import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/features/auth/guards/ProtectedRoute';
import authReducer, {
  clearSession,
  setAuthLoading,
  setSession,
  setUnauthenticated,
  type AuthState,
} from '@/features/auth/authSlice';
import { AUTH_STORAGE_KEY } from '@/features/auth/authStorage';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    refresh: mocks.refresh,
  },
}));

function createTestStore(authState?: AuthState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: authState ? { auth: authState } : undefined,
  });
}

function getIdleAuthState() {
  return authReducer(undefined, { type: 'test/init' });
}

function renderWithRoute(initialEntries: string[], authState?: AuthState) {
  const store = createTestStore(authState);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>private-content</div>} />
          </Route>
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows bootstrap skeleton while loading', () => {
    let state = authReducer(getIdleAuthState(), clearSession());
    state = authReducer(state, setAuthLoading());
    renderWithRoute(['/dashboard'], state);

    expect(screen.queryByText('private-content')).not.toBeInTheDocument();
    expect(screen.queryByText('login-page')).not.toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', () => {
    let state = authReducer(getIdleAuthState(), clearSession());
    state = authReducer(state, setUnauthenticated());
    renderWithRoute(['/dashboard'], state);

    expect(screen.getByText('login-page')).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('renders private content for authenticated users', () => {
    const state = authReducer(
      getIdleAuthState(),
      setSession({
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: '1', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );
    renderWithRoute(['/dashboard'], state);

    expect(screen.getByText('private-content')).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('refreshes an idle session before rendering private content', async () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );
    mocks.refresh.mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'next-refresh-token',
      user: { id: '1', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
    });

    renderWithRoute(['/dashboard']);

    expect(screen.queryByText('private-content')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    expect(mocks.refresh).toHaveBeenCalledWith('refresh-token', expect.anything());
    expect(await screen.findByText('private-content')).toBeInTheDocument();
  });

  it('redirects to login when idle session refresh fails', async () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );
    mocks.refresh.mockRejectedValue(new Error('refresh failed'));

    renderWithRoute(['/dashboard']);

    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledTimes(1));
    expect(mocks.refresh).toHaveBeenCalledWith('refresh-token', expect.anything());
    expect(await screen.findByText('login-page')).toBeInTheDocument();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
