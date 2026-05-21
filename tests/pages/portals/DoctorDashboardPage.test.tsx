import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DoctorDashboardPage from '@/pages/portals/DoctorDashboardPage';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';
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

function makeAppointment(overrides: Partial<AppointmentView> = {}): AppointmentView {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    patientId: '22222222-2222-4222-8222-222222222222',
    departmentId: '33333333-3333-4333-8333-333333333333',
    serviceCatalogId: '44444444-4444-4444-8444-444444444444',
    staffProfileId: '55555555-5555-4555-8555-555555555555',
    status: 'CHECKED_IN',
    appointmentType: 'IN_PERSON',
    scheduledAt: '2030-01-02T09:00:00.000Z',
    endAt: '2030-01-02T09:30:00.000Z',
    durationMinutes: 30,
    basePrice: 40,
    notes: null,
    checkedInAt: '2030-01-02T08:55:00.000Z',
    completedAt: null,
    cancelledAt: null,
    cancellationNote: null,
    createdAt: '2030-01-01T09:00:00.000Z',
    updatedAt: '2030-01-01T09:00:00.000Z',
    patient: {
      id: '22222222-2222-4222-8222-222222222222',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+38344111222',
      name: 'Ada Lovelace',
    },
    staff: {
      id: '55555555-5555-4555-8555-555555555555',
      userId: 'doctor-user',
      employeeCode: 'DR-1',
      specialization: 'Cardiologist',
      displayName: 'DR-1 - Cardiologist',
    },
    service: {
      id: '44444444-4444-4444-8444-444444444444',
      name: 'General Consultation',
      defaultDurationMinutes: 30,
      defaultPrice: 40,
    },
    department: {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Cardiology',
      isActive: true,
    },
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
          id: 'doctor-user',
          email: 'doctor@medsphere.local',
          roles: ['Doctor'],
          permissions: ['appointments:read', 'appointments:update'],
          profileId: '55555555-5555-4555-8555-555555555555',
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/doctor']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/consultations/:appointmentId" element={<div>consultation-opened</div>} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('DoctorDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appointmentsApi.today).mockResolvedValue([
      makeAppointment(),
      makeAppointment({
        id: '99999999-9999-4999-8999-999999999999',
        patient: {
          id: '88888888-8888-4888-8888-888888888888',
          firstName: 'Ben',
          lastName: 'Gashi',
          email: 'ben@example.com',
          phone: null,
          name: 'Ben Gashi',
        },
        staffProfileId: '77777777-7777-4777-8777-777777777777',
        staff: {
          id: '77777777-7777-4777-8777-777777777777',
          userId: 'other-doctor',
          employeeCode: 'DR-2',
          specialization: 'Radiologist',
          displayName: 'DR-2 - Radiologist',
        },
      }),
    ]);
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue(makeAppointment({ status: 'IN_PROGRESS' }));
  });

  it('shows the doctor schedule and starts a checked-in consultation through the backend action', async () => {
    renderPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText('Ben Gashi')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start Consultation' }));

    await waitFor(() => {
      expect(appointmentsApi.updateStatus).toHaveBeenCalledWith(
        '11111111-1111-4111-8111-111111111111',
        { action: 'start' }
      );
    });
    expect(await screen.findByText('consultation-opened')).toBeInTheDocument();
  });
});
