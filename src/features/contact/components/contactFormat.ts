import type { ContactMessageStatus } from '@/lib/api/contact-api';

export function formatContactDate(value: string | null | undefined) {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function contactStatusVariant(status: ContactMessageStatus) {
  if (status === 'replied') return 'success';
  if (status === 'read') return 'info';
  return 'warning';
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
