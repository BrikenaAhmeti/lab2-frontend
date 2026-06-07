import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ServicesPage from '@/features/services/pages/ServicesPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { departmentsApi } from '@/lib/api/departments-api';
import { servicesApi } from '@/lib/api/services-api';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/api/departments-api', () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/lib/api/services-api', () => ({
  servicesApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const departmentsResponse = {
  items: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Cardiology',
      description: null,
      floor: null,
      phoneExtension: null,
      operatingHours: null,
      isActive: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Dermatology',
      description: null,
      floor: null,
      phoneExtension: null,
      operatingHours: null,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: {
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  },
};

const servicesResponse = {
  items: [
    {
      id: 'service-1',
      departmentId: '11111111-1111-4111-8111-111111111111',
      department: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Cardiology',
        isActive: true,
      },
      name: 'Initial Consultation',
      description: 'Standard first visit',
      defaultDurationMinutes: 30,
      defaultPrice: 50,
      isActive: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

function renderServicesPage(initialEntry: string = '/dashboard/admin/organization/services') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/dashboard/admin/organization/services" element={<ServicesPage />} />
            <Route path="/dashboard/departments/:departmentId/services" element={<ServicesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setUserSession(permissions: string[]) {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions,
      },
    })
  );
}

function inputById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error(`Missing input: ${id}`);
  }
  return element;
}

function selectById(id: string) {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Missing select: ${id}`);
  }
  return element;
}

describe('ServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue(departmentsResponse);
    vi.mocked(servicesApi.list).mockResolvedValue(servicesResponse);
  });

  it('blocks users without services read access', () => {
    setUserSession([]);

    renderServicesPage();

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
  });

  it('shows a read-only table when the user cannot manage services', async () => {
    setUserSession(['services:read']);

    renderServicesPage('/dashboard/admin/organization/services?departmentId=11111111-1111-4111-8111-111111111111');

    expect(await screen.findByText('Initial Consultation')).toBeInTheDocument();
    expect(servicesApi.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      departmentId: '11111111-1111-4111-8111-111111111111',
      isActive: undefined,
    });
    expect(screen.queryByRole('button', { name: 'Add Clinical Service' })).not.toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });

  it('creates a service from the modal form', async () => {
    setUserSession(['services:read', 'services:manage:all']);
    vi.mocked(servicesApi.create).mockResolvedValue({
      ...servicesResponse.items[0],
      id: 'service-2',
      name: 'Follow-up Visit',
    });

    renderServicesPage();

    expect(await screen.findByText('Initial Consultation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Clinical Service' }));
    fireEvent.change(selectById('service-department-id'), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    fireEvent.change(inputById('service-name'), { target: { value: 'Follow-up Visit' } });
    fireEvent.change(inputById('service-duration'), { target: { value: '20' } });
    fireEvent.change(inputById('service-price'), { target: { value: '35' } });
    fireEvent.change(inputById('service-sort-order'), { target: { value: '1' } });
    fireEvent.change(inputById('service-description'), { target: { value: 'Shorter visit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create clinical service' }));

    await waitFor(() =>
      expect(servicesApi.create).toHaveBeenCalledWith({
        departmentId: '22222222-2222-4222-8222-222222222222',
        name: 'Follow-up Visit',
        description: 'Shorter visit',
        defaultDurationMinutes: 20,
        defaultPrice: 35,
        isActive: true,
        sortOrder: 1,
      })
    );

    expect(await screen.findByText('Clinical service created successfully')).toBeInTheDocument();
  });

  it('updates an existing service', async () => {
    setUserSession(['services:read', 'services:manage:all']);
    vi.mocked(servicesApi.update).mockResolvedValue({
      ...servicesResponse.items[0],
      name: 'Updated Consultation',
    });

    renderServicesPage();

    expect(await screen.findByText('Initial Consultation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(inputById('service-name'), { target: { value: 'Updated Consultation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(servicesApi.update).toHaveBeenCalledWith('service-1', {
        departmentId: '11111111-1111-4111-8111-111111111111',
        name: 'Updated Consultation',
        description: 'Standard first visit',
        defaultDurationMinutes: 30,
        defaultPrice: 50,
        isActive: true,
        sortOrder: 0,
      })
    );

    expect(await screen.findByText('Clinical service updated successfully')).toBeInTheDocument();
  });

  it('shows the backend conflict message when delete is blocked', async () => {
    setUserSession(['services:read', 'services:manage:all']);
    vi.mocked(servicesApi.remove).mockRejectedValue(
      Object.assign(new AxiosError('Conflict'), {
        response: {
          data: {
            message: 'Service cannot be deactivated while active appointments reference it',
          },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: {},
        },
      })
    );

    renderServicesPage();

    expect(await screen.findByText('Initial Consultation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);

    expect(
      await screen.findByText('Service cannot be deactivated while active appointments reference it')
    ).toBeInTheDocument();
  });
});
