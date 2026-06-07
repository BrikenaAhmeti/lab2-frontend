import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DoctorDashboardPage from '@/pages/portals/DoctorDashboardPage';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';
import { labApi, type LabOrderView } from '@/lib/api/lab-api';
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

vi.mock('@/lib/api/lab-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/lab-api')>('@/lib/api/lab-api');

  return {
    ...actual,
    labApi: {
      listOrders: vi.fn(),
      pendingOrders: vi.fn(),
      getOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      enterResults: vi.fn(),
      reviewOrder: vi.fn(),
      triggerAi: vi.fn(),
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

function makeLabOrder(overrides: Partial<LabOrderView> = {}): LabOrderView {
  return {
    id: 'lab-order-1',
    patientId: 'patient-1',
    appointmentId: 'appointment-1',
    medicalRecordId: 'record-1',
    orderedByStaffId: '55555555-5555-4555-8555-555555555555',
    departmentId: 'department-1',
    status: 'COMPLETED',
    priority: 'urgent',
    notes: null,
    orderedAt: '2030-01-02T08:10:00.000Z',
    collectedAt: '2030-01-02T08:40:00.000Z',
    completedAt: '2030-01-02T09:30:00.000Z',
    reviewedAt: null,
    createdAt: '2030-01-02T08:10:00.000Z',
    updatedAt: '2030-01-02T09:30:00.000Z',
    patient: {
      id: 'patient-1',
      userId: 'patient-user',
      firstName: 'Mira',
      lastName: 'Deda',
      email: 'mira@example.com',
      phone: null,
      name: 'Mira Deda',
    },
    appointment: {
      id: 'appointment-1',
      status: 'IN_PROGRESS',
      scheduledAt: '2030-01-02T09:00:00.000Z',
      endAt: '2030-01-02T09:30:00.000Z',
    },
    medicalRecord: {
      id: 'record-1',
      diagnosis: 'Anemia check',
      isFinalized: true,
      createdAt: '2030-01-02T09:10:00.000Z',
    },
    orderedByStaff: {
      id: '55555555-5555-4555-8555-555555555555',
      userId: 'doctor-user',
      employeeCode: 'DR-1',
      specialization: 'Cardiologist',
      displayName: 'DR-1 - Cardiologist',
    },
    department: {
      id: 'department-1',
      name: 'Cardiology',
      isActive: true,
    },
    items: [
      {
        id: 'item-1',
        labTestId: 'test-1',
        resultValue: '6.1',
        resultUnit: 'g/dL',
        resultNotes: null,
        resultStatus: 'CRITICAL',
        isCritical: true,
        completedAt: '2030-01-02T09:30:00.000Z',
        flag: 'critical',
        labTest: {
          id: 'test-1',
          code: 'HGB',
          name: 'Hemoglobin',
          description: null,
          category: 'Hematology',
          sampleType: 'Blood',
          defaultPrice: '12.00',
          referenceRange: '12-16 g/dL',
          isActive: true,
        },
      },
    ],
    ...overrides,
  };
}

function labListResponse(items: LabOrderView[]) {
  return {
    items,
    meta: { page: 1, limit: 100, total: items.length, totalPages: items.length ? 1 : 0 },
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
    vi.mocked(labApi.listOrders).mockResolvedValue(labListResponse([]));
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

  it('shows pending lab reviews from completed backend lab orders', async () => {
    vi.mocked(labApi.listOrders).mockResolvedValue(labListResponse([makeLabOrder()]));

    renderPage();

    const reviewCard = await screen.findByText('Pending Lab Reviews');
    await waitFor(() => {
      expect(within(reviewCard.closest('section')!).getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Pending Reviews' }));

    expect(await screen.findByText('Mira Deda')).toBeInTheDocument();
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review Results' })).toHaveAttribute(
      'href',
      '/doctor/lab-reviews/lab-order-1'
    );
  });
});
