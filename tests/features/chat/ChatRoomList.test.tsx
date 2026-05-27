import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChatRoomList from '@/features/chat/components/ChatRoomList';
import type { ChatRoom } from '@/features/chat/chatTypes';

const room: ChatRoom = {
  id: 'room-1',
  participants: [
    'user-1',
    { id: 'doctor-1', name: 'Dr Mira Kelmendi', email: 'mira@medsphere.test' },
  ],
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
  unreadCount: 2,
  createdAt: '2026-05-27T08:00:00.000Z',
  updatedAt: '2026-05-27T08:30:00.000Z',
};

describe('ChatRoomList', () => {
  it('renders rooms with participant, preview, and unread count', () => {
    render(
      <MemoryRouter>
        <ChatRoomList
          rooms={[room]}
          activeRoomId="room-1"
          currentUserId="user-1"
          basePath="/patient/messages"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Dr Mira Kelmendi')).toBeInTheDocument();
    expect(screen.getByText('Your lab result is ready.')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dr Mira Kelmendi/i })).toHaveAttribute(
      'href',
      '/patient/messages/room-1'
    );
  });

  it('renders the empty state', () => {
    render(
      <MemoryRouter>
        <ChatRoomList rooms={[]} currentUserId="user-1" basePath="/patient/messages" />
      </MemoryRouter>
    );

    expect(screen.getByText('No conversations yet.')).toBeInTheDocument();
  });
});
