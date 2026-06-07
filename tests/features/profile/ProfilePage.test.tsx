import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { authApi, profileApi } from '@/lib/api/auth-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  authApi: {
    changePassword: vi.fn(),
  },
  profileApi: {
    me: vi.fn(),
    update: vi.fn(),
  },
}));

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function inputById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing input: ${id}`);
  }
  return element;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(clearSession());
    store.dispatch(
      setSession({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          email: 'admin@example.com',
          roles: ['Admin'],
          permissions: ['users:create', 'users:read'],
        },
      })
    );

    vi.mocked(profileApi.me).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      dateOfBirth: '',
      gender: '',
      avatarFileId: '',
    });
    vi.mocked(profileApi.update).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
    });
  });

  it('validates change password and submits successfully', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue({
      success: true,
      message: 'Password updated.',
    });

    renderProfilePage();

    expect(await screen.findByDisplayValue('Ada')).toBeInTheDocument();

    fireEvent.change(inputById('current-password'), { target: { value: 'current-pass' } });
    fireEvent.change(inputById('new-password'), { target: { value: 'short' } });
    fireEvent.change(inputById('confirm-new-password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.changePassword' }));

    expect(await screen.findByText('auth.fixFormErrors')).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();

    fireEvent.change(inputById('new-password'), { target: { value: 'ValidPassword123!' } });
    fireEvent.change(inputById('confirm-new-password'), { target: { value: 'ValidPassword123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.changePassword' }));

    await waitFor(() =>
      expect(authApi.changePassword).toHaveBeenCalledWith({
        currentPassword: 'current-pass',
        newPassword: 'ValidPassword123!',
      })
    );

    expect(await screen.findByText('auth.changePasswordSuccess auth.otherSessionsSignedOut')).toBeInTheDocument();
  });

  it('uses a gender select when updating profile details', async () => {
    vi.mocked(profileApi.me).mockResolvedValue({
      id: '1',
      email: 'admin@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '',
      dateOfBirth: '',
      gender: 'female',
      avatarFileId: '',
    });

    renderProfilePage();

    const gender = await screen.findByLabelText('auth.gender');
    expect(gender).toBeInstanceOf(HTMLSelectElement);
    await waitFor(() => expect(gender).toHaveValue('female'));

    fireEvent.change(gender, { target: { value: 'male' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.saveProfile' }));

    await waitFor(() =>
      expect(profileApi.update).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: 'male',
        })
      )
    );
  });
});
