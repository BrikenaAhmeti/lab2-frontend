import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookingWizard from '@/features/appointments/components/BookingWizard';
import { departmentsApi, type DepartmentRecord } from '@/lib/api/departments-api';
import { servicesApi, type ServiceRecord } from '@/lib/api/services-api';
import { staffApi, type StaffRecord } from '@/lib/api/staff-api';
import { appointmentsApi, type AppointmentView, type AvailableSlotsResponse } from '@/lib/api/appointments-api';

vi.mock('@/lib/api/departments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/departments-api')>('@/lib/api/departments-api');

  return {
    ...actual,
    departmentsApi: {
      list: vi.fn(),
      publicList: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deactivate: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/services-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/services-api')>('@/lib/api/services-api');

  return {
    ...actual,
    servicesApi: {
      list: vi.fn(),
      publicList: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      deactivate: vi.fn(),
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

const department: DepartmentRecord = {
  id: 'department-1',
  name: 'Cardiology',
  description: 'Heart care',
  floor: '2',
  phoneExtension: null,
  operatingHours: null,
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const service: ServiceRecord = {
  id: 'service-1',
  departmentId: 'department-1',
  department: { id: 'department-1', name: 'Cardiology', isActive: true },
  name: 'General Consultation',
  description: 'Initial visit',
  defaultDurationMinutes: 30,
  defaultPrice: 40,
  isActive: true,
  sortOrder: 1,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
};

const staff: StaffRecord = {
  id: 'staff-1',
  userId: 'user-staff-1',
  user: {
    id: 'user-staff-1',
    name: 'Dr. Rivera',
    email: 'rivera@example.com',
  },
  specialization: 'Cardiologist',
  bio: 'Patient-facing doctor',
  employmentStatus: 'ACTIVE',
  positionType: { id: 'position-1', name: 'Doctor' },
  departments: [
    {
      id: 'assignment-1',
      departmentId: 'department-1',
      isPrimary: true,
      unassignedAt: null,
      department: { id: 'department-1', name: 'Cardiology', isActive: true },
    },
  ],
};

const slots: AvailableSlotsResponse = {
  staffProfileId: 'staff-1',
  serviceId: 'service-1',
  date: '2030-05-20',
  slots: [
    {
      start: '2030-05-20T09:00:00.000Z',
      end: '2030-05-20T09:30:00.000Z',
      startTime: '09:00',
      endTime: '09:30',
      durationMinutes: 30,
    },
  ],
};

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
  notes: 'Bring records',
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
};

function renderWizard(patientId?: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BookingWizard mode="patient" patientId={patientId} />
    </QueryClientProvider>
  );
}

function renderPublicWizard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BookingWizard mode="public" />
    </QueryClientProvider>
  );
}

async function moveToConfirmStep() {
  expect(await screen.findByText('Department: Cardiology')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: /dr\. rivera/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  fireEvent.click(await screen.findByRole('button', { name: /general consultation/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  fireEvent.click(await screen.findByRole('button', { name: '09:00' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await screen.findByLabelText('Notes');
}

async function movePublicToConfirmStep() {
  expect(await screen.findByText('Department: Cardiology')).toBeInTheDocument();
  fireEvent.click(await screen.findByRole('button', { name: /dr\. rivera/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  fireEvent.click(await screen.findByRole('button', { name: /general consultation/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  fireEvent.click(await screen.findByRole('button', { name: '09:00' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await screen.findByLabelText(/first name/i);

  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Please complete the required patient details before confirming the appointment.')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Arta' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Krasniqi' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'arta@example.com' } });
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '+38344111222' } });
  fireEvent.change(screen.getByLabelText(/personal number/i), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1995-03-12' } });
  fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'female' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));

  await screen.findByLabelText('Notes');
}

describe('BookingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(departmentsApi.list).mockResolvedValue({
      items: [department],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(departmentsApi.publicList).mockResolvedValue({
      items: [department],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(servicesApi.list).mockResolvedValue({
      items: [service],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(servicesApi.publicList).mockResolvedValue({
      items: [service],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(staffApi.publicList).mockResolvedValue({
      items: [staff],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(appointmentsApi.availableSlots).mockResolvedValue(slots);
    vi.mocked(appointmentsApi.publicAvailableSlots).mockResolvedValue(slots);
    vi.mocked(appointmentsApi.create).mockResolvedValue(appointment);
    vi.mocked(appointmentsApi.publicCreate).mockResolvedValue(appointment);
  });

  it('moves through the booking steps and posts the backend payload shape', async () => {
    renderWizard('patient-1');
    await moveToConfirmStep();

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Bring records' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm appointment' }));

    await waitFor(() => {
      expect(appointmentsApi.create).toHaveBeenCalledWith({
        patientId: 'patient-1',
        serviceCatalogId: 'service-1',
        staffProfileId: 'staff-1',
        scheduledAt: '2030-05-20T09:00:00.000Z',
        notes: 'Bring records',
      });
    });
    expect(await screen.findByText('Appointment booked')).toBeInTheDocument();
  });

  it('keeps confirm disabled when the patient id is missing', async () => {
    renderWizard();
    await moveToConfirmStep();

    expect(screen.getByRole('button', { name: 'Confirm appointment' })).toBeDisabled();
    expect(screen.getByText('Patient profile could not be resolved from your session.')).toBeInTheDocument();
  });

  it('collects public patient details and posts the unauthenticated booking payload', async () => {
    renderPublicWizard();
    await movePublicToConfirmStep();

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'New patient website request' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm appointment' }));

    await waitFor(() => {
      expect(appointmentsApi.publicCreate).toHaveBeenCalledWith({
        patient: {
          firstName: 'Arta',
          lastName: 'Krasniqi',
          email: 'arta@example.com',
          phone: '+38344111222',
          personalNumber: '1234567890',
          dateOfBirth: '1995-03-12',
          gender: 'female',
        },
        serviceCatalogId: 'service-1',
        staffProfileId: 'staff-1',
        scheduledAt: '2030-05-20T09:00:00.000Z',
        notes: 'New patient website request',
      });
    });
    expect(await screen.findByText('Appointment booked')).toBeInTheDocument();
  });
});
