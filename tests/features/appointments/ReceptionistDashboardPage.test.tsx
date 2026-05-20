import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReceptionistDashboardPage from '@/pages/portals/ReceptionistDashboardPage';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';

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
  const scheduledAt = overrides.scheduledAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const endAt = overrides.endAt ?? new Date(new Date(scheduledAt).getTime() + 30 * 60 * 1000).toISOString();

  return {
    id: 'appointment-1',
    patientId: 'patient-1',
    departmentId: 'department-1',
    serviceCatalogId: 'service-1',
    staffProfileId: 'staff-1',
    status: 'SCHEDULED',
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
      userId: 'user-staff-1',
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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ReceptionistDashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('ReceptionistDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue(makeAppointment({ status: 'CHECKED_IN' }));
    vi.mocked(appointmentsApi.reschedule).mockResolvedValue(makeAppointment());
  });

  it('loads today appointments and sends the backend check-in action', async () => {
    vi.mocked(appointmentsApi.today).mockResolvedValue([makeAppointment()]);

    renderPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));

    await waitFor(() => {
      expect(appointmentsApi.updateStatus).toHaveBeenCalledWith('appointment-1', { action: 'check-in' });
    });
  });

  it('filters the daily board and sends the backend no-show action', async () => {
    const pastAppointment = makeAppointment({
      scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now()).toISOString(),
    });
    const radiologyAppointment = makeAppointment({
      id: 'appointment-2',
      patientId: 'patient-2',
      departmentId: 'department-2',
      staffProfileId: 'staff-2',
      patient: {
        id: 'patient-2',
        firstName: 'Ben',
        lastName: 'Gashi',
        email: 'ben@example.com',
        phone: null,
        name: 'Ben Gashi',
      },
      staff: {
        id: 'staff-2',
        userId: 'user-staff-2',
        employeeCode: 'DR-2',
        specialization: 'Radiologist',
        displayName: 'DR-2 - Radiologist',
      },
      department: {
        id: 'department-2',
        name: 'Radiology',
        isActive: true,
      },
    });
    vi.mocked(appointmentsApi.today).mockResolvedValue([pastAppointment, radiologyAppointment]);
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue({ ...pastAppointment, status: 'NO_SHOW' });

    renderPage();

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'No show' }));

    await waitFor(() => {
      expect(appointmentsApi.updateStatus).toHaveBeenCalledWith('appointment-1', { action: 'no-show' });
    });

    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'department-2' } });

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    expect(screen.getByText('Ben Gashi')).toBeInTheDocument();
  });
});
