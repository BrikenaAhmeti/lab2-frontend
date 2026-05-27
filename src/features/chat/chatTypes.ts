export const chatParticipantRoles = [
  'patient',
  'doctor',
  'staff',
  'nurse',
  'lab_technician',
  'pharmacist',
  'receptionist',
  'admin',
  'department_head',
  'super_admin',
] as const;

export type ChatParticipantRole = (typeof chatParticipantRoles)[number];
export type ChatMessageType = 'text' | 'file' | 'image';

export type ChatParticipant =
  | string
  | {
      id?: string;
      userId?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
      roles?: string[];
    };

export interface ChatMessagePreview {
  id: string;
  senderId: string;
  content: string;
  type: ChatMessageType;
  fileUrl: string | null;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  participants: ChatParticipant[];
  type: 'direct';
  lastMessageAt: string | null;
  lastMessage: ChatMessagePreview | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: ChatMessageType;
  fileUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ChatMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ChatRoomsPage {
  data: ChatRoom[];
  meta: ChatMeta;
}

export interface ChatMessagesPage {
  data: ChatMessage[];
  meta: ChatMeta;
}

export interface ChatAttachment {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  size: number;
}

export interface CreateChatRoomPayload {
  participantId: string;
  participantRole: ChatParticipantRole;
}

export interface SendChatMessagePayload {
  roomId: string;
  content: string;
  type?: ChatMessageType;
  fileUrl?: string | null;
}

export interface ChatReadPayload {
  roomId: string;
  userId: string;
  readAt: string;
  readCount: number;
}
