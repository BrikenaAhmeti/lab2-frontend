import { Link } from 'react-router-dom';
import clsx from 'clsx';
import Badge from '@/ui/atoms/Badge';
import { previewText, roomTitle, timeLabel } from '../chatFormat';
import type { ChatRoom } from '../chatTypes';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  activeRoomId?: string;
  currentUserId?: string;
  basePath: string;
  isLoading?: boolean;
  isError?: boolean;
}

function initials(value: string) {
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'M';
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first ?? ''}${second ?? ''}`.toUpperCase();
}

export default function ChatRoomList({
  rooms,
  activeRoomId,
  currentUserId,
  basePath,
  isLoading = false,
  isError = false,
}: ChatRoomListProps) {
  if (isLoading) {
    return <p className="px-4 py-6 text-sm text-muted">Loading conversations...</p>;
  }

  if (isError) {
    return <p className="px-4 py-6 text-sm text-danger">Conversations could not be loaded.</p>;
  }

  if (rooms.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {rooms.map((room) => {
        const active = room.id === activeRoomId;
        const title = roomTitle(room, currentUserId);

        return (
          <li key={room.id}>
            <Link
              to={`${basePath}/${room.id}`}
              className={clsx(
                'flex gap-3 px-4 py-3 transition hover:bg-card focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring',
                active && 'bg-primary/10'
              )}
            >
              <span
                className={clsx(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-semibold',
                  active ? 'bg-primary text-primary-foreground shadow-soft' : 'bg-card text-primary ring-1 ring-border'
                )}
              >
                {initials(title)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {title}
                  </span>
                  <time className="shrink-0 text-xs text-muted" dateTime={room.lastMessageAt ?? room.createdAt}>
                    {timeLabel(room.lastMessageAt ?? room.createdAt)}
                  </time>
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="truncate text-xs text-muted">
                    {previewText(room.lastMessage, currentUserId)}
                  </span>
                  {room.unreadCount > 0 && (
                    <Badge variant="danger" className="ml-auto shrink-0 px-2 py-0.5">
                      {room.unreadCount}
                    </Badge>
                  )}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
