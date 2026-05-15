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

vi.mock('@/lib/api/patients-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/patients-api')>('@/lib/api/patients-api');

  return {
    ...actual,
    patientsApi: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      timeline: vi.fn(),
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
  allergies: 'penicillin',
  medicalNotes: 'Staff note',
  isActive: true,
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
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
  });

  it('uses the patient profile id from session for patient self-view', async () => {
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
    expect(screen.getByText('penicillin')).toBeInTheDocument();
    expect(patientsApi.get).toHaveBeenCalledWith('patient-1');
  });
});
