import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NurseDashboardPage from '@/pages/portals/NurseDashboardPage';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';
import { staffApi, type StaffRecord } from '@/lib/api/staff-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/appointments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/appointments-api')>('@/lib/api/appointments-api');

  return {
    ...actual,
    appointmentsApi: {
      list: vi.fn(),
      today: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      reschedule: vi.fn(),
      updateStatus: vi.fn(),
      availableSlots: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/staff-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/staff-api')>('@/lib/api/staff-api');

  return {
    ...actual,
    staffApi: {
      list: vi.fn(),
      publicList: vi.fn(),
      get: vi.fn(),
      deactivate: vi.fn(),
      addDepartment: vi.fn(),
      removeDepartment: vi.fn(),
      schedules: vi.fn(),
      saveSchedules: vi.fn(),
      exceptions: vi.fn(),
      createException: vi.fn(),
      deleteException: vi.fn(),
    },
  };
});

function makeAppointment(overrides: Partial<AppointmentView> = {}): AppointmentView {
  const scheduledAt = overrides.scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const endAt = overrides.endAt ?? new Date(new Date(scheduledAt).getTime() + 30 * 60 * 1000).toISOString();

  return {
    id: 'appointment-1',
    patientId: 'patient-1',
    departmentId: 'department-1',
    serviceCatalogId: 'service-1',
    staffProfileId: 'staff-1',
    status: 'CHECKED_IN',
    appointmentType: 'IN_PERSON',
    scheduledAt,
    endAt,
    durationMinutes: 30,
    basePrice: 40,
    notes: null,
    checkedInAt: null,
    completedAt: null,
    cancelledAt: null,
    cancellationNote: null,
    createdAt: '2026-05-19T00:00:00.000Z',
    updatedAt: '2026-05-19T00:00:00.000Z',
    patient: {
      id: 'patient-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+38344111222',
      name: 'Ada Lovelace',
    },
    staff: {
      id: 'staff-1',
      userId: 'doctor-user',
      employeeCode: 'DR-1',
      specialization: 'Cardiologist',
      displayName: 'DR-1 - Cardiologist',
    },
    service: {
      id: 'service-1',
      name: 'General Consultation',
      defaultDurationMinutes: 30,
      defaultPrice: 40,
    },
    department: {
      id: 'department-1',
      name: 'Cardiology',
      isActive: true,
    },
    ...overrides,
  };
}

function makeNurseProfile(overrides: Partial<StaffRecord> = {}): StaffRecord {
  return {
    id: 'nurse-profile-1',
    userId: 'nurse-user',
    user: { id: 'nurse-user', email: 'nurse@example.com' },
    departments: [
      {
        id: 'assignment-1',
        departmentId: 'department-1',
        isPrimary: true,
        department: { id: 'department-1', name: 'Cardiology', isActive: true },
      },
      {
        id: 'assignment-2',
        departmentId: 'department-2',
        isPrimary: false,
        department: { id: 'department-2', name: 'Radiology', isActive: true },
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        accessToken: 'token',
        tokens: { accessToken: 'token' },
        status: 'authenticated' as const,
        user: {
          id: 'nurse-user',
          email: 'nurse@medsphere.local',
          roles: ['Nurse'],
          permissions: ['appointments:read', 'appointments:update', 'staff:read'],
          profileId: 'nurse-profile-1',
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/nurse']}>
        <QueryClientProvider client={queryClient}>
          <NurseDashboardPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('NurseDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(staffApi.get).mockResolvedValue(makeNurseProfile());
    vi.mocked(appointmentsApi.today).mockResolvedValue([
      makeAppointment(),
      makeAppointment({
        id: 'appointment-2',
        patientId: 'patient-2',
        departmentId: 'department-2',
        patient: {
          id: 'patient-2',
          firstName: 'Ben',
          lastName: 'Gashi',
          email: 'ben@example.com',
          phone: null,
          name: 'Ben Gashi',
        },
        department: { id: 'department-2', name: 'Radiology', isActive: true },
      }),
    ]);
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue(makeAppointment({ status: 'IN_PROGRESS' }));
  });

  it('scopes today appointments to the nurse department and marks the patient ready via backend start action', async () => {
    renderPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Ben Gashi')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark ready' }));

    await waitFor(() => {
      expect(appointmentsApi.updateStatus).toHaveBeenCalledWith('appointment-1', { action: 'start' });
    });

    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'department-2' } });

    await waitFor(() => {
      expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
      expect(screen.getByText('Ben Gashi')).toBeInTheDocument();
    });
  });
});

