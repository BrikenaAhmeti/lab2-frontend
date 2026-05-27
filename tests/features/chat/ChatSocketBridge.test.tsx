import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { store } from '@/app/store';
import { clearSession, setSession } from '@/features/auth/authSlice';
import NotificationSocketBridge from '@/features/notifications/NotificationSocketBridge';
import { chatKeys, chatRoomListParams } from '@/features/chat/chatKeys';
import type { ChatMessage, ChatMessagesPage, ChatRoomsPage } from '@/features/chat/chatTypes';

const socketState = vi.hoisted(() => {
  const handlers = new Map<string, Array<(payload: unknown) => void>>();
  const socket = {
    on: vi.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    }),
    disconnect: vi.fn(),
  };

  return {
    socket,
    io: vi.fn(() => socket),
    emit(event: string, payload: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
    reset() {
      handlers.clear();
      socket.on.mockClear();
      socket.disconnect.mockClear();
      this.io.mockClear();
    },
  };
});

vi.mock('socket.io-client', () => ({
  io: socketState.io,
}));

const roomPage: ChatRoomsPage = {
  data: [
    {
      id: 'room-1',
      participants: ['user-1', 'doctor-1'],
      type: 'direct',
      lastMessageAt: null,
      lastMessage: null,
      unreadCount: 0,
      createdAt: '2026-05-27T08:00:00.000Z',
      updatedAt: '2026-05-27T08:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
};

const incomingMessage: ChatMessage = {
  id: 'message-1',
  roomId: 'room-1',
  senderId: 'doctor-1',
  content: 'Please review this result.',
  type: 'text',
  fileUrl: null,
  isRead: false,
  readAt: null,
  createdAt: '2026-05-27T08:30:00.000Z',
};

function renderBridge(queryClient: QueryClient) {
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NotificationSocketBridge />
      </QueryClientProvider>
    </Provider>
  );
}

describe('chat socket handling', () => {
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
  });

  it('updates cached messages and unread counts from chat events', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    queryClient.setQueryData(chatKeys.roomList(chatRoomListParams), roomPage);
    queryClient.setQueryData(chatKeys.unreadCount(), 0);
    queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages('room-1'), {
      pages: [{ data: [], meta: { page: 1, limit: 20, totalItems: 0, totalPages: 1 } }],
      pageParams: [1],
    });

    renderBridge(queryClient);

    await waitFor(() =>
      expect(socketState.io).toHaveBeenCalledWith('http://localhost:3005', {
        auth: { token: 'access-token' },
      })
    );

    act(() => {
      socketState.emit('chat:message', incomingMessage);
    });

    const messages = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages('room-1'));
    const rooms = queryClient.getQueryData<ChatRoomsPage>(chatKeys.roomList(chatRoomListParams));

    expect(messages?.pages[0].data[0]).toEqual(incomingMessage);
    expect(rooms?.data[0].lastMessage?.content).toBe('Please review this result.');
    expect(rooms?.data[0].unreadCount).toBe(1);
    expect(queryClient.getQueryData(chatKeys.unreadCount())).toBe(1);

    act(() => {
      socketState.emit('chat:read', {
        roomId: 'room-1',
        userId: 'user-1',
        readAt: '2026-05-27T08:31:00.000Z',
        readCount: 1,
      });
    });

    const readMessages = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages('room-1'));
    const readRooms = queryClient.getQueryData<ChatRoomsPage>(chatKeys.roomList(chatRoomListParams));

    expect(readMessages?.pages[0].data[0].isRead).toBe(true);
    expect(readRooms?.data[0].unreadCount).toBe(0);
    expect(queryClient.getQueryData(chatKeys.unreadCount())).toBe(0);
  });
});
