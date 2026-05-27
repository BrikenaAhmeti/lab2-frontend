import { notificationApiClient } from '@/lib/api/axios';
import type {
  ChatAttachment,
  ChatMessage,
  ChatMessagesPage,
  ChatMeta,
  ChatRoomsPage,
  ChatRoom,
  CreateChatRoomPayload,
  SendChatMessagePayload,
} from './chatTypes';
import type { ChatListParams } from './chatKeys';

type ResponseEnvelope<T> = {
  data?: T;
  items?: T;
  meta?: Partial<ChatMeta>;
  total?: number;
  totalItems?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
};

function pageMeta(value: ResponseEnvelope<unknown>, fallbackLength: number): ChatMeta {
  const meta = value.meta ?? {};
  const page = meta.page ?? value.page ?? 1;
  const limit = meta.limit ?? value.limit ?? fallbackLength;
  const totalItems = meta.totalItems ?? value.totalItems ?? value.total ?? fallbackLength;
  const totalPages = meta.totalPages ?? value.totalPages ?? Math.max(1, Math.ceil(totalItems / Math.max(limit, 1)));

  return { page, limit, totalItems, totalPages };
}

function paginated<T>(value: unknown): { data: T[]; meta: ChatMeta } {
  const envelope = value as ResponseEnvelope<T[] | { data?: T[]; items?: T[]; meta?: Partial<ChatMeta> }>;
  const nested = envelope.data && !Array.isArray(envelope.data) ? envelope.data : null;
  const data =
    (Array.isArray(envelope.data) && envelope.data) ||
    (Array.isArray(envelope.items) && envelope.items) ||
    (nested && Array.isArray(nested.data) && nested.data) ||
    (nested && Array.isArray(nested.items) && nested.items) ||
    [];
  const metaSource = nested?.meta ? { ...envelope, meta: nested.meta } : envelope;

  return {
    data,
    meta: pageMeta(metaSource, data.length),
  };
}

function item<T>(value: unknown): T {
  const envelope = value as ResponseEnvelope<T>;
  return (envelope.data ?? value) as T;
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
}

export const chatApi = {
  listRooms(params: ChatListParams = {}) {
    return notificationApiClient
      .get<unknown>('/api/chat/rooms', { params })
      .then((response): ChatRoomsPage => paginated<ChatRoom>(response.data));
  },
  createRoom(payload: CreateChatRoomPayload) {
    return notificationApiClient
      .post<unknown>('/api/chat/rooms', payload)
      .then((response): ChatRoom => item<ChatRoom>(response.data));
  },
  listMessages(roomId: string, params: ChatListParams = {}) {
    return notificationApiClient
      .get<unknown>(`/api/chat/rooms/${roomId}/messages`, { params })
      .then((response): ChatMessagesPage => paginated<ChatMessage>(response.data));
  },
  sendMessage(payload: SendChatMessagePayload) {
    return notificationApiClient
      .post<unknown>(`/api/chat/rooms/${payload.roomId}/messages`, {
        content: payload.content,
        type: payload.type ?? 'text',
        fileUrl: payload.fileUrl ?? null,
      })
      .then((response): ChatMessage => item<ChatMessage>(response.data));
  },
  markRead(roomId: string) {
    return notificationApiClient
      .patch<unknown>(`/api/chat/rooms/${roomId}/read`)
      .then((response) => item<{ roomId: string; readCount: number; readAt: string }>(response.data));
  },
  async uploadAttachment(roomId: string, file: File) {
    const buffer = await file.arrayBuffer();

    return notificationApiClient
      .post<unknown>(`/api/chat/rooms/${roomId}/upload`, {
        fileName: file.name,
        mimeType: file.type || undefined,
        contentBase64: toBase64(buffer),
      })
      .then((response): ChatAttachment => item<ChatAttachment>(response.data));
  },
};
