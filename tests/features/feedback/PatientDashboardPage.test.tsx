import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientDashboardPage from '@/pages/portals/PatientDashboardPage';
import { appointmentsApi, type AppointmentListParams, type AppointmentView } from '@/lib/api/appointments-api';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { chatApi } from '@/features/chat/chatApi';
import authReducer from '@/features/auth/authSlice';

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

vi.mock('@/features/notifications/notificationsApi', () => ({
  notificationsApi: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/chat/chatApi', () => ({
  chatApi: {
    listRooms: vi.fn(),
  },
}));

const upcomingAppointment: AppointmentView = {
  id: 'appointment-1',
  patientId: 'patient-1',
  departmentId: 'department-1',
  serviceCatalogId: 'service-1',
  staffProfileId: 'doctor-1',
  status: 'CONFIRMED',
  appointmentType: 'IN_PERSON',
  scheduledAt: '2030-01-02T09:00:00.000Z',
  endAt: '2030-01-02T09:30:00.000Z',
  durationMinutes: 30,
  basePrice: 80,
  notes: null,
  checkedInAt: null,
  completedAt: null,
  cancelledAt: null,
  cancellationNote: null,
  createdAt: '2026-05-20T09:00:00.000Z',
  updatedAt: '2026-05-20T09:00:00.000Z',
  patient: {
    id: 'patient-1',
    firstName: 'Arta',
    lastName: 'Krasniqi',
    email: 'arta@example.com',
    phone: '+38344111222',
    name: 'Arta Krasniqi',
  },
  staff: {
    id: 'doctor-1',
    userId: 'doctor-user',
    employeeCode: 'DR-1',
    specialization: 'Cardiology',
    displayName: 'Dr. Lira',
  },
  service: {
    id: 'service-1',
    name: 'Cardiology Visit',
    defaultDurationMinutes: 30,
    defaultPrice: 80,
  },
  department: {
    id: 'department-1',
    name: 'Cardiology',
    isActive: true,
  },
};

function renderPatientDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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
          permissions: [],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <PatientDashboardPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('PatientDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appointmentsApi.list).mockImplementation((params: AppointmentListParams) => {
      if (params.hasNoFeedback) {
        return Promise.resolve({
          items: [],
          meta: { page: 1, limit: 3, total: 0, totalPages: 0 },
        });
      }

      return Promise.resolve({
        items: [upcomingAppointment],
        meta: { page: 1, limit: 3, total: 1, totalPages: 1 },
      });
    });
    vi.mocked(notificationsApi.unreadCount).mockResolvedValue(4);
    vi.mocked(chatApi.listRooms).mockResolvedValue({
      data: [
        {
          id: 'room-1',
          participants: ['patient-user', 'doctor-user'],
          type: 'direct',
          lastMessageAt: null,
          lastMessage: null,
          createdAt: '2030-01-02T09:00:00.000Z',
          updatedAt: '2030-01-02T09:00:00.000Z',
          unreadCount: 2,
        },
      ],
      meta: { page: 1, limit: 100, totalItems: 1, totalPages: 1 },
    });
  });

  it('loads the MS-55 dashboard counts and pending feedback prompt query', async () => {
    renderPatientDashboard();

    expect(await screen.findByText('Cardiology Visit')).toBeInTheDocument();
    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(await screen.findByText('2')).toBeInTheDocument();

    await waitFor(() => {
      expect(appointmentsApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 'patient-1',
          status: 'COMPLETED',
          hasNoFeedback: true,
        })
      );
    });
  });
});
