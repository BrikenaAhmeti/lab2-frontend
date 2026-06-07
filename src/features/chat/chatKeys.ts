export interface ChatListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const chatRoomListParams = {
  page: 1,
  limit: 50,
} as const;

export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  roomList: (params: ChatListParams = chatRoomListParams) => [...chatKeys.rooms(), params] as const,
  messages: (roomId: string) => [...chatKeys.all, 'messages', roomId] as const,
  contacts: (search = '') => [...chatKeys.all, 'contacts', search] as const,
  unreadCount: () => [...chatKeys.all, 'unreadCount'] as const,
};
