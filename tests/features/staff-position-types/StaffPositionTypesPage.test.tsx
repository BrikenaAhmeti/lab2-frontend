import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffPositionTypesPage from '@/pages/admin/organization/StaffPositionTypesPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { departmentsApi } from '@/lib/api/departments-api';
import { staffPositionTypesApi } from '@/lib/api/staff-position-types-api';

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

vi.mock('@/lib/api/staff-position-types-api', () => ({
  staffPositionTypesApi: {
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
      name: 'Radiology',
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
      name: 'Emergency',
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

const listResponse = {
  items: [
    {
      id: 'type-1',
      name: 'Radiologic Technologist',
      description: 'Imaging specialist',
      defaultRoleKey: 'lab_technician',
      defaultRoleName: 'Lab Technician',
      applicableDepartmentIds: ['11111111-1111-4111-8111-111111111111'],
      applicableDepartments: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Radiology',
          isActive: true,
        },
      ],
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'type-2',
      name: 'Triage Coordinator',
      description: null,
      defaultRoleKey: 'nurse',
      defaultRoleName: 'Nurse',
      applicableDepartmentIds: [],
      applicableDepartments: [],
      isActive: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

function renderStaffPositionTypesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard/admin/organization/staff-position-types']}>
          <Routes>
            <Route path="/dashboard/admin/organization/staff-position-types" element={<StaffPositionTypesPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setUserSession(permissions: string[], roles: string[] = ['Admin']) {
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

describe('StaffPositionTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue(departmentsResponse);
    vi.mocked(staffPositionTypesApi.list).mockResolvedValue(listResponse);
  });

  it('blocks users without admin or staff position type access', () => {
    setUserSession([], ['Doctor']);

    renderStaffPositionTypesPage();

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
  });

  it('renders table rows from the API response', async () => {
    setUserSession(['staff-position-types:read'], ['Doctor']);

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();
    expect(screen.getByText('Lab Technician')).toBeInTheDocument();
    expect(screen.getByText('Triage Coordinator')).toBeInTheDocument();
  });

  it('renders department names from applicableDepartments', async () => {
    setUserSession(['staff-position-types:read'], ['Doctor']);

    renderStaffPositionTypesPage();

    expect((await screen.findAllByText('Radiology')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('All departments').length).toBeGreaterThan(0);
  });

  it('sends pagination and filter params to the backend', async () => {
    setUserSession(['staff-position-types:read'], ['Doctor']);

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();
    expect(staffPositionTypesApi.list).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      departmentId: undefined,
      isActive: undefined,
    });

    fireEvent.change(inputById('staff-position-type-search'), { target: { value: 'triage' } });
    fireEvent.change(selectById('staff-position-type-department-filter'), {
      target: { value: '22222222-2222-4222-8222-222222222222' },
    });
    fireEvent.change(selectById('staff-position-type-status-filter'), { target: { value: 'active' } });

    await waitFor(() =>
      expect(staffPositionTypesApi.list).toHaveBeenLastCalledWith({
        page: 1,
        limit: 10,
        search: 'triage',
        departmentId: '22222222-2222-4222-8222-222222222222',
        isActive: true,
      })
    );
  });

  it('validates required name and default role fields', async () => {
    setUserSession(['staff-position-types:manage:all']);

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Staff Position Type' }));
    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Super Admin' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create staff position type' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(await screen.findByText('Default role is required')).toBeInTheDocument();
    expect(staffPositionTypesApi.create).not.toHaveBeenCalled();
  });

  it('creates a staff position type', async () => {
    setUserSession(['staff-position-types:manage:all']);
    vi.mocked(staffPositionTypesApi.create).mockResolvedValue({
      ...listResponse.items[0],
      id: 'type-3',
      name: 'ER Nurse',
      defaultRoleKey: 'nurse',
      defaultRoleName: 'Nurse',
      applicableDepartmentIds: ['22222222-2222-4222-8222-222222222222'],
      applicableDepartments: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Emergency',
          isActive: true,
        },
      ],
    });

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add Staff Position Type' }));
    fireEvent.change(inputById('staff-position-type-name'), { target: { value: 'ER Nurse' } });
    fireEvent.change(selectById('staff-position-type-default-role-key'), { target: { value: 'nurse' } });
    fireEvent.change(inputById('staff-position-type-description'), { target: { value: 'Emergency intake support' } });
    fireEvent.click(screen.getByRole('button', { name: 'Emergency' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create staff position type' }));

    await waitFor(() =>
      expect(staffPositionTypesApi.create).toHaveBeenCalledWith({
        name: 'ER Nurse',
        description: 'Emergency intake support',
        defaultRoleKey: 'nurse',
        applicableDepartmentIds: ['22222222-2222-4222-8222-222222222222'],
        isActive: true,
      })
    );

    expect(await screen.findByText('Staff position type created successfully')).toBeInTheDocument();
  });

  it('updates an existing staff position type', async () => {
    setUserSession(['staff-position-types:manage:all']);
    vi.mocked(staffPositionTypesApi.update).mockResolvedValue({
      ...listResponse.items[0],
      name: 'Senior Radiologic Technologist',
    });

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    fireEvent.change(inputById('staff-position-type-name'), { target: { value: 'Senior Radiologic Technologist' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(staffPositionTypesApi.update).toHaveBeenCalledWith('type-1', {
        name: 'Senior Radiologic Technologist',
        description: 'Imaging specialist',
        defaultRoleKey: 'lab_technician',
        applicableDepartmentIds: ['11111111-1111-4111-8111-111111111111'],
        isActive: true,
      })
    );

    expect(await screen.findByText('Staff position type updated successfully')).toBeInTheDocument();
  });

  it('keeps admin position types read-only for clinical admins', async () => {
    setUserSession(['staff-position-types:manage:all']);
    vi.mocked(staffPositionTypesApi.list).mockResolvedValue({
      ...listResponse,
      items: [
        {
          ...listResponse.items[0],
          id: 'type-admin',
          name: 'Clinical Administrator',
          defaultRoleKey: 'admin',
          defaultRoleName: 'Admin',
        },
        listResponse.items[1],
      ],
    });

    renderStaffPositionTypesPage();

    const adminRow = (await screen.findByText('Clinical Administrator')).closest('tr');
    const nurseRow = screen.getByText('Triage Coordinator').closest('tr');

    expect(adminRow).not.toBeNull();
    expect(nurseRow).not.toBeNull();
    expect(within(adminRow as HTMLElement).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(adminRow as HTMLElement).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(within(adminRow as HTMLElement).getByText('Read only')).toBeInTheDocument();
    expect(within(nurseRow as HTMLElement).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(nurseRow as HTMLElement).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows a clear delete guard message for backend conflicts', async () => {
    setUserSession(['staff-position-types:manage:all']);
    vi.mocked(staffPositionTypesApi.remove).mockRejectedValue(
      Object.assign(new AxiosError('Conflict'), {
        response: {
          data: {
            message: 'This staff position type cannot be deleted because staff profiles are still assigned to it.',
          },
          status: 409,
          statusText: 'Conflict',
          headers: {},
          config: {},
        },
      })
    );

    renderStaffPositionTypesPage();

    expect(await screen.findByText('Radiologic Technologist')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    const dialog = await screen.findByText('Delete staff position type?');
    fireEvent.click(within(dialog.parentElement as HTMLElement).getByRole('button', { name: 'Delete' }));

    expect(
      await screen.findByText('This staff position type cannot be deleted because staff profiles are still assigned to it.')
    ).toBeInTheDocument();
  });
});
