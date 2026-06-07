import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { chatKeys } from './chatKeys';
import type { ChatMessage, ChatMessagesPage, ChatReadPayload, ChatRoomsPage } from './chatTypes';

function messagePreview(message: ChatMessage) {
  return {
    id: message.id,
    senderId: message.senderId,
    content: message.content,
    type: message.type,
    fileUrl: message.fileUrl,
    createdAt: message.createdAt,
  };
}

function sortedRooms(page: ChatRoomsPage): ChatRoomsPage {
  return {
    ...page,
    data: [...page.data].sort((left, right) => {
      const rightDate = new Date(right.lastMessageAt ?? right.createdAt).getTime();
      const leftDate = new Date(left.lastMessageAt ?? left.createdAt).getTime();
      return rightDate - leftDate;
    }),
  };
}

function unreadDelta(message: ChatMessage, currentUserId?: string) {
  return currentUserId && message.senderId !== currentUserId ? 1 : 0;
}

export function addChatMessageToCache(
  queryClient: QueryClient,
  message: ChatMessage,
  currentUserId?: string
) {
  const cachedMessages = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(message.roomId));
  const alreadyCached =
    cachedMessages?.pages.some((page) => page.data.some((item) => item.id === message.id)) ?? false;
  const nextUnreadDelta = alreadyCached ? 0 : unreadDelta(message, currentUserId);

  queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(message.roomId), (cached) => {
    if (!cached) return cached;
    if (cached.pages.some((page) => page.data.some((item) => item.id === message.id))) return cached;

    const pages = cached.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            data: [...page.data, message],
            meta: {
              ...page.meta,
              totalItems: page.meta.totalItems + 1,
            },
          }
        : page
    );

    return { ...cached, pages };
  });

  queryClient.setQueriesData<ChatRoomsPage>({ queryKey: chatKeys.rooms() }, (cached) => {
    if (!cached) return cached;
    const next = cached.data.map((room) =>
      room.id === message.roomId
        ? {
            ...room,
            lastMessage: messagePreview(message),
            lastMessageAt: message.createdAt,
            unreadCount: room.unreadCount + nextUnreadDelta,
          }
        : room
    );

    return sortedRooms({ ...cached, data: next });
  });

  if (nextUnreadDelta) {
    queryClient.setQueryData<number>(chatKeys.unreadCount(), (count) => (count ?? 0) + 1);
  }
}

export function markRoomReadInChatCache(
  queryClient: QueryClient,
  payload: ChatReadPayload,
  currentUserId?: string
) {
  queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(chatKeys.messages(payload.roomId), (cached) => {
    if (!cached) return cached;

    return {
      ...cached,
      pages: cached.pages.map((page) => ({
        ...page,
        data: page.data.map((message) =>
          message.senderId !== payload.userId
            ? {
                ...message,
                isRead: true,
                readAt: message.readAt ?? payload.readAt,
              }
            : message
        ),
      })),
    };
  });

  if (payload.userId === currentUserId) {
    queryClient.setQueriesData<ChatRoomsPage>({ queryKey: chatKeys.rooms() }, (cached) => {
      if (!cached) return cached;
      return {
        ...cached,
        data: cached.data.map((room) =>
          room.id === payload.roomId ? { ...room, unreadCount: 0 } : room
        ),
      };
    });

    queryClient.setQueryData<number>(chatKeys.unreadCount(), (count) =>
      Math.max(0, (count ?? 0) - payload.readCount)
    );
  }
}
