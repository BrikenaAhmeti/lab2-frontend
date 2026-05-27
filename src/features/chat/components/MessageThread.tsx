import { useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import { Check, CheckCheck, Download } from 'lucide-react';
import Button from '@/ui/atoms/Button';
import { chatFileUrl, timeLabel } from '../chatFormat';
import type { ChatMessage } from '../chatTypes';

interface MessageThreadProps {
  messages: ChatMessage[];
  currentUserId?: string;
  isLoading?: boolean;
  isError?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
}

function messageLabel(message: ChatMessage) {
  if (message.type === 'image') return message.content || 'Image attachment';
  if (message.type === 'file') return message.content || 'File attachment';
  return message.content;
}

export default function MessageThread({
  messages,
  currentUserId,
  isLoading = false,
  isError = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useMemo(() => messages.at(-1)?.id, [messages]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [lastMessageId]);

  if (isLoading) {
    return <div className="grid flex-1 place-items-center text-sm text-muted">Loading messages...</div>;
  }

  if (isError) {
    return <div className="grid flex-1 place-items-center text-sm text-danger">Messages could not be loaded.</div>;
  }

  if (messages.length === 0) {
    return <div className="grid flex-1 place-items-center text-sm text-muted">Start the conversation.</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {hasMore && (
        <div className="text-center">
          <Button type="button" variant="secondary" size="sm" loading={loadingMore} onClick={onLoadMore}>
            Load older
          </Button>
        </div>
      )}

      {messages.map((message) => {
        const mine = message.senderId === currentUserId;
        const fileUrl = message.fileUrl ? chatFileUrl(message.fileUrl) : '';
        const Receipt = message.isRead ? CheckCheck : Check;

        return (
          <article
            key={message.id}
            className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
          >
            <div
              className={clsx(
                'max-w-[82%] rounded-2xl px-4 py-3 shadow-soft md:max-w-[68%]',
                mine ? 'bg-primary text-primary-foreground' : 'bg-surface text-foreground'
              )}
            >
              {message.type === 'image' && fileUrl && (
                <a href={fileUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-lg">
                  <img src={fileUrl} alt={messageLabel(message)} className="max-h-64 w-full object-cover" />
                </a>
              )}

              {message.type === 'file' && fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={clsx(
                    'mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
                    mine ? 'border-white/25 bg-white/10' : 'border-border bg-card'
                  )}
                >
                  <Download className="h-4 w-4" />
                  <span className="truncate">{messageLabel(message)}</span>
                </a>
              )}

              <p className="whitespace-pre-wrap text-sm leading-6">{messageLabel(message)}</p>
              <p
                className={clsx(
                  'mt-2 flex items-center justify-end gap-1 text-[11px]',
                  mine ? 'text-primary-foreground/75' : 'text-muted'
                )}
              >
                <time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>
                {mine && <Receipt className="h-3.5 w-3.5" />}
              </p>
            </div>
          </article>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
