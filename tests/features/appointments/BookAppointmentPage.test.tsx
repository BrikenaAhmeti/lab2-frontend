import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '@/features/auth/authSlice';
import type { AuthState } from '@/features/auth/authSlice';
import BookAppointmentPage from '@/features/appointments/pages/BookAppointmentPage';
import { patientsApi } from '@/lib/api/patients-api';
import type { PatientRecord } from '@/lib/api/patients-api';

vi.mock('@/features/appointments/components/BookingWizard', () => ({
  default: ({ mode, patientId, initialPatient }: { mode: string; patientId?: string; initialPatient?: PatientRecord | null }) => (
    <div>
      <span data-testid="booking-mode">{mode}</span>
      <span data-testid="booking-patient-id">{patientId ?? ''}</span>
      <span data-testid="booking-initial-patient">{initialPatient?.id ?? ''}</span>
    </div>
  ),
}));

vi.mock('@/lib/api/patients-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/patients-api')>('@/lib/api/patients-api');

  return {
    ...actual,
    patientsApi: {
      ...actual.patientsApi,
      me: vi.fn(),
    },
  };
});

const patient: PatientRecord = {
  id: 'patient-1',
  userId: 'user-patient-1',
  firstName: 'Arta',
  lastName: 'Krasniqi',
  email: 'arta@example.com',
  phone: '+38344111222',
  dateOfBirth: '1995-03-12',
  gender: 'female',
  bloodType: null,
  personalNumber: '1234567890',
  address: null,
  emergencyContact: null,
  emergencyPhone: null,
  allergies: null,
  medicalNotes: null,
  isActive: true,
  createdAt: '2026-05-19T00:00:00.000Z',
  updatedAt: '2026-05-19T00:00:00.000Z',
};

function renderPage(mode: 'patient' | 'receptionist', auth: Partial<AuthState>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const preloadedAuthState: AuthState = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokens: { accessToken: 'access-token', refreshToken: 'refresh-token' },
    status: 'authenticated',
    user: null,
    ...auth,
  };
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: preloadedAuthState,
    },
  });

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[mode === 'patient' ? '/patient/book-appointment' : '/receptionist/book-appointment']}>
          <Routes>
            <Route path="/patient/book-appointment" element={<BookAppointmentPage mode="patient" />} />
            <Route path="/receptionist/book-appointment" element={<BookAppointmentPage mode="receptionist" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );

  return store;
}

describe('BookAppointmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(patientsApi.me).mockResolvedValue(patient);
  });

  it('uses patient ids already present in the auth session', () => {
    renderPage('patient', {
      user: {
        id: 'user-patient-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
        patientId: 'patient-from-session',
      },
    });

    expect(screen.getByTestId('booking-patient-id')).toHaveTextContent('patient-from-session');
    expect(patientsApi.me).not.toHaveBeenCalled();
  });

  it('resolves the patient profile from core when the auth session is missing it', async () => {
    const store = renderPage('patient', {
      user: {
        id: 'user-patient-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('booking-patient-id')).toHaveTextContent('patient-1');
    });

    expect(screen.getByTestId('booking-initial-patient')).toHaveTextContent('patient-1');
    expect(store.getState().auth.user?.patientId).toBe('patient-1');
    expect(patientsApi.me).toHaveBeenCalledTimes(1);
  });

  it('does not resolve patient session data in receptionist mode', () => {
    renderPage('receptionist', {
      user: {
        id: 'user-receptionist-1',
        email: 'reception@example.com',
        roles: ['Receptionist'],
        permissions: [],
      },
    });

    expect(screen.getByTestId('booking-mode')).toHaveTextContent('receptionist');
    expect(screen.getByTestId('booking-patient-id')).toHaveTextContent('');
    expect(patientsApi.me).not.toHaveBeenCalled();
  });
});
