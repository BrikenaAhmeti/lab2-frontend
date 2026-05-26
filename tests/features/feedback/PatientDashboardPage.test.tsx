import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboardPage from '@/pages/portals/PatientDashboardPage';
import { appointmentsApi } from '@/lib/api/appointments-api';

vi.mock('@/lib/api/appointments-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/appointments-api')>('@/lib/api/appointments-api');

  return {
    ...actual,
    appointmentsApi: {
      ...actual.appointmentsApi,
      list: vi.fn(),
    },
  };
});

function renderPatientDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <PatientDashboardPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('PatientDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appointmentsApi.list).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 3, total: 0, totalPages: 0 },
    });
  });

  it('queries completed appointments without feedback for the dashboard prompt', async () => {
    renderPatientDashboard();

    await waitFor(() => {
      expect(appointmentsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'COMPLETED',
          hasNoFeedback: true,
        })
      );
    });
  });
});
