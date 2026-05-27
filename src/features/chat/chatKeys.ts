export interface ChatListParams {
  page?: number;
  limit?: number;
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
  unreadCount: () => [...chatKeys.all, 'unreadCount'] as const,
};
