import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import authReducer, { setSession } from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { portalConfigs } from '@/layouts/portalConfig';

vi.mock('@/features/chat/components/ChatNavUnreadBadge', () => ({
  default: () => null,
}));

function renderAdminSidebar() {
  const authState = authReducer(
    undefined,
    setSession({
      accessToken: 'access-token',
      user: {
        id: 'admin-1',
        email: 'admin@medsphere.test',
        roles: ['Admin'],
        permissions: [],
      },
    })
  );

  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
    preloadedState: {
      auth: authState,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Sidebar portal={portalConfigs.admin} />
      </MemoryRouter>
    </Provider>
  );
}

describe('Sidebar controls', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it('does not show incomplete language switching in the portal sidebar', () => {
    renderAdminSidebar();

    expect(screen.queryByText('EN')).not.toBeInTheDocument();
    expect(screen.queryByText('DE')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Use light theme' }).length).toBeGreaterThan(0);
  });
});
