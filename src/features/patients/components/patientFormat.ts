import type { BloodType } from '@/lib/api/patients-api';

export const bloodTypeOptions: { value: BloodType; label: string }[] = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export function formatBloodType(value?: BloodType | null) {
  return bloodTypeOptions.find((option) => option.value === value)?.label ?? '-';
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatJsonText(value: unknown) {
  if (typeof value === 'string') return value || '-';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '-';
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '-';
}

export function formatEnum(value?: string | null) {
  return value ? value.toLowerCase().replaceAll('_', ' ') : '-';
}
