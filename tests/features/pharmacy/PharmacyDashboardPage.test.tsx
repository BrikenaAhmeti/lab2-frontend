import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { AxiosError, type AxiosResponse } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PharmacyDashboardPage from '@/pages/portals/PharmacyDashboardPage';
import authReducer from '@/features/auth/authSlice';
import uiReducer from '@/features/ui/uiSlice';
import { pharmacyApi, type PharmacyQueueListResponse, type PharmacyQueueView } from '@/lib/api/pharmacy-api';

vi.mock('@/lib/api/pharmacy-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/pharmacy-api')>('@/lib/api/pharmacy-api');

  return {
    ...actual,
    pharmacyApi: {
      listQueue: vi.fn(),
      getQueueItem: vi.fn(),
      startQueue: vi.fn(),
      dispenseQueue: vi.fn(),
      fulfillQueue: vi.fn(),
    },
  };
});

function makeQueue(overrides: Partial<PharmacyQueueView> = {}): PharmacyQueueView {
  const id = overrides.id ?? '11111111-1111-4111-8111-111111111111';

  return {
    id,
    prescriptionId: '22222222-2222-4222-8222-222222222222',
    patientId: '33333333-3333-4333-8333-333333333333',
    status: 'PENDING',
    requestedAt: '2030-01-02T08:10:00.000Z',
    processedAt: null,
    notes: null,
    createdAt: '2030-01-02T08:10:00.000Z',
    updatedAt: '2030-01-02T08:10:00.000Z',
    patient: {
      id: '33333333-3333-4333-8333-333333333333',
      userId: 'patient-user',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+38344111222',
      allergies: ['Penicillin'],
      name: 'Ada Lovelace',
    },
    prescription: {
      id: '22222222-2222-4222-8222-222222222222',
      issuedAt: '2030-01-02T07:30:00.000Z',
      expiresAt: '2030-02-02T07:30:00.000Z',
      notes: 'Take after food',
      isVoided: false,
      staff: {
        id: '44444444-4444-4444-8444-444444444444',
        userId: 'doctor-user',
        employeeCode: 'DR-001',
        specialization: 'Cardiology',
        displayName: 'DR-001 - Cardiology',
      },
    },
    dispensingItems: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        pharmacyQueueId: id,
        prescriptionItemId: '66666666-6666-4666-8666-666666666666',
        inventoryItemId: null,
        quantityToDispense: 30,
        quantityDispensed: null,
        status: 'PENDING',
        notes: null,
        createdAt: '2030-01-02T08:10:00.000Z',
        updatedAt: '2030-01-02T08:10:00.000Z',
        prescriptionItem: {
          id: '66666666-6666-4666-8666-666666666666',
          medicationName: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Twice daily',
          durationInstructions: '7 days',
          quantityPrescribed: 30,
          quantityDispensed: null,
          notes: 'Complete the course',
        },
        inventoryItem: null,
      },
    ],
    ...overrides,
  };
}

function listResponse(items: PharmacyQueueView[]): PharmacyQueueListResponse {
  return {
    items,
    meta: { page: 1, limit: 10, total: items.length, totalPages: items.length ? 1 : 0 },
  };
}

function backendError(message: string) {
  const error = new AxiosError(message);
  error.response = {
    data: { message },
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: {},
  } as AxiosResponse;
  return error;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = configureStore({
    reducer: { auth: authReducer, ui: uiReducer },
    preloadedState: {
      auth: {
        accessToken: 'token',
        tokens: { accessToken: 'token' },
        status: 'authenticated' as const,
        user: {
          id: 'pharmacy-user',
          email: 'pharmacy@medsphere.local',
          roles: ['Pharmacist'],
          permissions: ['pharmacy:read', 'pharmacy:dispense'],
        },
      },
      ui: {
        sidebarOpen: false,
        theme: 'system' as const,
        toastQueue: [],
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/pharmacy']}>
        <QueryClientProvider client={queryClient}>
          <PharmacyDashboardPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PharmacyDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', { randomUUID: () => 'toast-id' });
  });

  it('shows the MS-26 queue with patient, doctor, status tags, allergies, and medication details', async () => {
    const queue = makeQueue();

    vi.mocked(pharmacyApi.listQueue).mockResolvedValue(listResponse([queue]));
    vi.mocked(pharmacyApi.getQueueItem).mockResolvedValue(queue);

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Ada Lovelace')).toHaveLength(2);
    });
    expect(screen.getAllByText('DR-001 - Cardiology').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.getByText('Allergy')).toBeInTheDocument();
    expect(screen.getByText('Penicillin')).toBeInTheDocument();
    expect(screen.getAllByText('Amoxicillin').length).toBeGreaterThan(0);
    expect(screen.getByText('500mg | Twice daily')).toBeInTheDocument();
  });

  it('saves dispensing with the MS-25 backend payload and fulfills handled prescriptions', async () => {
    const queue = makeQueue({ status: 'IN_PROGRESS' });
    const dispensed = makeQueue({
      ...queue,
      status: 'DISPENSED',
      dispensingItems: [
        {
          ...queue.dispensingItems[0],
          inventoryItemId: '77777777-7777-4777-8777-777777777777',
          quantityDispensed: 30,
          status: 'DISPENSED',
          inventoryItem: {
            id: '77777777-7777-4777-8777-777777777777',
            sku: 'AMOX-500',
            name: 'Amoxicillin 500mg',
            unitOfMeasure: 'tablets',
            currentStock: 70,
            reorderLevel: 20,
            unitCost: 1.25,
            isActive: true,
          },
        },
      ],
    });
    const fulfilled = makeQueue({ ...dispensed, status: 'FULFILLED', processedAt: '2030-01-02T09:00:00.000Z' });

    vi.mocked(pharmacyApi.listQueue).mockResolvedValue(listResponse([queue]));
    vi.mocked(pharmacyApi.getQueueItem).mockResolvedValue(queue);
    vi.mocked(pharmacyApi.dispenseQueue).mockResolvedValue(dispensed);
    vi.mocked(pharmacyApi.fulfillQueue).mockResolvedValue(fulfilled);

    renderPage();

    fireEvent.change(await screen.findByLabelText('Inventory item id'), {
      target: { value: '77777777-7777-4777-8777-777777777777' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save dispensing/i }));

    await waitFor(() => {
      expect(pharmacyApi.dispenseQueue).toHaveBeenCalledWith(queue.id, {
        items: [
          {
            prescriptionItemId: queue.dispensingItems[0].prescriptionItemId,
            inventoryItemId: '77777777-7777-4777-8777-777777777777',
            quantityDispensed: 30,
            status: 'dispensed',
            notes: null,
          },
        ],
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: /^fulfill$/i }));

    await waitFor(() => {
      expect(pharmacyApi.fulfillQueue).toHaveBeenCalledWith(queue.id);
    });
  });

  it('shows backend validation errors from dispensing', async () => {
    const queue = makeQueue({ status: 'IN_PROGRESS' });

    vi.mocked(pharmacyApi.listQueue).mockResolvedValue(listResponse([queue]));
    vi.mocked(pharmacyApi.getQueueItem).mockResolvedValue(queue);
    vi.mocked(pharmacyApi.dispenseQueue).mockRejectedValue(backendError('Insufficient stock for inventory item'));

    renderPage();

    fireEvent.change(await screen.findByLabelText('Inventory item id'), {
      target: { value: '77777777-7777-4777-8777-777777777777' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save dispensing/i }));

    expect(await screen.findByText('Insufficient stock for inventory item')).toBeInTheDocument();
  });
});
