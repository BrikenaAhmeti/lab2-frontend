import type { ContactMessageStatus, ContactMessageView } from '@/lib/api/contact-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import { contactStatusVariant, formatContactDate, titleCase } from './contactFormat';

interface ContactMessageCardProps {
  message: ContactMessageView;
  canManage: boolean;
  loading: boolean;
  replyNote: string;
  onReplyNoteChange: (value: string) => void;
  onStatusChange: (message: ContactMessageView, status: ContactMessageStatus) => void;
}

export default function ContactMessageCard({
  message,
  canManage,
  loading,
  replyNote,
  onReplyNoteChange,
  onStatusChange,
}: ContactMessageCardProps) {
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{message.subject}</h2>
          <p className="mt-1 text-sm text-muted">
            {`${message.name} · ${message.email}${message.phone ? ` · ${message.phone}` : ''}`}
          </p>
        </div>
        <Badge variant={contactStatusVariant(message.status)}>{titleCase(message.status)}</Badge>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
      <p className="mt-3 text-xs text-muted">{formatContactDate(message.createdAt)}</p>

      {message.replyNotes ? (
        <p className="mt-3 rounded-xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted">
          {message.replyNotes}
        </p>
      ) : null}

      {canManage && message.status !== 'replied' ? (
        <div className="mt-4 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Reply notes</span>
            <textarea
              value={replyNote}
              onChange={(event) => onReplyNoteChange(event.target.value)}
              className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {message.status === 'new' ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={loading}
                onClick={() => onStatusChange(message, 'read')}
              >
                Mark Read
              </Button>
            ) : null}
            <Button type="button" size="sm" loading={loading} onClick={() => onStatusChange(message, 'replied')}>
              Mark Replied
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
