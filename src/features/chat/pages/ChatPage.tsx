import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import Card from '@/ui/atoms/Card';
import { selectAuthUser } from '@/features/auth/authSelectors';
import ChatRoomList from '../components/ChatRoomList';
import MessageComposer from '../components/MessageComposer';
import MessageThread from '../components/MessageThread';
import { roomTitle } from '../chatFormat';
import {
  useChatMessages,
  useChatRooms,
  useMarkChatRoomRead,
  useSendChatAttachment,
  useSendChatMessage,
} from '../useChat';

function messagesBasePath(pathname: string) {
  const index = pathname.indexOf('/messages');
  return index >= 0 ? pathname.slice(0, index + '/messages'.length) : '/messages';
}

export default function ChatPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const user = useAppSelector(selectAuthUser);
  const roomsQuery = useChatRooms();
  const rooms = roomsQuery.data?.data ?? [];
  const activeRoomId = roomId ?? rooms[0]?.id;
  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const messagesQuery = useChatMessages(activeRoomId);
  const sendMessage = useSendChatMessage();
  const sendAttachment = useSendChatAttachment();
  const markRead = useMarkChatRoomRead();
  const basePath = messagesBasePath(location.pathname);

  const messages = useMemo(
    () => [...(messagesQuery.data?.pages ?? [])].reverse().flatMap((page) => page.data),
    [messagesQuery.data]
  );

  const hasUnreadVisibleMessages = messages.some(
    (message) => message.senderId !== user?.id && !message.isRead
  );

  useEffect(() => {
    if (!activeRoomId || !user?.id || markRead.isPending) return;
    if ((activeRoom?.unreadCount ?? 0) > 0 || hasUnreadVisibleMessages) {
      markRead.mutate(activeRoomId);
    }
  }, [activeRoom?.unreadCount, activeRoomId, hasUnreadVisibleMessages, markRead, user?.id]);

  const loading = sendMessage.isPending || sendAttachment.isPending;

  return (
    <Card title="Messages" subtitle="Internal chat with your care team and staff">
      <div className="grid min-h-[72vh] overflow-hidden rounded-lg border border-border bg-card lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="min-h-[18rem] border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
            <p className="text-xs text-muted">{rooms.length} rooms</p>
          </div>
          <div className="max-h-[66vh] overflow-y-auto">
            <ChatRoomList
              rooms={rooms}
              activeRoomId={activeRoomId}
              currentUserId={user?.id}
              basePath={basePath}
              isLoading={roomsQuery.isLoading}
              isError={roomsQuery.isError}
            />
          </div>
        </aside>

        <section className="flex min-h-[34rem] min-w-0 flex-col">
          {activeRoomId && activeRoom ? (
            <>
              <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {roomTitle(activeRoom, user?.id)}
                  </h2>
                  <p className="text-xs text-muted">Direct message</p>
                </div>
              </header>
              <MessageThread
                messages={messages}
                currentUserId={user?.id}
                isLoading={messagesQuery.isLoading}
                isError={messagesQuery.isError}
                hasMore={messagesQuery.hasNextPage}
                loadingMore={messagesQuery.isFetchingNextPage}
                onLoadMore={() => {
                  void messagesQuery.fetchNextPage();
                }}
              />
              <MessageComposer
                disabled={!activeRoomId}
                loading={loading}
                onSendText={(content) =>
                  sendMessage.mutateAsync({
                    roomId: activeRoomId,
                    content,
                    type: 'text',
                  })
                }
                onSendAttachment={(file, caption) =>
                  sendAttachment.mutateAsync({
                    roomId: activeRoomId,
                    file,
                    caption,
                  })
                }
              />
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-4 text-center text-sm text-muted">
              Select a conversation to start messaging.
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}
