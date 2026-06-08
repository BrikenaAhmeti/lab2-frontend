import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import ChatPage from '@/features/chat/pages/ChatPage';
import type { ChatMessage, ChatRoomsPage } from '@/features/chat/chatTypes';

const chatApiMock = vi.hoisted(() => ({
  listRooms: vi.fn(),
  createRoom: vi.fn(),
  listMessages: vi.fn(),
  sendMessage: vi.fn(),
  markRead: vi.fn(),
  uploadAttachment: vi.fn(),
}));

const staffApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  publicList: vi.fn(),
}));

const patientsApiMock = vi.hoisted(() => ({
  list: vi.fn(),
}));

const socketState = vi.hoisted(() => {
  const socket = {
    connected: true,
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'connect') handler();
      return socket;
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };

  return {
    socket,
    io: vi.fn(() => socket),
    reset() {
      socket.on.mockClear();
      socket.emit.mockClear();
      socket.disconnect.mockClear();
      this.io.mockClear();
    },
  };
});

vi.mock('@/features/chat/chatApi', () => ({
  chatApi: chatApiMock,
}));

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: staffApiMock,
}));

vi.mock('@/lib/api/patients-api', () => ({
  patientsApi: patientsApiMock,
}));

vi.mock('socket.io-client', () => ({
  io: socketState.io,
}));

const roomsPage: ChatRoomsPage = {
  data: [
    {
      id: 'room-1',
      participants: ['user-1', { id: 'doctor-1', name: 'Dr Mira Kelmendi' }],
      type: 'direct',
      lastMessageAt: '2026-05-27T08:30:00.000Z',
      lastMessage: {
        id: 'message-1',
        senderId: 'doctor-1',
        content: 'Your lab result is ready.',
        type: 'text',
        fileUrl: null,
        createdAt: '2026-05-27T08:30:00.000Z',
      },
      unreadCount: 0,
      createdAt: '2026-05-27T08:00:00.000Z',
      updatedAt: '2026-05-27T08:30:00.000Z',
    },
  ],
  meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
};

const sentMessage: ChatMessage = {
  id: 'message-2',
  roomId: 'room-1',
  senderId: 'user-1',
  content: 'Thanks doctor',
  type: 'text',
  fileUrl: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-05-27T08:35:00.000Z',
};

function renderChatPage(initialEntry = '/patient/messages/room-1') {
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
            <Route path="/patient/messages" element={<ChatPage />} />
            <Route path="/patient/messages/:roomId" element={<ChatPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    socketState.reset();
    store.dispatch(clearSession());
    store.dispatch(
      setSession({
        accessToken: 'access-token',
        user: {
          id: 'user-1',
          email: 'patient@medsphere.test',
          roles: ['Patient'],
          permissions: [],
        },
      })
    );
    chatApiMock.listRooms.mockResolvedValue(roomsPage);
    staffApiMock.list.mockResolvedValue({ items: [] });
    staffApiMock.publicList.mockResolvedValue({ items: [] });
    patientsApiMock.list.mockResolvedValue({ items: [] });
    chatApiMock.listMessages.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 },
    });
    chatApiMock.markRead.mockResolvedValue({
      roomId: 'room-1',
      readCount: 0,
      readAt: '2026-05-27T08:36:00.000Z',
    });
  });

  it('sends a text message with the active room id', async () => {
    chatApiMock.sendMessage.mockResolvedValue(sentMessage);

    renderChatPage();

    expect(await screen.findByRole('heading', { name: 'Dr Mira Kelmendi' })).toBeInTheDocument();

    const composer = screen.getByPlaceholderText('Write a message...');
    fireEvent.change(composer, { target: { value: 'Thanks doctor' } });
    fireEvent.keyDown(composer, { key: 'Enter' });

    await waitFor(() =>
      expect(chatApiMock.sendMessage).toHaveBeenCalledWith({
        roomId: 'room-1',
        content: 'Thanks doctor',
        type: 'text',
      })
    );
  });

  it('uploads an attachment before sending an image message', async () => {
    const image = new File(['scan'], 'scan.png', { type: 'image/png' });
    chatApiMock.uploadAttachment.mockResolvedValue({
      fileName: 'scan.png',
      fileUrl: '/uploads/chat/scan.png',
      mimeType: 'image/png',
      size: 4,
    });
    chatApiMock.sendMessage.mockResolvedValue({
      ...sentMessage,
      id: 'message-3',
      content: 'scan.png',
      type: 'image',
      fileUrl: '/uploads/chat/scan.png',
    });

    const { container } = renderChatPage();

    expect(await screen.findByRole('heading', { name: 'Dr Mira Kelmendi' })).toBeInTheDocument();

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [image] } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(chatApiMock.uploadAttachment).toHaveBeenCalledWith('room-1', image));
    expect(chatApiMock.sendMessage).toHaveBeenCalledWith({
      roomId: 'room-1',
      content: 'scan.png',
      type: 'image',
      fileUrl: '/uploads/chat/scan.png',
    });
  });

  it('starts a new direct room from the contact picker', async () => {
    const emptyRoomsPage = {
      ...roomsPage,
      data: [],
      meta: { page: 1, limit: 50, totalItems: 0, totalPages: 1 },
    };
    const createdRoom = {
      id: 'room-2',
      participants: ['user-1', 'doctor-2'],
      type: 'direct' as const,
      lastMessageAt: null,
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-05-27T09:00:00.000Z',
      updatedAt: '2026-05-27T09:00:00.000Z',
    };

    chatApiMock.listRooms
      .mockResolvedValueOnce(emptyRoomsPage)
      .mockResolvedValueOnce({
        ...roomsPage,
        data: [createdRoom],
        meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
      });
    staffApiMock.publicList.mockResolvedValue({
      items: [
        {
          id: 'staff-2',
          userId: 'doctor-2',
          user: {
            id: 'doctor-2',
            name: 'Dr Arta Gashi',
            email: 'arta@medsphere.test',
          },
          positionType: {
            id: 'position-doctor',
            name: 'Doctor',
            defaultRoleKey: 'doctor',
          },
        },
      ],
    });
    chatApiMock.createRoom.mockResolvedValue(createdRoom);

    renderChatPage('/patient/messages');

    const contact = await screen.findByRole('button', { name: /Dr Arta Gashi/i });
    fireEvent.click(contact);

    await waitFor(() =>
      expect(chatApiMock.createRoom).toHaveBeenCalledWith({
        participantId: 'doctor-2',
        participantRole: 'doctor',
      })
    );
    expect(await screen.findByRole('heading', { name: 'Dr Arta Gashi' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /User doctor-/i })).not.toBeInTheDocument();
  });
});
