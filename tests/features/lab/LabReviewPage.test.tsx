import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LabReviewPage from '@/features/lab/pages/LabReviewPage';
import { labApi, type LabOrderView } from '@/lib/api/lab-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/lab-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/lab-api')>('@/lib/api/lab-api');

  return {
    ...actual,
    labApi: {
      listOrders: vi.fn(),
      pendingOrders: vi.fn(),
      getOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      enterResults: vi.fn(),
      reviewOrder: vi.fn(),
      triggerAi: vi.fn(),
    },
  };
});

function makeOrder(overrides: Partial<LabOrderView> = {}): LabOrderView {
  return {
    id: 'lab-order-1',
    patientId: 'patient-1',
    appointmentId: 'appointment-1',
    medicalRecordId: 'record-1',
    orderedByStaffId: 'doctor-profile-1',
    departmentId: 'department-1',
    status: 'COMPLETED',
    priority: 'urgent',
    notes: null,
    orderedAt: '2030-01-02T08:10:00.000Z',
    collectedAt: '2030-01-02T08:40:00.000Z',
    completedAt: '2030-01-02T09:30:00.000Z',
    reviewedAt: null,
    createdAt: '2030-01-02T08:10:00.000Z',
    updatedAt: '2030-01-02T09:30:00.000Z',
    patient: {
      id: 'patient-1',
      userId: 'patient-user',
      firstName: 'Mira',
      lastName: 'Deda',
      email: 'mira@example.com',
      phone: '+38344111222',
      name: 'Mira Deda',
    },
    appointment: {
      id: 'appointment-1',
      status: 'IN_PROGRESS',
      scheduledAt: '2030-01-02T09:00:00.000Z',
      endAt: '2030-01-02T09:30:00.000Z',
    },
    medicalRecord: {
      id: 'record-1',
      diagnosis: 'Anemia check',
      isFinalized: true,
      createdAt: '2030-01-02T09:10:00.000Z',
    },
    orderedByStaff: {
      id: 'doctor-profile-1',
      userId: 'doctor-user',
      employeeCode: 'DR-1',
      specialization: 'Cardiologist',
      displayName: 'DR-1 - Cardiologist',
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
        completedAt: '2030-01-02T09:30:00.000Z',
        flag: 'critical',
        labTest: {
          id: 'test-1',
          code: 'HGB',
          name: 'Hemoglobin',
          description: null,
          category: 'Hematology',
          sampleType: 'Blood',
          defaultPrice: '12.00',
          referenceRange: '12-16 g/dL',
          isActive: true,
        },
      },
    ],
    ...overrides,
  };
}

function listResponse(items: LabOrderView[]) {
  return {
    items,
    meta: { page: 1, limit: 100, total: items.length, totalPages: items.length ? 1 : 0 },
  };
}

function renderPage(initialPath = '/doctor/lab-reviews/lab-order-1') {
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
          id: 'doctor-user',
          email: 'doctor@medsphere.local',
          roles: ['Doctor'],
          permissions: ['lab_orders:read', 'lab_results:review'],
          profileId: 'doctor-profile-1',
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/doctor/lab-reviews" element={<LabReviewPage />} />
            <Route path="/doctor/lab-reviews/:id" element={<LabReviewPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('LabReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(labApi.listOrders).mockResolvedValue(listResponse([makeOrder()]));
    vi.mocked(labApi.getOrder).mockResolvedValue(makeOrder());
    vi.mocked(labApi.reviewOrder).mockResolvedValue(makeOrder({ reviewedAt: '2030-01-02T10:00:00.000Z' }));
    vi.mocked(labApi.triggerAi).mockResolvedValue({
      labOrderId: 'lab-order-1',
      status: 'not_configured',
      message: 'AI interpretation is not configured in the core service yet',
    });
  });

  it('reviews completed lab results with the MS-22 backend payloads', async () => {
    renderPage();

    expect(await screen.findAllByText('Mira Deda')).not.toHaveLength(0);
    expect(screen.getByText('6.1 g/dL')).toBeInTheDocument();
    expect(screen.getByText('12-16 g/dL')).toBeInTheDocument();
    expect(screen.getByText('Critical results: Hemoglobin')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Doctor notes'), { target: { value: 'Looks stable after review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Trigger AI' }));

    await waitFor(() => {
      expect(labApi.triggerAi).toHaveBeenCalledWith('lab-order-1');
    });
    expect(await screen.findByText('AI interpretation is not configured in the core service yet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark as Reviewed' }));

    await waitFor(() => {
      expect(labApi.reviewOrder).toHaveBeenCalledWith('lab-order-1', { notes: 'Looks stable after review' });
    });
    expect(await screen.findByText('Lab results marked as reviewed.')).toBeInTheDocument();
  });
});
