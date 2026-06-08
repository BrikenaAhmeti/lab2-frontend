import { formatUnknownValue } from '@/features/patients/components/patientFormat';

export function formatClinicalValue(value: unknown) {
  const formatted = formatUnknownValue(value);

  return formatted === 'None recorded' ? '-' : formatted;
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
