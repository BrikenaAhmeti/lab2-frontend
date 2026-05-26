import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactInboxPage from '@/features/contact/pages/ContactInboxPage';
import { contactApi, type ContactMessageView } from '@/lib/api/contact-api';
import authReducer from '@/features/auth/authSlice';

vi.mock('@/lib/api/contact-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/contact-api')>('@/lib/api/contact-api');

  return {
    ...actual,
    contactApi: {
      submit: vi.fn(),
      list: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

const contactMessage: ContactMessageView = {
  id: '9d8ae239-d774-45d1-b8c0-c7f566e0e604',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+38344111222',
  subject: 'Appointment question',
  message: 'Can I move my appointment?',
  status: 'new',
  replyNotes: null,
  repliedAt: null,
  createdAt: '2026-05-26T10:00:00.000Z',
  updatedAt: '2026-05-26T10:00:00.000Z',
};

function renderContactInbox() {
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
          permissions: ['contact:read:all', 'contact:manage:all'],
        },
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <ContactInboxPage />
        </QueryClientProvider>
      </MemoryRouter>
    </Provider>
  );
}

describe('ContactInboxPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contactApi.list).mockResolvedValue({
      items: [contactMessage],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
    });
    vi.mocked(contactApi.updateStatus).mockResolvedValue({
      ...contactMessage,
      status: 'replied',
      replyNotes: 'Answered by email',
      repliedAt: '2026-05-26T10:05:00.000Z',
    });
  });

  it('requires reply notes before marking a contact message replied', async () => {
    renderContactInbox();

    expect(await screen.findByText('Appointment question')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark Replied' }));

    expect(await screen.findByText('Reply notes are required before marking replied.')).toBeInTheDocument();
    expect(contactApi.updateStatus).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reply notes'), { target: { value: ' Answered by email ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mark Replied' }));

    await waitFor(() => {
      expect(contactApi.updateStatus).toHaveBeenCalledWith('9d8ae239-d774-45d1-b8c0-c7f566e0e604', {
        status: 'replied',
        replyNotes: 'Answered by email',
      });
    });
  });
});
