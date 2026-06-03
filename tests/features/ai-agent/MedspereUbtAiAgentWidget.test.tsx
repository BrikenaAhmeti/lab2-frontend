import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MedspereUbtAiAgentWidget from '@/features/ai-agent/MedspereUbtAiAgentWidget';
import authReducer, { setSession } from '@/features/auth/authSlice';

const socketMockState = vi.hoisted(() => {
  const handlers: Record<string, (payload?: unknown) => void> = {};
  const socket = {
    connected: true,
    on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      handlers[event] = handler;
      return socket;
    }),
    emit: vi.fn((event: string, _payload?: unknown, acknowledge?: (response: unknown) => void) => {
      if (event === 'dashboard-helper:message') {
        acknowledge?.({ ok: true, sessionId: 'agent-session-1' });
      }

      return socket;
    }),
    disconnect: vi.fn(),
  };

  return {
    handlers,
    socket,
    io: vi.fn(() => socket),
  };
});

vi.mock('socket.io-client', () => ({
  io: socketMockState.io,
}));

function renderWidget() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
    },
  });

  store.dispatch(
    setSession({
      accessToken: 'access-token',
      user: {
        id: 'doctor-1',
        email: 'doctor@medsphere.local',
        roles: ['Doctor'],
        permissions: ['lab_results:review'],
      },
    })
  );

  return render(
    <Provider store={store}>
      <MedspereUbtAiAgentWidget portalTitle="Doctor Portal" />
    </Provider>
  );
}

describe('MedspereUbtAiAgentWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(socketMockState.handlers).forEach((key) => {
      delete socketMockState.handlers[key];
    });
  });

  it('opens from the dashboard and sends authenticated role-aware socket messages', async () => {
    renderWidget();

    fireEvent.click(screen.getByRole('button', { name: 'Open MedSphere UBT AI Agent' }));
    expect(screen.getByRole('region', { name: 'MedSphere UBT AI Agent' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chat with us' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What should I do first today?' })).toBeInTheDocument();

    await waitFor(() =>
      expect(socketMockState.io).toHaveBeenCalledWith(
        'http://localhost:3010',
        expect.objectContaining({
          auth: { token: 'access-token' },
        })
      )
    );

    act(() => {
      socketMockState.handlers.connect?.();
    });

    fireEvent.change(screen.getByLabelText('Ask MedSphere UBT AI Agent'), {
      target: { value: 'What do I check first?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message to MedSphere UBT AI Agent' }));

    await waitFor(() =>
      expect(socketMockState.socket.emit).toHaveBeenCalledWith(
        'dashboard-helper:message',
        expect.objectContaining({
          message: 'What do I check first?',
          role: 'Doctor',
          portalTitle: 'Doctor Portal',
        }),
        expect.any(Function)
      )
    );

    expect(screen.getByText('Typing...')).toBeInTheDocument();

    act(() => {
      socketMockState.handlers['dashboard-helper:message']?.({
        sessionId: 'agent-session-1',
        role: 'assistant',
        content: 'Open Doctor Dashboard and start with checked-in consultations.',
      });
    });

    expect(screen.getByText('What do I check first?')).toBeInTheDocument();
    expect(
      await screen.findByText('Open Doctor Dashboard and start with checked-in consultations.')
    ).toBeInTheDocument();
  });
});
