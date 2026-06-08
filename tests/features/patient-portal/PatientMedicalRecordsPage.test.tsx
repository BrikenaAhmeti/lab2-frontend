import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientMedicalRecordsPage from '@/features/patient-portal/pages/PatientMedicalRecordsPage';
import { medicalRecordsApi, type MedicalRecordView } from '@/lib/api/medical-records-api';
import authReducer from '@/features/auth/authSlice';
import { downloadElementPdf } from '@/features/patient-portal/components/patientPdfExport';

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

vi.mock('@/features/patient-portal/components/patientPdfExport', () => ({
  downloadElementPdf: vi.fn(),
}));

const medicalRecord: MedicalRecordView = {
  id: 'record-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  staffProfileId: 'doctor-1',
  departmentId: 'department-1',
  chiefComplaint: 'Chest discomfort',
  vitals: null,
  diagnosis: 'Stable exam',
  treatmentPlan: 'Continue monitoring',
  notes: 'Follow up if symptoms return',
  followUpInstructions: 'Return in two weeks',
  isFinalized: true,
  createdAt: '2030-01-02T09:20:00.000Z',
  updatedAt: '2030-01-02T09:20:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'patient-user',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
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
    specialization: 'Cardiology',
    displayName: 'Dr. Lira',
  },
  department: {
    id: 'department-1',
    name: 'Cardiology',
    isActive: true,
  },
  amendments: [],
  prescriptions: [],
  labOrders: [],
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
          <PatientMedicalRecordsPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PatientMedicalRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(medicalRecordsApi.list).mockResolvedValue({
      items: [medicalRecord],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(downloadElementPdf).mockResolvedValue(undefined);
  });

  it('shows finalized patient records and downloads the preview PDF with a descriptive name', async () => {
    renderPage();

    expect(await screen.findAllByText('Stable exam')).not.toHaveLength(0);
    expect(medicalRecordsApi.list).toHaveBeenCalledWith({ page: 1, limit: 50, patientId: 'patient-1' });

    expect(screen.getByText('Continue monitoring')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => {
      expect(downloadElementPdf).toHaveBeenCalledWith(
        expect.any(HTMLDivElement),
        'medical-record-arta-krasniqi-stable-exam-2030-01-02.pdf'
      );
    });
    expect(medicalRecordsApi.downloadPdf).not.toHaveBeenCalled();
  });
});
