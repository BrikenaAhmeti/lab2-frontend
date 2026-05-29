import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedSearchPage from '@/features/search/pages/AdvancedSearchPage';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import { advancedSearchApi, type PatientSearchItem, type SearchParams } from '@/lib/api/search-api';

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
    vi.mocked(advancedSearchApi.search).mockImplementation(async (_resource, params: SearchParams) => ({
      data: [patient],
      total: 16,
      page: Number(params.page ?? 1),
      limit: Number(params.limit ?? 10),
      totalPages: 2,
    }));
  });

  it('loads patients from the backend search endpoint with URL filters', async () => {
    renderSearch('/admin/search/patients?q=arta&page=2&bloodType=A_POSITIVE&sortBy=lastName&sortOrder=asc');

    expect(await screen.findByText('Arta Krasniqi')).toBeInTheDocument();
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
});
