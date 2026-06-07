import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeedbackInboxPage from '@/features/feedback/pages/FeedbackInboxPage';
import authReducer from '@/features/auth/authSlice';
import { feedbackApi, type FeedbackView } from '@/lib/api/feedback-api';

vi.mock('@/lib/api/feedback-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/feedback-api')>('@/lib/api/feedback-api');

  return {
    ...actual,
    feedbackApi: {
      ...actual.feedbackApi,
      list: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

const feedback: FeedbackView = {
  id: 'feedback-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  rating: 5,
  comment: 'Helpful doctor',
  status: 'pending',
  isAnonymous: false,
  submittedAt: '2026-01-15T12:00:00.000Z',
  createdAt: '2026-01-15T12:00:00.000Z',
  updatedAt: '2026-01-15T12:00:00.000Z',
  patient: {
    id: 'patient-1',
    userId: 'user-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  appointment: {
    id: 'appointment-1',
    patientId: 'patient-1',
    departmentId: 'department-1',
    staffProfileId: 'staff-1',
    status: 'COMPLETED',
    scheduledAt: '2026-01-14T09:00:00.000Z',
    endAt: '2026-01-14T09:30:00.000Z',
    completedAt: '2026-01-14T09:30:00.000Z',
    service: {
      id: 'service-1',
      name: 'Cardiology Visit',
    },
    staff: {
      id: 'staff-1',
      userId: 'doctor-user',
      employeeCode: 'DR-1',
      specialization: 'Cardiology',
      displayName: 'Dr. Lira',
    },
    department: {
      id: 'department-1',
      name: 'Cardiology',
    },
  },
};

function renderFeedbackInbox() {
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
        refreshToken: null,
        tokens: { accessToken: 'token' },
        status: 'authenticated' as const,
        user: {
          id: 'doctor-user',
          email: 'doctor@example.com',
          roles: ['Doctor'],
          permissions: ['feedback:read'],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <FeedbackInboxPage portal="doctor" />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('FeedbackInboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(feedbackApi.list).mockResolvedValue({
      items: [feedback],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    vi.mocked(feedbackApi.updateStatus).mockResolvedValue(feedback);
  });

  it('queries feedback with patient, appointment, and submitted date range filters', async () => {
    renderFeedbackInbox();

    expect(await screen.findByText('Helpful doctor')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: 'arta' } });
    fireEvent.change(screen.getByLabelText('Appointment'), { target: { value: 'cardiology' } });
    fireEvent.click(screen.getByRole('button', { name: /submitted date/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Range' }));
    fireEvent.change(screen.getByLabelText('Submitted from'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Submitted to'), { target: { value: '2026-01-31' } });

    await waitFor(() => {
      expect(feedbackApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          patientSearch: 'arta',
          appointmentSearch: 'cardiology',
          status: 'pending',
          submittedAtFrom: '2026-01-01',
          submittedAtTo: '2026-01-31',
        })
      );
    });
  });

  it('clears every feedback filter', async () => {
    renderFeedbackInbox();

    expect(await screen.findByText('Helpful doctor')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Patient'), { target: { value: 'arta' } });
    fireEvent.change(screen.getByLabelText('Appointment'), { target: { value: 'cardiology' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'published' } });
    fireEvent.click(screen.getByRole('button', { name: /submitted date/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Range' }));
    fireEvent.change(screen.getByLabelText('Submitted from'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Submitted to'), { target: { value: '2026-01-31' } });

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(feedbackApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          patientSearch: undefined,
          appointmentSearch: undefined,
          status: undefined,
          submittedAtFrom: undefined,
          submittedAtTo: undefined,
        })
      );
    });
  });
});
