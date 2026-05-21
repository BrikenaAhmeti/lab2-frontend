import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LabDashboardPage from '@/pages/portals/LabDashboardPage';
import { labApi, type LabOrderView } from '@/lib/api/lab-api';

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
    },
  };
});

function makeOrder(overrides: Partial<LabOrderView> = {}): LabOrderView {
  const id = overrides.id ?? '11111111-1111-4111-8111-111111111111';

  return {
    id,
    patientId: '22222222-2222-4222-8222-222222222222',
    appointmentId: '33333333-3333-4333-8333-333333333333',
    medicalRecordId: '44444444-4444-4444-8444-444444444444',
    orderedByStaffId: '55555555-5555-4555-8555-555555555555',
    departmentId: '66666666-6666-4666-8666-666666666666',
    status: 'PENDING',
    priority: 'urgent',
    notes: 'Fasting sample',
    orderedAt: '2030-01-02T08:10:00.000Z',
    collectedAt: null,
    completedAt: null,
    reviewedAt: null,
    createdAt: '2030-01-02T08:10:00.000Z',
    updatedAt: '2030-01-02T08:10:00.000Z',
    patient: {
      id: '22222222-2222-4222-8222-222222222222',
      userId: 'patient-user',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+38344111222',
      name: 'Ada Lovelace',
    },
    appointment: {
      id: '33333333-3333-4333-8333-333333333333',
      status: 'IN_PROGRESS',
      scheduledAt: '2030-01-02T09:00:00.000Z',
      endAt: '2030-01-02T09:30:00.000Z',
    },
    medicalRecord: {
      id: '44444444-4444-4444-8444-444444444444',
      diagnosis: 'Diabetes screening',
      isFinalized: false,
      createdAt: '2030-01-02T09:05:00.000Z',
    },
    orderedByStaff: {
      id: '55555555-5555-4555-8555-555555555555',
      userId: 'doctor-user',
      employeeCode: 'DR-001',
      specialization: 'Internist',
      displayName: 'DR-001 - Internist',
    },
    department: {
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Internal Medicine',
      isActive: true,
    },
    items: [
      {
        id: '77777777-7777-4777-8777-777777777777',
        labTestId: '88888888-8888-4888-8888-888888888888',
        resultValue: null,
        resultUnit: null,
        resultNotes: null,
        resultStatus: 'PENDING',
        isCritical: false,
        completedAt: null,
        flag: 'pending',
        labTest: {
          id: '88888888-8888-4888-8888-888888888888',
          code: 'GLU',
          name: 'Glucose',
          description: 'Serum glucose',
          category: 'Chemistry',
          sampleType: 'Blood',
          defaultPrice: '15.00',
          referenceRange: '70-99 mg/dL',
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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter initialEntries={['/lab']}>
      <QueryClientProvider client={queryClient}>
        <LabDashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('LabDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the MS-23 queue grouped by backend lab order status', async () => {
    const pending = makeOrder();
    const collected = makeOrder({
      id: '99999999-9999-4999-8999-999999999999',
      status: 'COLLECTED',
      priority: 'normal',
      patient: { ...pending.patient, id: 'patient-2', name: 'Ben Gashi', firstName: 'Ben', lastName: 'Gashi' },
    });
    const inProgress = makeOrder({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      status: 'IN_PROGRESS',
      patient: { ...pending.patient, id: 'patient-3', name: 'Cara Krasniqi', firstName: 'Cara', lastName: 'Krasniqi' },
    });
    const completed = makeOrder({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      status: 'COMPLETED',
      completedAt: '2030-01-02T10:10:00.000Z',
      patient: { ...pending.patient, id: 'patient-4', name: 'Dina Hoxha', firstName: 'Dina', lastName: 'Hoxha' },
    });

    vi.mocked(labApi.pendingOrders).mockResolvedValue([pending, collected, inProgress]);
    vi.mocked(labApi.listOrders).mockImplementation((params) =>
      Promise.resolve(params.status === 'completed' ? listResponse([completed]) : listResponse([pending, collected, inProgress, completed]))
    );

    renderPage();

    expect(await screen.findAllByText('Ada Lovelace')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sample Collected' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByText('Ben Gashi')).toBeInTheDocument();
    expect(screen.getByText('Cara Krasniqi')).toBeInTheDocument();
    expect(screen.getByText('Dina Hoxha')).toBeInTheDocument();

    const totalCard = screen.getByText('Total Today').closest('div');
    const completedCard = screen.getByText('Completed Today').closest('div');
    const pendingCard = screen.getByText('Pending Today').closest('div');
    const progressCard = screen.getByText('In Progress Today').closest('div');

    expect(within(totalCard!).getByText('4')).toBeInTheDocument();
    expect(within(completedCard!).getByText('1')).toBeInTheDocument();
    expect(within(pendingCard!).getByText('1')).toBeInTheDocument();
    expect(within(progressCard!).getByText('1')).toBeInTheDocument();
  });

  it('saves result items with the MS-22 backend payload and completes the order', async () => {
    const inProgress = makeOrder({ status: 'IN_PROGRESS', priority: 'normal' });
    const saved = makeOrder({
      ...inProgress,
      items: [
        {
          ...inProgress.items[0],
          resultValue: '120',
          resultUnit: 'mg/dL',
          resultStatus: 'ABNORMAL',
          flag: 'abnormal',
          completedAt: '2030-01-02T10:00:00.000Z',
        },
      ],
    });

    vi.mocked(labApi.pendingOrders).mockResolvedValue([inProgress]);
    vi.mocked(labApi.listOrders).mockResolvedValue(listResponse([inProgress]));
    vi.mocked(labApi.enterResults).mockResolvedValue(saved);
    vi.mocked(labApi.updateOrderStatus).mockResolvedValue({
      ...saved,
      status: 'COMPLETED',
      completedAt: '2030-01-02T10:10:00.000Z',
    });

    renderPage();

    fireEvent.change(await screen.findByLabelText('Glucose result value'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Glucose unit'), { target: { value: 'mg/dL' } });

    expect(screen.getByText('Abnormal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save results/i }));

    await waitFor(() => {
      expect(labApi.enterResults).toHaveBeenCalledWith(inProgress.id, {
        items: [
          {
            itemId: inProgress.items[0].id,
            resultValue: '120',
            resultUnit: 'mg/dL',
            resultNotes: null,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /complete order/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /complete order/i }));

    await waitFor(() => {
      expect(labApi.updateOrderStatus).toHaveBeenCalledWith(inProgress.id, 'completed');
    });
  });
});
