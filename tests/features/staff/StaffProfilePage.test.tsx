import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffProfilePage from '@/features/staff/pages/StaffProfilePage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { staffApi } from '@/lib/api/staff-api';
import { departmentsApi } from '@/lib/api/departments-api';

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: {
    get: vi.fn(),
    deactivate: vi.fn(),
    schedules: vi.fn(),
    saveSchedules: vi.fn(),
    exceptions: vi.fn(),
    createException: vi.fn(),
    deleteException: vi.fn(),
    addDepartment: vi.fn(),
    removeDepartment: vi.fn(),
  },
}));

vi.mock('@/lib/api/departments-api', () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

const staff = {
  id: 'staff-1',
  user: {
    id: 'user-1',
    firstName: 'Ariana',
    lastName: 'Kelmendi',
    email: 'ariana@example.com',
    phone: '+38344111222',
  },
  positionType: {
    id: 'type-1',
    name: 'Cardiologist',
  },
  specialization: 'Cardiology',
  employmentStatus: 'active',
  departments: [{ id: 'department-1', name: 'Cardiology' }],
  futureAppointmentsCount: 3,
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.search}</span>;
}

function setUserSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions: [],
      },
    })
  );
}

function renderProfile(path = '/admin/staff/staff-1?tab=schedule') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/admin/staff/:id"
              element={
                <>
                  <StaffProfilePage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('StaffProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserSession();
    vi.mocked(staffApi.get).mockResolvedValue(staff);
    vi.mocked(staffApi.schedules).mockResolvedValue([]);
    vi.mocked(staffApi.exceptions).mockResolvedValue([]);
    vi.mocked(staffApi.deactivate).mockResolvedValue(staff);
    vi.mocked(departmentsApi.list).mockResolvedValue({
      items: [
        {
          id: 'department-2',
          name: 'Radiology',
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
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it('loads the schedule tab from the URL and keeps tab changes in search params', async () => {
    renderProfile();

    expect(await screen.findByText('Weekly schedule')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=schedule');

    fireEvent.click(screen.getByRole('button', { name: 'Exceptions' }));

    expect(await screen.findByText('Schedule exceptions')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=exceptions');
  });

  it('shows the future appointment count before deactivation', async () => {
    renderProfile('/admin/staff/staff-1?tab=info');

    expect(await screen.findByText('Personal info')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(screen.getByText(/has 3 future appointments/i)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate' }).at(-1)!);

    await waitFor(() => expect(staffApi.deactivate).toHaveBeenCalledWith('staff-1'));
  });
});
