import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from '@/features/users/pages/UsersPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { usersApi } from '@/lib/api/auth-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  usersApi: {
    list: vi.fn(),
    createUser: vi.fn(),
  },
}));

function renderUsersPage() {
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
          <UsersPage />
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

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usersApi.list).mockResolvedValue([]);
  });

  it('hides user management from unauthorized users', () => {
    store.dispatch(clearSession());
    store.dispatch(
      setSession({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '2',
          email: 'patient@example.com',
          roles: ['Patient'],
          permissions: [],
        },
      })
    );

    renderUsersPage();

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
  });

  it('submits the admin create user form with multiple roles', async () => {
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
    vi.mocked(usersApi.createUser).mockResolvedValue({
      id: '10',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      roles: ['Admin', 'Doctor'],
    });

    renderUsersPage();

    expect(await screen.findByText('auth.noUsersFound')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'auth.addUser' }));
    fireEvent.change(inputById('create-user-first-name'), { target: { value: 'Grace' } });
    fireEvent.change(inputById('create-user-last-name'), { target: { value: 'Hopper' } });
    fireEvent.change(inputById('create-user-email'), { target: { value: 'grace@example.com' } });
    fireEvent.change(inputById('create-user-password'), { target: { value: 'ValidPassword123!' } });
    fireEvent.change(inputById('create-user-phone'), { target: { value: '+15555550123' } });
    fireEvent.change(inputById('create-user-date-of-birth'), { target: { value: '1980-12-09' } });
    fireEvent.change(inputById('create-user-gender'), { target: { value: 'Female' } });
    fireEvent.change(inputById('create-user-personal-number'), { target: { value: 'EMP-1001' } });

    fireEvent.click(screen.getByLabelText('Admin'));
    fireEvent.click(screen.getByLabelText('Doctor'));
    fireEvent.click(screen.getByLabelText('Patient'));
    fireEvent.click(screen.getByRole('button', { name: 'auth.createUser' }));

    await waitFor(() =>
      expect(usersApi.createUser).toHaveBeenCalledWith({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'ValidPassword123!',
        phone: '+15555550123',
        dateOfBirth: '1980-12-09',
        gender: 'Female',
        personalNumber: 'EMP-1001',
        roles: ['Admin', 'Doctor'],
      })
    );

    expect(await screen.findByText('auth.userCreatedSuccess')).toBeInTheDocument();
  });
});
