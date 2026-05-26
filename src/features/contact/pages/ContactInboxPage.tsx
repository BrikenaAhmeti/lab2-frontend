import { useMemo, useState } from 'react';
import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import { buildContactStatusPayload, type ContactMessageStatus, type ContactMessageView } from '@/lib/api/contact-api';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import ContactMessageCard from '../components/ContactMessageCard';
import { getContactApiErrorMessage, useContactList, useUpdateContactStatus } from '../hooks/useContact';

function canReadContact(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['contact:read'], 'any');
}

function canManageContact(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['contact:manage:all'], 'any');
}

export default function ContactInboxPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [status, setStatus] = useState<ContactMessageStatus | ''>('new');
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canRead = canReadContact(permissions, roles);
  const canManage = canManageContact(permissions, roles);
  const params = useMemo(
    () => ({
      page: 1,
      limit: 25,
      status: status || undefined,
    }),
    [status]
  );
  const contactQuery = useContactList(params, canRead);
  const updateMutation = useUpdateContactStatus();
  const rows = contactQuery.data?.items ?? [];

  if (!canRead) {
    return <Forbidden />;
  }

  const updateStatus = async (contactMessage: ContactMessageView, nextStatus: ContactMessageStatus) => {
    setMessage(null);
    const payload = buildContactStatusPayload({
      status: nextStatus,
      replyNotes: replyNotes[contactMessage.id],
    });

    if (!payload) {
      setMessage({ type: 'error', text: 'Reply notes are required before marking replied.' });
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: contactMessage.id, payload });
      setReplyNotes((current) => ({ ...current, [contactMessage.id]: '' }));
      setMessage({ type: 'success', text: `Message marked ${nextStatus}.` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: getContactApiErrorMessage(error, 'Contact message status could not be updated.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Contact Inbox' }]} />

      <Card title="Contact Inbox" subtitle="Review public contact form submissions">
        <div className="space-y-4">
          <label className="block max-w-xs space-y-1.5">
            <span className="text-sm font-medium text-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ContactMessageStatus | '')}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
          </label>

          {message ? <FeedbackMessage type={message.type} message={message.text} /> : null}

          {contactQuery.isLoading ? (
            <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading contact messages...</div>
          ) : null}

          {contactQuery.isError ? (
            <FeedbackMessage
              type="error"
              message={getContactApiErrorMessage(contactQuery.error, 'Contact messages could not be loaded.')}
            />
          ) : null}

          {!contactQuery.isLoading && !contactQuery.isError && rows.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
              No contact messages found.
            </p>
          ) : null}

          {!contactQuery.isLoading && !contactQuery.isError && rows.length > 0 ? (
            <section className="grid gap-3">
              {rows.map((contactMessage) => (
                <ContactMessageCard
                  key={contactMessage.id}
                  message={contactMessage}
                  canManage={canManage}
                  loading={updateMutation.isPending}
                  replyNote={replyNotes[contactMessage.id] ?? ''}
                  onReplyNoteChange={(value) =>
                    setReplyNotes((current) => ({ ...current, [contactMessage.id]: value }))
                  }
                  onStatusChange={updateStatus}
                />
              ))}
            </section>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
