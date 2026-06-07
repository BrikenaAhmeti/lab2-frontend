import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientPrescriptionsPage from '@/features/patient-portal/pages/PatientPrescriptionsPage';
import { prescriptionsApi, type PrescriptionView } from '@/lib/api/prescriptions-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/prescriptions-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/prescriptions-api')>('@/lib/api/prescriptions-api');

  return {
    ...actual,
    prescriptionsApi: {
      ...actual.prescriptionsApi,
      list: vi.fn(),
      downloadPdf: vi.fn(),
    },
  };
});

const prescription: PrescriptionView = {
  id: 'prescription-1',
  patientId: 'patient-1',
  medicalRecordId: 'record-1',
  appointmentId: 'appointment-1',
  staffProfileId: 'doctor-1',
  issuedAt: '2030-01-02T09:20:00.000Z',
  expiresAt: null,
  notes: null,
  isVoided: false,
  voidedAt: null,
  voidReason: null,
  voidedByUserId: null,
  status: 'ACTIVE',
  pharmacyStatus: 'DISPENSED',
  createdAt: '2030-01-02T09:20:00.000Z',
  updatedAt: '2030-01-02T09:20:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'patient-user',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    allergies: null,
    name: 'Arta Krasniqi',
  },
  medicalRecord: {
    id: 'record-1',
    diagnosis: 'Flu',
    isFinalized: true,
    createdAt: '2030-01-02T09:20:00.000Z',
  },
  appointment: {
    id: 'appointment-1',
    status: 'COMPLETED',
    scheduledAt: '2030-01-02T09:00:00.000Z',
    endAt: '2030-01-02T09:30:00.000Z',
  },
  staff: {
    id: 'doctor-1',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'General Medicine',
    displayName: 'Dr. Lira',
  },
  items: [
    {
      id: 'item-1',
      medicationName: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Twice daily',
      durationInstructions: '7 days',
      quantityPrescribed: 14,
      quantityDispensed: 14,
      notes: null,
      createdAt: '2030-01-02T09:20:00.000Z',
      updatedAt: '2030-01-02T09:20:00.000Z',
    },
  ],
  pharmacyQueue: [],
};

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
          id: 'patient-user',
          patientId: 'patient-1',
          email: 'arta@example.com',
          roles: ['Patient'],
          permissions: [],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PatientPrescriptionsPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PatientPrescriptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prescriptionsApi.list).mockResolvedValue({
      items: [prescription],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(prescriptionsApi.downloadPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:prescription'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('shows patient prescriptions and downloads the backend PDF', async () => {
    renderPage();

    expect(await screen.findByText('Amoxicillin')).toBeInTheDocument();
    expect(prescriptionsApi.list).toHaveBeenCalledWith({ page: 1, limit: 50, patientId: 'patient-1' });

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => {
      expect(prescriptionsApi.downloadPdf).toHaveBeenCalledWith('prescription-1');
    });
  });
});
