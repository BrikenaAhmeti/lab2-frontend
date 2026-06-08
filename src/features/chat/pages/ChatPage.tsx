import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageSquare, MessagesSquare } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectAuthUser } from '@/features/auth/authSelectors';
import ChatContactPicker from '../components/ChatContactPicker';
import ChatRoomList from '../components/ChatRoomList';
import MessageComposer from '../components/MessageComposer';
import MessageThread from '../components/MessageThread';
import { participantId, roomTitle } from '../chatFormat';
import type { ChatContact } from '../chatTypes';
import {
  useChatContacts,
  useChatMessages,
  useChatRooms,
  useCreateChatRoom,
  useMarkChatRoomRead,
  useSendChatAttachment,
  useSendChatMessage,
} from '../useChat';
import { useChatSocket } from '../useChatSocket';

function messagesBasePath(pathname: string) {
  const index = pathname.indexOf('/messages');
  return index >= 0 ? pathname.slice(0, index + '/messages'.length) : '/messages';
}

export default function ChatPage() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const [contactSearch, setContactSearch] = useState('');
  const deferredContactSearch = useDeferredValue(contactSearch);
  const [startingContactId, setStartingContactId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [knownContacts, setKnownContacts] = useState<Record<string, ChatContact>>({});
  const roomsQuery = useChatRooms();
  const rooms = roomsQuery.data?.data ?? [];
  const activeRoomId = roomId ?? rooms[0]?.id;
  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const contactsQuery = useChatContacts(deferredContactSearch);
  const messagesQuery = useChatMessages(activeRoomId);
  const createRoom = useCreateChatRoom();
  const sendMessage = useSendChatMessage();
  const sendAttachment = useSendChatAttachment();
  const markRead = useMarkChatRoomRead();
  const { isConnected, typingUsers, sendTyping } = useChatSocket(activeRoomId);
  const basePath = messagesBasePath(location.pathname);

  const rememberContacts = useCallback((contacts: ChatContact[]) => {
    if (contacts.length === 0) return;

    setKnownContacts((current) => {
      let changed = false;
      const next = { ...current };

      for (const contact of contacts) {
        if (next[contact.id]?.name !== contact.name || next[contact.id]?.roleLabel !== contact.roleLabel) {
          next[contact.id] = contact;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, []);

  useEffect(() => {
    rememberContacts(contactsQuery.data ?? []);
  }, [contactsQuery.data, rememberContacts]);

  const participantLookup = useMemo(
    () => new Map(Object.values(knownContacts).map((contact) => [contact.id, contact])),
    [knownContacts]
  );

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
  const typingNames = Object.values(typingUsers);
  const typingLabel =
    typingNames.length === 1
      ? `${typingNames[0]} is typing...`
      : typingNames.length > 1
        ? `${typingNames.length} people are typing...`
        : '';

  const startConversation = async (contact: ChatContact) => {
    setStartError(null);
    setStartingContactId(contact.id);
    rememberContacts([contact]);

    try {
      const existingRoom = rooms.find((room) =>
        room.participants.some((participant) => participantId(participant) === contact.id)
      );
      const room =
        existingRoom ??
        (await createRoom.mutateAsync({
          participantId: contact.id,
          participantRole: contact.role,
        }));

      navigate(`${basePath}/${room.id}`);
    } catch {
      setStartError('Conversation could not be started.');
    } finally {
      setStartingContactId(null);
    }
  };

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-panel">
      <header className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <MessagesSquare className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
            <p className="truncate text-sm text-muted">Internal chat with your care team and staff</p>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted">
          <span className="h-2 w-2 rounded-full bg-success" />
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-none">
        <aside className="min-h-0 max-h-64 border-b border-border bg-surface/45 lg:max-h-none lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
              <p className="text-xs text-muted">Recent rooms</p>
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto lg:max-h-none">
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

        <section className="flex min-h-0 min-w-0 flex-col bg-background/70">
          {activeRoomId && activeRoom ? (
            <>
              <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-soft">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-foreground">
                    {roomTitle(activeRoom, user?.id)}
                  </h2>
                  <p className="text-xs text-muted">Direct message</p>
                </div>
                <span className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted sm:inline-flex">
                  <span className={isConnected ? 'h-2 w-2 rounded-full bg-success' : 'h-2 w-2 rounded-full bg-warning'} />
                  {isConnected ? 'Realtime' : 'Connecting'}
                </span>
              </header>
              <MessageThread
                messages={messages}
                currentUserId={user?.id}
                isLoading={messagesQuery.isLoading}
                isError={messagesQuery.isError}
                hasMore={messagesQuery.hasNextPage}
                loadingMore={messagesQuery.isFetchingNextPage}
                typingLabel={typingLabel}
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
                onTypingChange={sendTyping}
              />
            </>
          ) : (
            <div className="grid flex-1 place-items-center px-4 py-12 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-medium text-foreground">Select a conversation</p>
                <p className="mt-1 text-sm text-muted">Your messages will appear here.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
