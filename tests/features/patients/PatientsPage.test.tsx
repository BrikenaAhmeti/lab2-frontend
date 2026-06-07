import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientsPage from '@/features/patients/pages/PatientsPage';
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
  address: null,
  emergencyContact: null,
  emergencyPhone: null,
  allergies: 'penicillin',
  medicalNotes: null,
  isActive: true,
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
};

function setUserSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions: ['patients:read', 'patients:create'],
      },
    })
  );
}

function duplicateError(message: string) {
  return new AxiosError(
    message,
    '409',
    { headers: new AxiosHeaders() },
    {},
    {
      data: { message },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
  );
}

function renderPatients() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/patients']}>
          <Routes>
            <Route path="/admin/patients" element={<PatientsPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('PatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserSession();
    vi.mocked(patientsApi.list).mockResolvedValue({
      items: [patient],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(patientsApi.create).mockResolvedValue(patient);
  });

  it('loads the backend patient list with search and filters', async () => {
    renderPatients();

    expect(await screen.findByText('Arta Krasniqi')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Personal number' })).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getAllByText('Female').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText(/search name/i), { target: { value: 'arta' } });
    fireEvent.change(screen.getByLabelText('Gender'), { target: { value: 'female' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'active' } });
    fireEvent.change(screen.getByLabelText('Blood type'), { target: { value: 'A_POSITIVE' } });
    fireEvent.click(screen.getByRole('button', { name: /birth date/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Range' }));
    fireEvent.change(screen.getByLabelText('Born from'), { target: { value: '1995-01-01' } });
    fireEvent.change(screen.getByLabelText('Born to'), { target: { value: '1995-12-31' } });

    await waitFor(() => {
      expect(patientsApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'arta',
          gender: 'female',
          isActive: true,
          bloodType: 'A_POSITIVE',
          dateOfBirthFrom: '1995-01-01',
          dateOfBirthTo: '1995-12-31',
        })
      );
    });
  });

  it('shows duplicate registration errors inline from the backend', async () => {
    vi.mocked(patientsApi.create).mockRejectedValue(duplicateError('Patient email already registered'));
    renderPatients();

    fireEvent.click(await screen.findByRole('button', { name: 'Register Patient' }));
    expect(screen.getByLabelText('Allergies').tagName).toBe('TEXTAREA');
    expect(screen.getByRole('button', { name: 'Open calendar' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Krasniqi' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'arta@example.com' } });
    fireEvent.change(screen.getByLabelText('Personal number'), { target: { value: '1234567890' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Register patient' }).closest('form')!);

    expect(await screen.findByText('Patient email already registered')).toBeInTheDocument();
  });

  it('requires a personal number when registering a patient', async () => {
    renderPatients();

    fireEvent.click(await screen.findByRole('button', { name: 'Register Patient' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Krasniqi' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Register patient' }).closest('form')!);

    expect(await screen.findByText('Personal number is required')).toBeInTheDocument();
    expect(patientsApi.create).not.toHaveBeenCalled();
  });

  it('registers patients without exposing linked user ids in the payload', async () => {
    renderPatients();

    fireEvent.click(await screen.findByRole('button', { name: 'Register Patient' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Krasniqi' } });
    fireEvent.change(screen.getByLabelText('Personal number'), { target: { value: '1234567890' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Register patient' }).closest('form')!);

    await waitFor(() => expect(patientsApi.create).toHaveBeenCalled());
    const payload = vi.mocked(patientsApi.create).mock.calls[0][0];

    expect(payload).toEqual(expect.objectContaining({
      firstName: 'Arta',
      lastName: 'Krasniqi',
      personalNumber: '1234567890',
    }));
    expect(payload).not.toHaveProperty('userId');
  });
});
