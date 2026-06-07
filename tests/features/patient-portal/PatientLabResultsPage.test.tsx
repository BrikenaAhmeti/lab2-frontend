import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientLabResultsPage from '@/features/patient-portal/pages/PatientLabResultsPage';
import { labApi, type LabOrderView } from '@/lib/api/lab-api';
import { aiApi } from '@/lib/api/ai-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/lab-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/lab-api')>('@/lib/api/lab-api');

  return {
    ...actual,
    labApi: {
      ...actual.labApi,
      listOrders: vi.fn(),
    },
  };
});

vi.mock('@/lib/api/ai-api', () => ({
  aiApi: {
    getLabInterpretation: vi.fn(),
  },
}));

const labOrder: LabOrderView = {
  id: 'lab-order-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  medicalRecordId: 'record-1',
  orderedByStaffId: 'doctor-1',
  departmentId: 'department-1',
  status: 'COMPLETED',
  priority: 'urgent',
  notes: null,
  orderedAt: '2030-01-02T08:10:00.000Z',
  collectedAt: '2030-01-02T08:30:00.000Z',
  completedAt: '2030-01-02T09:00:00.000Z',
  reviewedAt: '2030-01-02T10:00:00.000Z',
  createdAt: '2030-01-02T08:10:00.000Z',
  updatedAt: '2030-01-02T10:00:00.000Z',
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
  medicalRecord: {
    id: 'record-1',
    diagnosis: 'Blood check',
    isFinalized: true,
    createdAt: '2030-01-02T09:20:00.000Z',
  },
  orderedByStaff: {
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
  items: [
    {
      id: 'item-1',
      labTestId: 'test-1',
      resultValue: '6.1',
      resultUnit: 'g/dL',
      resultNotes: null,
      resultStatus: 'CRITICAL',
      isCritical: true,
      completedAt: '2030-01-02T09:00:00.000Z',
      flag: 'critical',
      labTest: {
        id: 'test-1',
        code: 'HGB',
        name: 'Hemoglobin',
        description: null,
        category: 'Hematology',
        sampleType: 'Blood',
        defaultPrice: 12,
        referenceRange: '12-16 g/dL',
        isActive: true,
      },
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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
          <PatientLabResultsPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PatientLabResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(labApi.listOrders).mockResolvedValue({
      items: [labOrder],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(aiApi.getLabInterpretation).mockResolvedValue({
      labOrderId: 'lab-order-1',
      patientVersion: 'Your hemoglobin is lower than the usual range.',
      disclaimer: 'AI-generated explanation - discuss results with your doctor.',
    });
  });

  it('shows patient lab results with flags and the patient AI interpretation', async () => {
    renderPage();

    expect(await screen.findByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('6.1 g/dL')).toBeInTheDocument();
    expect(await screen.findByText('Your hemoglobin is lower than the usual range.')).toBeInTheDocument();
    expect(labApi.listOrders).toHaveBeenCalledWith({ page: 1, limit: 50, patientId: 'patient-1' });
    expect(aiApi.getLabInterpretation).toHaveBeenCalledWith('lab-order-1');
  });

  it('treats a missing AI interpretation as pending for completed lab orders', async () => {
    vi.mocked(aiApi.getLabInterpretation).mockResolvedValueOnce(null);

    renderPage();

    expect(await screen.findByText('Hemoglobin')).toBeInTheDocument();
    expect(await screen.findByText('AI explanation is being prepared')).toBeInTheDocument();
  });
});
