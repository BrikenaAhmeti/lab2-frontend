import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { selectAuthUser } from '@/features/auth/authSelectors';
import { chatApi } from './chatApi';
import { addChatMessageToCache, markRoomReadInChatCache } from './chatCache';
import { loadChatContacts } from './chatContacts';
import { chatKeys, chatRoomListParams, type ChatListParams } from './chatKeys';
import type { ChatMessageType, ChatRoomsPage, CreateChatRoomPayload, SendChatMessagePayload } from './chatTypes';

const messagePageSize = 20;

export function useChatRooms(params: ChatListParams = chatRoomListParams) {
  return useQuery({
    queryKey: chatKeys.roomList(params),
    queryFn: () => chatApi.listRooms(params),
  });
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: chatKeys.unreadCount(),
    queryFn: async () => {
      const rooms = await chatApi.listRooms({ page: 1, limit: 100 });
      return rooms.data.reduce((sum, room) => sum + room.unreadCount, 0);
    },
  });
}

export function useChatMessages(roomId?: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId ?? ''),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      chatApi.listMessages(roomId ?? '', { page: pageParam, limit: messagePageSize }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    enabled: Boolean(roomId),
  });
}

export function useChatContacts(search = '') {
  const currentUser = useAppSelector(selectAuthUser);

  return useQuery({
    queryKey: chatKeys.contacts(search),
    queryFn: () => loadChatContacts({ search, currentUser }),
    enabled: Boolean(currentUser?.id),
    staleTime: 30_000,
  });
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateChatRoomPayload) => chatApi.createRoom(payload),
    onSuccess: async (room) => {
      queryClient.setQueriesData<ChatRoomsPage>({ queryKey: chatKeys.rooms() }, (cached) => {
        if (!cached) return cached;
        const exists = cached.data.some((item) => item.id === room.id);
        return {
          ...cached,
          data: exists
            ? cached.data.map((item) => (item.id === room.id ? room : item))
            : [room, ...cached.data],
          meta: {
            ...cached.meta,
            totalItems: exists ? cached.meta.totalItems : cached.meta.totalItems + 1,
          },
        };
      });
      await queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector(selectAuthUser);

  return useMutation({
    mutationFn: (payload: SendChatMessagePayload) => chatApi.sendMessage(payload),
    onSuccess: async (message) => {
      addChatMessageToCache(queryClient, message, currentUser?.id);
      await queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), refetchType: 'inactive' });
      await queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount(), refetchType: 'inactive' });
    },
  });
}

export function useSendChatAttachment() {
  const sendMessage = useSendChatMessage();

  return useMutation({
    mutationFn: async ({
      roomId,
      file,
      caption,
    }: {
      roomId: string;
      file: File;
      caption?: string;
    }) => {
      const attachment = await chatApi.uploadAttachment(roomId, file);
      const type: ChatMessageType = (attachment.mimeType ?? file.type).startsWith('image/') ? 'image' : 'file';

      return sendMessage.mutateAsync({
        roomId,
        content: caption?.trim() || attachment.fileName || file.name,
        type,
        fileUrl: attachment.fileUrl,
      });
    },
  });
}

export function useMarkChatRoomRead() {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector(selectAuthUser);

  return useMutation({
    mutationFn: (roomId: string) => chatApi.markRead(roomId),
    onSuccess: async (result, roomId) => {
      if (currentUser?.id) {
        markRoomReadInChatCache(
          queryClient,
          {
            roomId,
            userId: currentUser.id,
            readAt: result.readAt,
            readCount: result.readCount,
          },
          currentUser.id
        );
      }

      await queryClient.invalidateQueries({ queryKey: chatKeys.rooms(), refetchType: 'inactive' });
      await queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount(), refetchType: 'inactive' });
    },
  });
}
