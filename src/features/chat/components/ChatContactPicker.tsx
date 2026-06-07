import clsx from 'clsx';
import { MessageCirclePlus, Search, UserRound } from 'lucide-react';
import Badge from '@/ui/atoms/Badge';
import { chatRoleLabel } from '../chatContacts';
import type { ChatContact, ChatParticipantRole } from '../chatTypes';

interface ChatContactPickerProps {
  contacts: ChatContact[];
  search: string;
  onSearchChange: (value: string) => void;
  onStartConversation: (contact: ChatContact) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  startingContactId?: string | null;
}

function initials(value: string) {
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first ?? ''}${second ?? ''}`.toUpperCase();
}

function roleVariant(role: ChatParticipantRole) {
  if (role === 'doctor') return 'info';
  if (role === 'nurse') return 'success';
  if (role === 'receptionist') return 'warning';
  if (role === 'patient') return 'neutral';
  return 'neutral';
}

export default function ChatContactPicker({
  contacts,
  search,
  onSearchChange,
  onStartConversation,
  isLoading = false,
  isError = false,
  error = null,
  startingContactId = null,
}: ChatContactPickerProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Start chat</h2>
            <p className="text-xs text-muted">Staff and patients</p>
          </div>
          <Badge variant="info" className="px-2 py-0.5">
            {contacts.length}
          </Badge>
        </div>

        <label className="relative block" htmlFor="chat-contact-search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="chat-contact-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search people"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {error ? <p className="px-4 pb-3 text-xs font-medium text-danger">{error}</p> : null}

      <div className="max-h-72 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Loading people...
          </div>
        ) : null}

        {isError ? <p className="px-4 py-5 text-sm text-danger">People could not be loaded.</p> : null}

        {!isLoading && !isError && contacts.length === 0 ? (
          <div className="px-4 py-5 text-sm text-muted">
            <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-surface text-primary">
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </div>
            No matching people.
          </div>
        ) : null}

        {!isLoading && !isError && contacts.length > 0 ? (
          <ul className="divide-y divide-border">
            {contacts.map((contact) => {
              const starting = startingContactId === contact.id;

              return (
                <li key={`${contact.role}-${contact.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring disabled:cursor-wait disabled:opacity-70"
                    onClick={() => onStartConversation(contact)}
                    disabled={starting}
                  >
                    <span
                      className={clsx(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-semibold',
                        contact.role === 'patient'
                          ? 'bg-accent/15 text-accent-foreground ring-1 ring-accent/25'
                          : 'bg-primary/10 text-primary ring-1 ring-primary/15'
                      )}
                    >
                      {initials(contact.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{contact.name}</span>
                        <Badge variant={roleVariant(contact.role)} className="shrink-0 px-2 py-0.5">
                          {contact.roleLabel || chatRoleLabel(contact.role)}
                        </Badge>
                      </span>
                      {contact.subtitle ? (
                        <span className="mt-1 block truncate text-xs text-muted">{contact.subtitle}</span>
                      ) : null}
                    </span>
                    <span
                      className={clsx(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary transition',
                        starting && 'animate-pulse'
                      )}
                      aria-hidden="true"
                    >
                      <MessageCirclePlus className="h-4 w-4" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
