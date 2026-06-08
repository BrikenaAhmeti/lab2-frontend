import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BillingPage from '@/features/billing/pages/BillingPage';
import { billingApi, type BillingView } from '@/lib/api/billing-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/billing-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/billing-api')>('@/lib/api/billing-api');

  return {
    ...actual,
    billingApi: {
      list: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      markPaid: vi.fn(),
      stats: vi.fn(),
      downloadPdf: vi.fn(),
    },
  };
});

function makeBilling(overrides: Partial<BillingView> = {}): BillingView {
  return {
    id: 'b14d4f97-281c-41b5-b6f4-215c4c620878',
    patientId: 'patient-1',
    appointmentId: 'appointment-1',
    billingNumber: 'BILL-20260521-E61720AB',
    status: 'PENDING',
    subtotal: 80,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 80,
    amountPaid: 0,
    outstandingAmount: 80,
    dueDate: '2026-05-30T00:00:00.000Z',
    issuedAt: '2026-05-21T09:00:00.000Z',
    paidAt: null,
    notes: null,
    createdAt: '2026-05-21T09:00:00.000Z',
    updatedAt: '2026-05-21T09:00:00.000Z',
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
      scheduledAt: '2026-05-21T08:00:00.000Z',
      endAt: '2026-05-21T08:30:00.000Z',
      service: {
        id: 'service-1',
        name: 'General consultation',
      },
    },
    items: [
      {
        id: 'item-1',
        billingId: 'b14d4f97-281c-41b5-b6f4-215c4c620878',
        serviceCatalogId: 'service-1',
        inventoryItemId: null,
        description: 'General consultation',
        quantity: 1,
        unitPrice: 80,
        totalPrice: 80,
        sourceEntityType: 'appointment',
        sourceEntityId: 'appointment-1',
        createdAt: '2026-05-21T09:00:00.000Z',
        updatedAt: '2026-05-21T09:00:00.000Z',
      },
    ],
    payments: [],
    ...overrides,
  };
}

function renderBillingPage() {
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
          id: 'admin-user',
          email: 'admin@medsphere.local',
          roles: ['Admin'],
          permissions: ['billing:read:all', 'billing:manage:all'],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/billing']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/admin/billing" element={<BillingPage portal="admin" />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('BillingPage', () => {
  let downloadedFileName = '';

  beforeEach(() => {
    vi.clearAllMocks();
    downloadedFileName = '';
    const billing = makeBilling();
    vi.mocked(billingApi.list).mockResolvedValue({
      items: [billing],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(billingApi.get).mockResolvedValue(billing);
    vi.mocked(billingApi.downloadPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    vi.mocked(billingApi.stats).mockResolvedValue({
      totalRevenue: 80,
      outstanding: 80,
      statusCounts: {
        DRAFT: 0,
        PENDING: 1,
        PARTIALLY_PAID: 0,
        PAID: 0,
        CANCELLED: 0,
        OVERDUE: 0,
      },
    });
    vi.mocked(billingApi.update).mockResolvedValue(makeBilling({ subtotal: 95, totalAmount: 95, outstandingAmount: 95 }));
    vi.mocked(billingApi.markPaid).mockResolvedValue(
      makeBilling({
        status: 'PAID',
        amountPaid: 80,
        outstandingAmount: 0,
        paidAt: '2026-05-21T12:00:00.000Z',
      })
    );
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:billing'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFileName = this.download;
    });
  });

  it('edits line items and keeps mark paid as the only payment action in the billing details', async () => {
    renderBillingPage();

    expect(await screen.findByText('BILL-20260521-E61720AB')).toBeInTheDocument();
    expect(screen.getAllByText('Arta Krasniqi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    expect(screen.queryByText('Invoice PDF')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(await screen.findByRole('dialog', { name: 'Billing statement' })).toBeInTheDocument();
    expect(screen.getByText('Invoice PDF')).toBeInTheDocument();
    expect(screen.getAllByText('MedSphere Healthcare Management Platform').length).toBeGreaterThan(0);
    expect(screen.getByText('Invoice totals')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText('Due date')).toHaveValue('2026-05-30');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => {
      expect(billingApi.downloadPdf).toHaveBeenCalledWith('b14d4f97-281c-41b5-b6f4-215c4c620878');
    });
    expect(downloadedFileName).toBe('arta-krasniqi-2026-05-21-bill-20260521-e61720ab.pdf');

    fireEvent.change(screen.getByLabelText('Manual item'), { target: { value: 'Manual supply charge' } });
    fireEvent.change(screen.getByLabelText('Unit price'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save billing' }));

    await waitFor(() => {
      expect(billingApi.update).toHaveBeenCalledWith(
        'b14d4f97-281c-41b5-b6f4-215c4c620878',
        expect.objectContaining({
          taxAmount: 0,
          discountAmount: 0,
          items: [expect.objectContaining({ description: 'Manual supply charge', quantity: 1, unitPrice: 15 })],
        })
      );
    });
    expect(screen.queryByRole('button', { name: 'Record Payment' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Mark Paid' }).length).toBeGreaterThan(0);
  });

  it('marks a billing record as paid from the billing details', async () => {
    renderBillingPage();

    expect(await screen.findByText('BILL-20260521-E61720AB')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const billingDialog = await screen.findByRole('dialog', { name: 'Billing statement' });

    fireEvent.click(within(billingDialog).getByRole('button', { name: 'Mark Paid' }));
    expect(await screen.findByRole('dialog', { name: 'Mark billing paid' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Payment method'), { target: { value: 'BANK_TRANSFER' } });
    fireEvent.change(screen.getByLabelText('Reference number'), { target: { value: ' SETTLED-001 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm paid' }));

    await waitFor(() => {
      expect(billingApi.markPaid).toHaveBeenCalledWith('b14d4f97-281c-41b5-b6f4-215c4c620878', {
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'SETTLED-001',
        notes: null,
      });
    });
    expect(await screen.findByText('Billing marked as paid.')).toBeInTheDocument();
  });

  it('marks a billing record as paid from the table row', async () => {
    renderBillingPage();

    expect(await screen.findByText('BILL-20260521-E61720AB')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Paid' }));
    expect(await screen.findByRole('dialog', { name: 'Mark billing paid' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Payment method'), { target: { value: 'CARD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm paid' }));

    await waitFor(() => {
      expect(billingApi.markPaid).toHaveBeenCalledWith('b14d4f97-281c-41b5-b6f4-215c4c620878', {
        paymentMethod: 'CARD',
        referenceNumber: null,
        notes: null,
      });
    });
  });

  it('sends patient search and calendar date filters to the billing backend', async () => {
    renderBillingPage();

    expect(await screen.findByText('BILL-20260521-E61720AB')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: 'Arta' } });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-05-31' } });

    await waitFor(() => {
      expect(billingApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: 'Arta',
          from: expect.any(String),
          to: expect.any(String),
        })
      );
    });

    const latestParams = vi.mocked(billingApi.list).mock.calls.at(-1)?.[0];
    expect(latestParams?.from).toBe(new Date('2026-05-01T00:00:00').toISOString());
    expect(latestParams?.to).toBe(new Date('2026-05-31T23:59:59.999').toISOString());
  });
});
