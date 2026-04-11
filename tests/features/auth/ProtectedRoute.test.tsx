import { describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '@/features/auth/guards/ProtectedRoute';
import { store } from '@/app/store';
import { clearSession, setAuthLoading, setSession, setUnauthenticated } from '@/features/auth/authSlice';

function renderWithRoute(initialEntries: string[]) {
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
  it('shows bootstrap skeleton while loading', () => {
    store.dispatch(clearSession());
    store.dispatch(setAuthLoading());
    renderWithRoute(['/dashboard']);

    expect(screen.queryByText('private-content')).not.toBeInTheDocument();
    expect(screen.queryByText('login-page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    store.dispatch(clearSession());
    store.dispatch(setUnauthenticated());
    renderWithRoute(['/dashboard']);

    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('renders private content for authenticated users', () => {
    store.dispatch(
      setSession({
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: '1', email: 'doctor@medsphere.com', roles: ['Doctor'], permissions: ['patients:read:own'] },
      })
    );
    renderWithRoute(['/dashboard']);

    expect(screen.getByText('private-content')).toBeInTheDocument();
  });
});
