export function formatClinicalValue(value: unknown) {
  if (typeof value === 'string') return value || '-';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '-';
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '-';
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatShortDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatClinicalStatus(value?: string | null) {
  return value ? value.toLowerCase().replaceAll('_', ' ') : '-';
}
