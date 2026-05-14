import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '@/pages/admin/organization/SettingsPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { settingsApi } from '@/lib/api/settings-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/settings-api', () => ({
  settingsApi: {
    list: vi.fn(),
    update: vi.fn(),
    updateBulk: vi.fn(),
  },
}));

const settingsResponse = {
  Facility: [
    {
      key: 'facility_name',
      label: 'Facility name',
      category: 'Facility',
      value: 'MedSphere Clinic',
      description: 'Public facility display name',
    },
  ],
  Scheduling: [
    {
      key: 'default_slot_duration',
      label: 'Default slot duration',
      category: 'Scheduling',
      value: 30,
      description: null,
    },
  ],
};

function renderSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/organization/settings']}>
          <Routes>
            <Route path="/admin/organization/settings" element={<SettingsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setUserSession(permissions: string[], roles: string[] = ['Super Admin']) {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles,
        permissions,
      },
    })
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(clearSession());
    vi.mocked(settingsApi.list).mockResolvedValue(settingsResponse);
    vi.mocked(settingsApi.update).mockResolvedValue({
      key: 'facility_name',
      label: 'Facility name',
      category: 'Facility',
      value: 'MedSphere Dental',
      description: 'Public facility display name',
    });
  });

  it('blocks users without settings access', () => {
    setUserSession([], ['Admin']);

    renderSettingsPage();

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
    expect(settingsApi.list).not.toHaveBeenCalled();
  });

  it('renders grouped settings with the organization breadcrumb', async () => {
    setUserSession(['settings:manage']);

    renderSettingsPage();

    expect(await screen.findByText('Facility name')).toBeInTheDocument();
    expect(screen.getByText('Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(within(screen.getByLabelText('Breadcrumb')).getByText('Settings')).toBeInTheDocument();
  });

  it('updates a setting through the Core Service API shape', async () => {
    setUserSession(['settings:manage']);

    renderSettingsPage();

    expect(await screen.findByText('Facility name')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    fireEvent.change(screen.getByDisplayValue('MedSphere Clinic'), {
      target: { value: 'MedSphere Dental' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(settingsApi.update).toHaveBeenCalledWith('facility_name', 'MedSphere Dental'));
    expect(await screen.findByText('Setting saved successfully')).toBeInTheDocument();
  });
});
