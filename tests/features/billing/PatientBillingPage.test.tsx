import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientBillingPage from '@/features/billing/pages/PatientBillingPage';
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
      recordPayment: vi.fn(),
      stats: vi.fn(),
      downloadPdf: vi.fn(),
    },
  };
});

const billing: BillingView = {
  id: 'billing-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  billingNumber: 'BILL-20260521-E61720AB',
  status: 'PAID',
  subtotal: 80,
  taxAmount: 0,
  discountAmount: 0,
  totalAmount: 80,
  amountPaid: 80,
  outstandingAmount: 0,
  dueDate: null,
  issuedAt: '2026-05-21T09:00:00.000Z',
  paidAt: '2026-05-21T10:00:00.000Z',
  notes: null,
  createdAt: '2026-05-21T09:00:00.000Z',
  updatedAt: '2026-05-21T10:00:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'patient-user',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  appointment: null,
  items: [],
  payments: [],
};

function renderPatientBillingPage() {
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
          permissions: ['billing:read'],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/patient/billing']}>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/patient/billing" element={<PatientBillingPage />} />
          </Routes>
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PatientBillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(billingApi.list).mockResolvedValue({
      items: [billing],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(billingApi.downloadPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
    Object.defineProperty(window.URL, 'createObjectURL', { value: vi.fn(() => 'blob:billing'), writable: true });
    Object.defineProperty(window.URL, 'revokeObjectURL', { value: vi.fn(), writable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('loads patient billing history and downloads the backend PDF statement', async () => {
    renderPatientBillingPage();

    expect(await screen.findByText('BILL-20260521-E61720AB')).toBeInTheDocument();
    expect(billingApi.list).toHaveBeenCalledWith({ page: 1, limit: 50, patientId: 'patient-1' });
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));

    await waitFor(() => {
      expect(billingApi.downloadPdf).toHaveBeenCalledWith('billing-1');
    });
  });
});
