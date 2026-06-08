import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentsPage from '@/features/appointments/pages/AppointmentsPage';
import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import { appointmentsApi, type AppointmentView, type AvailableSlotsResponse } from '@/lib/api/appointments-api';

vi.mock('@/features/auth/hooks/useResolvedPatientSession', () => ({
  useResolvedPatientSession: vi.fn(),
}));

vi.mock('@/lib/api/appointments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/appointments-api')>('@/lib/api/appointments-api');

  return {
    ...actual,
    appointmentsApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      publicCreate: vi.fn(),
      reschedule: vi.fn(),
      updateStatus: vi.fn(),
      availableSlots: vi.fn(),
      publicAvailableSlots: vi.fn(),
    },
  };
});

const appointment: AppointmentView = {
  id: 'appointment-1',
  patientId: 'patient-1',
  departmentId: 'department-1',
  serviceCatalogId: 'service-1',
  staffProfileId: 'staff-1',
  status: 'SCHEDULED',
  appointmentType: 'IN_PERSON',
  scheduledAt: '2030-05-20T09:00:00.000Z',
  endAt: '2030-05-20T09:30:00.000Z',
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
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: null,
    name: 'Arta Krasniqi',
  },
  staff: {
    id: 'staff-1',
    userId: 'user-staff-1',
    employeeCode: 'DR-1',
    specialization: 'Cardiologist',
    displayName: 'Dr. Rivera',
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
};

const slots: AvailableSlotsResponse = {
  staffProfileId: 'staff-1',
  serviceId: 'service-1',
  date: '2026-06-08',
  slots: [
    {
      start: '2030-05-20T10:00:00.000Z',
      end: '2030-05-20T10:30:00.000Z',
      startTime: '10:00',
      endTime: '10:30',
      durationMinutes: 30,
    },
  ],
};

function renderPage(mode: 'patient' | 'receptionist' | 'nurse' = 'patient') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AppointmentsPage mode={mode} />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('AppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useResolvedPatientSession).mockReturnValue({
      patientId: 'patient-1',
      patient: null,
      user: null,
      isResolving: false,
      isError: false,
      error: null,
    });
    vi.mocked(appointmentsApi.list).mockResolvedValue({
      items: [appointment],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(appointmentsApi.availableSlots).mockResolvedValue(slots);
    vi.mocked(appointmentsApi.publicAvailableSlots).mockResolvedValue(slots);
    vi.mocked(appointmentsApi.reschedule).mockResolvedValue({
      ...appointment,
      scheduledAt: slots.slots[0].start,
      endAt: slots.slots[0].end,
    });
    vi.mocked(appointmentsApi.updateStatus).mockResolvedValue({
      ...appointment,
      status: 'CANCELLED',
      cancelledAt: '2030-05-19T12:00:00.000Z',
      cancellationNote: 'Need to move',
    });
  });

  it('uses public slot lookup when a patient reschedules an appointment', async () => {
    renderPage('patient');

    fireEvent.click(await screen.findByRole('button', { name: 'Reschedule' }));

    await waitFor(() => {
      expect(appointmentsApi.publicAvailableSlots).toHaveBeenCalledWith(
        'staff-1',
        expect.objectContaining({ serviceId: 'service-1' }),
        expect.anything()
      );
    });
    expect(appointmentsApi.availableSlots).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: '10:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save new time' }));

    await waitFor(() => {
      expect(appointmentsApi.reschedule).toHaveBeenCalledWith('appointment-1', {
        scheduledAt: '2030-05-20T10:00:00.000Z',
      });
    });
  });

  it('sends the cancel action with a reason for patient appointments', async () => {
    renderPage('patient');

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    fireEvent.change(await screen.findByLabelText('Reason'), { target: { value: 'Need to move' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));

    await waitFor(() => {
      expect(appointmentsApi.updateStatus).toHaveBeenCalledWith('appointment-1', {
        action: 'cancel',
        reason: 'Need to move',
      });
    });
  });
});
