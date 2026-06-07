import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAppSelector } from '@/app/hooks';
import { env } from '@/config/env';
import { selectAccessToken, selectAuthUser, selectIsAuthenticated } from '@/features/auth/authSelectors';
import type { ChatTypingPayload } from './chatTypes';

interface ServerToClientEvents {
  'chat:typing': (payload: ChatTypingPayload) => void;
}

interface ClientToServerEvents {
  'chat:join': (payload: { roomId: string }) => void;
  'chat:leave': (payload: { roomId: string }) => void;
  'chat:typing': (payload: { roomId: string; isTyping: boolean }) => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function userDisplayName(user?: { name?: string; email?: string } | null) {
  return user?.name || user?.email || 'Someone';
}

export function useChatSocket(roomId?: string) {
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectAuthUser);
  const socketRef = useRef<ChatSocket | null>(null);
  const typingTimersRef = useRef<Map<string, number>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  const clearTypingUser = useCallback((userId: string) => {
    const timer = typingTimersRef.current.get(userId);
    if (timer) {
      window.clearTimeout(timer);
      typingTimersRef.current.delete(userId);
    }

    setTypingUsers((current) => {
      if (!current[userId]) return current;
      const next = { ...current };
      delete next[userId];
      return next;
    });
  }, []);

  useEffect(() => {
    setTypingUsers({});

    if (!isAuthenticated || !accessToken || !roomId) return;

    const socket: ChatSocket = io(env.NOTIFICATION_SOCKET_URL, { auth: { token: accessToken } });
    const typingTimers = typingTimersRef.current;
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('chat:join', { roomId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat:typing', (payload) => {
      if (payload.roomId !== roomId || payload.userId === user?.id) return;

      const isTyping = payload.isTyping ?? payload.typing ?? false;
      if (!isTyping) {
        clearTypingUser(payload.userId);
        return;
      }

      const name = payload.userName || userDisplayName(null);
      setTypingUsers((current) => ({ ...current, [payload.userId]: name }));

      const currentTimer = typingTimersRef.current.get(payload.userId);
      if (currentTimer) window.clearTimeout(currentTimer);

      const nextTimer = window.setTimeout(() => {
        clearTypingUser(payload.userId);
      }, 3500);
      typingTimersRef.current.set(payload.userId, nextTimer);
    });

    return () => {
      socket.emit('chat:typing', { roomId, isTyping: false });
      socket.emit('chat:leave', { roomId });
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setIsConnected(false);
      typingTimers.forEach((timer) => window.clearTimeout(timer));
      typingTimers.clear();
    };
  }, [accessToken, clearTypingUser, isAuthenticated, roomId, user?.id]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current;
      if (!socket?.connected || !roomId) return;
      socket.emit('chat:typing', { roomId, isTyping });
    },
    [roomId]
  );

  return {
    isConnected,
    typingUsers,
    sendTyping,
  };
}
