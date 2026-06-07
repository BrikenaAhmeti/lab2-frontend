import { useMemo, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import { buildContactStatusPayload, type ContactMessageStatus, type ContactMessageView } from '@/lib/api/contact-api';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Input from '@/ui/atoms/Input';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import DateModeFilter, {
  dateModeFilterToRange,
  emptyDateModeFilterValue,
  formatDateModeFilterSummary,
  isDateModeFilterActive,
  type DateModeFilterValue,
} from '@/ui/molecules/DateModeFilter';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import FilterSummaryBar, { type FilterSummaryChip } from '@/ui/molecules/FilterSummaryBar';
import SelectField from '@/ui/molecules/SelectField';
import ContactMessageCard from '../components/ContactMessageCard';
import { titleCase } from '../components/contactFormat';
import { getContactApiErrorMessage, useContactList, useUpdateContactStatus } from '../hooks/useContact';

function canReadContact(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['contact:read'], 'any');
}

function canManageContact(permissions: string[], roles: string[]) {
  return hasAnyRole(roles, ['Admin', 'Super Admin']) || hasAnyPermission(permissions, ['contact:manage:all'], 'any');
}

function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60 * 1000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export default function ContactInboxPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const [status, setStatus] = useState<ContactMessageStatus | ''>('new');
  const [search, setSearch] = useState('');
  const [receivedDateFilter, setReceivedDateFilter] =
    useState<DateModeFilterValue>(emptyDateModeFilterValue);
  const [replyNotes, setReplyNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const canRead = canReadContact(permissions, roles);
  const canManage = canManageContact(permissions, roles);
  const receivedDateRange = useMemo(() => dateModeFilterToRange(receivedDateFilter), [receivedDateFilter]);
  const receivedDateMax = useMemo(() => todayInputValue(), []);
  const params = useMemo(
    () => ({
      page: 1,
      limit: 25,
      status: status || undefined,
      search: search.trim() || undefined,
      createdAtFrom: receivedDateRange.from,
      createdAtTo: receivedDateRange.to,
    }),
    [receivedDateRange.from, receivedDateRange.to, search, status]
  );
  const contactQuery = useContactList(params, canRead);
  const updateMutation = useUpdateContactStatus();
  const rows = contactQuery.data?.items ?? [];
  const trimmedSearch = search.trim();
  const receivedDateActive = isDateModeFilterActive(receivedDateFilter);
  const hasActiveFilters = Boolean(status || trimmedSearch || receivedDateActive);
  const filterChips: FilterSummaryChip[] = [];

  if (!canRead) {
    return <Forbidden />;
  }

  const clearFilters = () => {
    setStatus('');
    setSearch('');
    setReceivedDateFilter(emptyDateModeFilterValue);
  };

  if (trimmedSearch) {
    filterChips.push({
      id: 'contact-search',
      label: `Search: ${trimmedSearch}`,
      onRemove: () => setSearch(''),
    });
  }

  if (status) {
    filterChips.push({
      id: 'status',
      label: `Status: ${titleCase(status)}`,
      onRemove: () => setStatus(''),
    });
  }

  if (receivedDateActive) {
    filterChips.push({
      id: 'received-date',
      label: `Received: ${formatDateModeFilterSummary(receivedDateFilter)}`,
      onRemove: () => setReceivedDateFilter(emptyDateModeFilterValue),
    });
  }

  const updateStatus = async (contactMessage: ContactMessageView, nextStatus: ContactMessageStatus) => {
    setMessage(null);
    const payload = buildContactStatusPayload({
      status: nextStatus,
      replyNotes: replyNotes[contactMessage.id],
    });

    if (!payload) {
      setMessage({ type: 'error', text: 'Write a reply before sending.' });
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: contactMessage.id, payload });
      setReplyNotes((current) => ({ ...current, [contactMessage.id]: '' }));
      setMessage({
        type: 'success',
        text: nextStatus === 'replied' ? `Reply sent to ${contactMessage.email}.` : 'Message marked read.',
      });
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
          <section className="space-y-4 rounded-xl border border-border bg-surface/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                  <p className="mt-0.5 text-xs text-muted">Sender details, received date, and status</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {contactQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  leftIcon={<RotateCcw className="h-4 w-4" />}
                  disabled={!hasActiveFilters}
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_160px_280px]">
              <Input
                id="contact-search-filter"
                label="Sender"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or phone..."
              />
              <SelectField
                id="contact-status-filter"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as ContactMessageStatus | '')}
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </SelectField>
              <DateModeFilter
                id="contact-received-date-filter"
                label="Received date"
                value={receivedDateFilter}
                maxDate={receivedDateMax}
                panelAlign="left"
                placeholder="Any received date"
                singleDateLabel="Received on"
                rangeStartLabel="Received from"
                rangeEndLabel="Received to"
                onChange={setReceivedDateFilter}
              />
            </div>

            <FilterSummaryBar chips={filterChips} />
          </section>

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
