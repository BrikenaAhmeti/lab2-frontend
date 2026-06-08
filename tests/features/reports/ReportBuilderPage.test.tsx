import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReportBuilderPage from '@/features/reports/pages/ReportBuilderPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { departmentsApi } from '@/lib/api/departments-api';
import { reportsApi } from '@/lib/api/reports-api';
import { servicesApi } from '@/lib/api/services-api';
import { staffApi } from '@/lib/api/staff-api';

vi.mock('@/features/reports/components/ReportChart', () => ({
  default: () => <div>Chart preview</div>,
}));

vi.mock('@/features/reports/components/ReportDashboardCards', () => ({
  default: () => <div>Report snapshots</div>,
}));

vi.mock('@/lib/api/departments-api', () => ({
  departmentsApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/lib/api/services-api', () => ({
  servicesApi: {
    list: vi.fn(),
  },
}));

vi.mock('@/lib/api/reports-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/reports-api')>('@/lib/api/reports-api');

  return {
    ...actual,
    reportsApi: {
      generateReport: vi.fn(),
      exportReport: vi.fn(),
      listTemplates: vi.fn(),
      saveTemplate: vi.fn(),
    },
  };
});

const departmentsResponse = {
  items: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Cardiology',
      description: null,
      floor: null,
      phoneExtension: null,
      operatingHours: null,
      isActive: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const staffResponse = {
  items: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      employeeCode: 'DR-01',
      specialization: 'Cardiology',
      user: { id: 'user-1', firstName: 'Ada', lastName: 'Hart', email: 'ada@example.com' },
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const servicesResponse = {
  items: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      departmentId: '11111111-1111-4111-8111-111111111111',
      name: 'Initial Consultation',
      description: null,
      defaultDurationMinutes: 30,
      defaultPrice: 50,
      isActive: true,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
};

const appointmentReport = {
  type: 'appointments' as const,
  title: 'Appointment Report',
  generatedAt: '2026-05-29T10:00:00.000Z',
  groupBy: 'department',
  filters: {
    from: null,
    to: null,
    departmentId: null,
    staffProfileId: null,
    serviceCatalogId: null,
    status: 'COMPLETED',
  },
  summary: [{ label: 'Total appointments', value: 2 }],
  rows: [{ group: 'Cardiology', appointments: 2, completed: 2 }],
};

const template = {
  id: '68161b75c0834e2ec5d2b914',
  name: 'Completed appointments',
  description: 'Completed by department',
  reportType: 'appointments' as const,
  parameters: {
    groupBy: 'department',
    status: 'COMPLETED',
    departmentId: '11111111-1111-4111-8111-111111111111',
  },
  createdBy: 'user-1',
  createdAt: '2026-05-29T10:00:00.000Z',
  updatedAt: '2026-05-29T10:00:00.000Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/reports']}>
          <Routes>
            <Route path="/admin/reports" element={<ReportBuilderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

function setUserSession(permissions: string[]) {
  store.dispatch(clearSession());
  store.dispatch(
    setSession({
      accessToken: 'access',
      user: {
        id: 'user-1',
        email: 'admin@example.com',
        roles: ['Admin'],
        permissions,
      },
    })
  );
}

function selectByLabel(label: string) {
  return screen.getByLabelText(label) as HTMLSelectElement;
}

describe('ReportBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    store.dispatch(clearSession());
    vi.mocked(departmentsApi.list).mockResolvedValue(departmentsResponse);
    vi.mocked(staffApi.list).mockResolvedValue(staffResponse);
    vi.mocked(servicesApi.list).mockResolvedValue(servicesResponse);
    vi.mocked(reportsApi.listTemplates).mockResolvedValue({ items: [template] });
    vi.mocked(reportsApi.generateReport).mockResolvedValue(appointmentReport);
    vi.mocked(reportsApi.saveTemplate).mockResolvedValue(template);
    vi.mocked(reportsApi.exportReport).mockResolvedValue({
      blob: new Blob(['report']),
      filename: 'appointment-report.csv',
    });
    Object.defineProperty(window.URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:report'),
      configurable: true,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
    });
  });

  it('blocks users without report generation permission', () => {
    setUserSession([]);

    renderPage();

    expect(screen.getByText('auth.forbiddenTitle')).toBeInTheDocument();
  });

  it('generates a report with backend filters and renders dynamic results', async () => {
    setUserSession(['reports:generate']);
    renderPage();

    expect(await screen.findByText('Cardiology')).toBeInTheDocument();
    fireEvent.change(selectByLabel('Group by'), { target: { value: 'department' } });
    fireEvent.change(selectByLabel('Department'), {
      target: { value: '11111111-1111-4111-8111-111111111111' },
    });
    fireEvent.change(selectByLabel('Status'), { target: { value: 'COMPLETED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() =>
      expect(reportsApi.generateReport).toHaveBeenCalledWith('appointments', {
        from: undefined,
        to: undefined,
        groupBy: 'department',
        departmentId: '11111111-1111-4111-8111-111111111111',
        staffProfileId: undefined,
        serviceCatalogId: undefined,
        status: 'COMPLETED',
      })
    );
    expect(await screen.findByText('Appointment Report')).toBeInTheDocument();
    expect(screen.getByText('Total appointments')).toBeInTheDocument();
    expect(screen.getAllByText('Cardiology').length).toBeGreaterThan(0);
    expect(screen.getByText('Chart preview')).toBeInTheDocument();
  });

  it('saves the current report configuration as a template', async () => {
    setUserSession(['reports:generate']);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Save report template' }));
    fireEvent.change(screen.getByLabelText('Template name'), { target: { value: 'Monthly appointments' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'For operations review' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save template' }));

    await waitFor(() =>
      expect(reportsApi.saveTemplate).toHaveBeenCalledWith({
        name: 'Monthly appointments',
        description: 'For operations review',
        reportType: 'appointments',
        parameters: {
          from: null,
          to: null,
          groupBy: 'status',
          departmentId: null,
          staffProfileId: null,
          serviceCatalogId: null,
          status: null,
        },
      })
    );
  });

  it('loads a saved template and exports with its filters', async () => {
    setUserSession(['reports:generate']);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Use template' }));
    await waitFor(() => expect(selectByLabel('Group by').value).toBe('department'));
    expect(selectByLabel('Status').value).toBe('COMPLETED');

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(reportsApi.exportReport).toHaveBeenCalledWith(
        'appointments',
        {
          from: undefined,
          to: undefined,
          groupBy: 'department',
          departmentId: '11111111-1111-4111-8111-111111111111',
          staffProfileId: undefined,
          serviceCatalogId: undefined,
          status: 'COMPLETED',
        },
        'csv'
      )
    );
  });
});
