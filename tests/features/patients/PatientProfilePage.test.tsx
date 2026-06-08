import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientProfilePage from '@/features/patients/pages/PatientProfilePage';
import PatientSelfProfilePage from '@/features/patients/pages/PatientSelfProfilePage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { patientsApi, type PatientRecord } from '@/lib/api/patients-api';
import { appointmentsApi, type AppointmentView } from '@/lib/api/appointments-api';
import { medicalRecordsApi, type MedicalRecordView } from '@/lib/api/medical-records-api';

vi.mock('@/lib/api/patients-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/patients-api')>('@/lib/api/patients-api');

  return {
    ...actual,
    patientsApi: {
      list: vi.fn(),
      me: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      timeline: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/appointments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/appointments-api')>('@/lib/api/appointments-api');

  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      list: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/medical-records-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/medical-records-api')>('@/lib/api/medical-records-api');

  return {
    ...actual,
    medicalRecordsApi: {
      ...actual.medicalRecordsApi,
      list: vi.fn(),
      downloadPdf: vi.fn(),
    },
  };
});

const patient: PatientRecord = {
  id: 'patient-1',
  userId: 'user-1',
  firstName: 'Arta',
  lastName: 'Krasniqi',
  email: 'arta@example.com',
  phone: '+38344111222',
  dateOfBirth: '1995-04-10T00:00:00.000Z',
  gender: 'female',
  bloodType: 'A_POSITIVE',
  personalNumber: '1234567890',
  address: 'Rruga B',
  emergencyContact: 'Luan Krasniqi',
  emergencyPhone: '+38344999888',
  allergies: ['penicillin'],
  medicalNotes: {
    lastVisitReason: 'Dental pain visit',
    chronicConditions: [],
  },
  isActive: true,
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
};

const appointment: AppointmentView = {
  id: 'appointment-1',
  patientId: 'patient-1',
  departmentId: 'department-1',
  serviceCatalogId: 'service-1',
  staffProfileId: 'doctor-1',
  status: 'SCHEDULED',
  appointmentType: 'IN_PERSON',
  scheduledAt: '2026-05-03T09:00:00.000Z',
  endAt: '2026-05-03T09:30:00.000Z',
  durationMinutes: 30,
  basePrice: 50,
  notes: null,
  checkedInAt: null,
  completedAt: null,
  cancelledAt: null,
  cancellationNote: null,
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-01T00:00:00.000Z',
  patient: {
    id: 'patient-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  staff: {
    id: 'doctor-1',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'Dentistry',
    displayName: 'Dr. Lira',
  },
  service: {
    id: 'service-1',
    name: 'Dental consultation',
    defaultDurationMinutes: 30,
    defaultPrice: 50,
  },
  department: {
    id: 'department-1',
    name: 'Dental Care',
    isActive: true,
  },
};

const medicalRecord: MedicalRecordView = {
  id: 'record-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  staffProfileId: 'doctor-1',
  departmentId: 'department-1',
  chiefComplaint: 'Dental pain',
  vitals: null,
  diagnosis: 'Stable exam',
  treatmentPlan: 'Continue monitoring',
  notes: 'Follow up if symptoms return',
  followUpInstructions: 'Return in two weeks',
  isFinalized: true,
  createdAt: '2026-05-02T09:20:00.000Z',
  updatedAt: '2026-05-02T09:20:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'user-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  appointment: {
    id: 'appointment-1',
    status: 'COMPLETED',
    scheduledAt: '2026-05-02T09:00:00.000Z',
    endAt: '2026-05-02T09:30:00.000Z',
  },
  staff: {
    id: 'doctor-1',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'Dentistry',
    displayName: 'Dr. Lira',
  },
  department: {
    id: 'department-1',
    name: 'Dental Care',
    isActive: true,
  },
  amendments: [],
  prescriptions: [],
  labOrders: [],
};

function queryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function setAdminSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions: ['patients:read'],
      },
    })
  );
}

function setPatientSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'user-1',
        patientId: 'patient-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      },
    })
  );
}

describe('Patient profile pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(patientsApi.me).mockResolvedValue(patient);
    vi.mocked(patientsApi.get).mockResolvedValue(patient);
    vi.mocked(patientsApi.timeline).mockResolvedValue([
      {
        id: 'appointment:a1',
        type: 'appointment',
        occurredAt: '2026-05-01T10:00:00.000Z',
        title: 'General consultation appointment',
        status: 'SCHEDULED',
        summary: 'General Medicine - IN_PERSON',
        reference: { entity: 'appointments', id: 'a1' },
      },
    ]);
    vi.mocked(appointmentsApi.list).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 50, total: 0, totalPages: 0 },
    });
    vi.mocked(medicalRecordsApi.list).mockResolvedValue({
      items: [medicalRecord],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });
  });

  it('renders the shared profile history timeline with detail links', async () => {
    setAdminSession();

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient()}>
          <MemoryRouter initialEntries={['/admin/patients/patient-1?tab=history']}>
            <Routes>
              <Route path="/admin/patients/:id" element={<PatientProfilePage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText('General consultation appointment')).toBeInTheDocument();
    expect(screen.getByText('Appointment')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute('href', '/admin/appointments/a1');
    expect(screen.getByRole('link', { name: 'Back to patients' })).toHaveAttribute('href', '/admin/patients');
  });

  it('loads patient appointments from the backend and only shows the empty message for empty responses', async () => {
    setAdminSession();
    vi.mocked(appointmentsApi.list).mockResolvedValueOnce({
      items: [appointment],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient()}>
          <MemoryRouter initialEntries={['/admin/patients/patient-1?tab=appointments']}>
            <Routes>
              <Route path="/admin/patients/:id" element={<PatientProfilePage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText('Dental consultation')).toBeInTheDocument();
    expect(screen.getByText('Dental Care')).toBeInTheDocument();
    expect(screen.queryByText('Appointments are not wired yet')).not.toBeInTheDocument();
    expect(screen.queryByText('No appointments yet')).not.toBeInTheDocument();
    expect(appointmentsApi.list).toHaveBeenCalledWith({ page: 1, limit: 50, patientId: 'patient-1' });
  });

  it('shows a not-yet appointment message when the backend returns no appointments', async () => {
    setAdminSession();

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient()}>
          <MemoryRouter initialEntries={['/admin/patients/patient-1?tab=appointments']}>
            <Routes>
              <Route path="/admin/patients/:id" element={<PatientProfilePage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText('No appointments yet')).toBeInTheDocument();
    expect(screen.getByText('This patient does not have any appointments yet.')).toBeInTheDocument();
  });

  it('uses the current patient endpoint for patient self-view', async () => {
    setPatientSession();

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient()}>
          <MemoryRouter initialEntries={['/patient/profile?tab=medical']}>
            <Routes>
              <Route path="/patient/profile" element={<PatientSelfProfilePage />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText('Staff-entered medical fields are shown read-only.')).toBeInTheDocument();
    expect(screen.getAllByText('penicillin').length).toBeGreaterThan(0);
    expect(screen.getByText('Last Visit Reason')).toBeInTheDocument();
    expect(screen.getByText('Dental pain visit')).toBeInTheDocument();
    expect(await screen.findByText('Stable exam')).toBeInTheDocument();
    expect(screen.queryByText(JSON.stringify(patient.medicalNotes))).not.toBeInTheDocument();
    expect(patientsApi.me).toHaveBeenCalledTimes(1);
    expect(patientsApi.get).not.toHaveBeenCalled();
    expect(medicalRecordsApi.list).toHaveBeenCalledWith({ page: 1, limit: 5, patientId: 'patient-1' });
  });
});
