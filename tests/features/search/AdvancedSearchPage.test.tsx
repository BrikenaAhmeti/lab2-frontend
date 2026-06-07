import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedSearchPage from '@/features/search/pages/AdvancedSearchPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import {
  advancedSearchApi,
  type AuditLogSearchItem,
  type PatientSearchItem,
  type SearchParams,
  type SearchResource,
} from '@/lib/api/search-api';

vi.mock('@/lib/api/search-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/search-api')>('@/lib/api/search-api');

  return {
    ...actual,
    advancedSearchApi: {
      search: vi.fn(),
    },
  };
});

const patient: PatientSearchItem = {
  id: 'patient-1',
  userId: 'user-1',
  firstName: 'Arta',
  lastName: 'Krasniqi',
  personalNumber: '1234567890',
  email: 'arta@example.com',
  phone: '+38344111222',
  dateOfBirth: '1995-04-10T00:00:00.000Z',
  age: 31,
  gender: 'female',
  bloodType: 'A_POSITIVE',
  isActive: true,
  createdAt: '2026-01-10T00:00:00.000Z',
  updatedAt: '2026-01-10T00:00:00.000Z',
};

const auditLog = {
  id: 'audit-1',
  action: 'UPDATE',
  entity: 'serviceCatalog',
  entityId: 'service-1',
  userId: 'user-1',
  user: {
    id: 'user-1',
    firstName: 'Ariana',
    lastName: 'Kelmendi',
    email: 'ariana@example.com',
  },
  ip: '127.0.0.1',
  userAgent: 'Vitest browser',
  requestId: 'request-1',
  metadata: {
    reason: 'Admin change',
    module: 'Services',
  },
  oldValue: {
    defaultPrice: 50,
    isActive: true,
  },
  newValue: {
    defaultPrice: 75,
    isActive: false,
  },
  timestamp: '2026-01-12T10:00:00.000Z',
} satisfies AuditLogSearchItem & { user: { id: string; firstName: string; lastName: string; email: string } };

const partialSearchRows: Partial<Record<SearchResource, unknown[]>> = {
  appointments: [
    {
      id: 'appointment-1',
      patient: {
        id: 'patient-2',
        name: 'Mira Imeri',
        email: 'mira@example.com',
        phone: null,
      },
      staff: null,
      status: 'SCHEDULED',
      scheduledAt: '2026-01-15T09:00:00.000Z',
    },
  ],
  'lab-orders': [
    {
      id: 'lab-order-1',
      patient: {
        id: 'patient-3',
        name: 'Leart Gashi',
        email: null,
        phone: '+38344123456',
      },
      status: 'PENDING',
      priority: null,
      hasCritical: false,
      testCount: 2,
      orderedAt: '2026-01-16T10:00:00.000Z',
    },
  ],
  'inventory-items': [
    {
      id: 'inventory-1',
      name: 'CBC Tube',
      sku: 'LAB-CBC-1',
      currentStock: 5,
      unitOfMeasure: 'boxes',
      reorderLevel: 10,
      stockLevel: 'low',
      expiryDate: null,
    },
  ],
  staff: [
    {
      id: 'staff-1',
      displayName: 'Drin Hoxha',
      employeeCode: 'EMP-001',
      specialization: null,
      employmentStatus: 'ACTIVE',
      hireDate: null,
    },
  ],
  'audit-logs': [
    {
      id: 'audit-partial-1',
      entityId: 'record-1',
      userId: 'system-user',
      timestamp: '2026-01-17T10:00:00.000Z',
    },
  ],
};

function setAdminSession() {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'admin-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions: [
          'patients:read',
          'appointments:read',
          'lab_orders:read',
          'inventory:read',
          'staff:read',
          'audit_logs:read',
        ],
      },
    })
  );
}

function renderSearch(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/admin/search/:resource" element={<AdvancedSearchPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('AdvancedSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAdminSession();
    vi.mocked(advancedSearchApi.search).mockImplementation(async (resource, params: SearchParams) => ({
      data: resource === 'audit-logs' ? [auditLog] : [patient],
      total: 16,
      page: Number(params.page ?? 1),
      limit: Number(params.limit ?? 10),
      totalPages: 2,
    }));
  });

  it('loads patients from the backend search endpoint with URL filters', async () => {
    renderSearch('/admin/search/patients?q=arta&page=2&bloodType=A_POSITIVE&sortBy=lastName&sortOrder=asc');

    expect(await screen.findByText('Arta Krasniqi')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toHaveValue('arta');

    expect(advancedSearchApi.search).toHaveBeenCalledWith(
      'patients',
      expect.objectContaining({
        q: 'arta',
        page: 2,
        bloodType: 'A_POSITIVE',
        sortBy: 'lastName',
        sortOrder: 'asc',
      })
    );
  });

  it('debounces search and toggles sorted column direction', async () => {
    renderSearch('/admin/search/patients?sortBy=lastName&sortOrder=asc');

    expect(await screen.findByText('Arta Krasniqi')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'rita' } });

    await waitFor(
      () => {
        expect(advancedSearchApi.search).toHaveBeenLastCalledWith(
          'patients',
          expect.objectContaining({ q: 'rita' })
        );
      },
      { timeout: 1200 }
    );

    fireEvent.click(screen.getByRole('button', { name: /name/i }));

    await waitFor(() => {
      expect(advancedSearchApi.search).toHaveBeenLastCalledWith(
        'patients',
        expect.objectContaining({
          sortBy: 'lastName',
          sortOrder: 'desc',
        })
      );
    });
  });

  it('clears search, filters, page, and sort from the request', async () => {
    renderSearch('/admin/search/patients?q=arta&page=2&bloodType=A_POSITIVE&sortBy=lastName&sortOrder=asc');

    expect(await screen.findByText('Arta Krasniqi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

    await waitFor(() => {
      expect(advancedSearchApi.search).toHaveBeenLastCalledWith(
        'patients',
        expect.not.objectContaining({
          q: expect.any(String),
          bloodType: expect.any(String),
          sortBy: expect.any(String),
          page: 2,
        })
      );
    });
  });

  it('shows audit log actors, changed fields, and request context without sending client-only filters', async () => {
    renderSearch('/admin/search/audit-logs?userId=user-1&changedField=defaultPrice&from=2026-01-01&to=2026-01-31');

    expect(await screen.findByText('Ariana Kelmendi')).toBeInTheDocument();
    expect(screen.getByText('Default Price')).toBeInTheDocument();
    expect(screen.getAllByText('50').length).toBeGreaterThan(0);
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText(/Reason: Admin change/)).toBeInTheDocument();
    expect(screen.getByText(/Request request-1/)).toBeInTheDocument();
    expect(screen.getByLabelText('Changed field')).toHaveValue('defaultPrice');

    expect(advancedSearchApi.search).toHaveBeenCalledWith(
      'audit-logs',
      expect.objectContaining({
        userId: 'user-1',
        from: '2026-01-01',
        to: '2026-01-31',
      })
    );
    expect(advancedSearchApi.search).not.toHaveBeenCalledWith(
      'audit-logs',
      expect.objectContaining({
        changedField: 'defaultPrice',
      })
    );
  });

  it.each([
    ['appointments', 'Mira Imeri'],
    ['lab-orders', 'Leart Gashi'],
    ['inventory-items', 'CBC Tube'],
    ['staff', 'Drin Hoxha'],
    ['audit-logs', 'system-user'],
  ] satisfies Array<[SearchResource, string]>)('renders %s results when optional relation data is missing', async (resource, expectedText) => {
    vi.mocked(advancedSearchApi.search).mockImplementation(async (requestedResource, params: SearchParams) => ({
      data: partialSearchRows[requestedResource] ?? [],
      total: 1,
      page: Number(params.page ?? 1),
      limit: Number(params.limit ?? 10),
      totalPages: 1,
    }));

    renderSearch(`/admin/search/${resource}`);

    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });
});
