import type { BloodType } from '@/lib/api/patients-api';

export interface StructuredValueEntry {
  label: string;
  value: string;
}

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
  const entries = getStructuredValueEntries(value);

  if (entries.length > 0) {
    return entries.map((entry) => `${entry.label}: ${entry.value}`).join('; ');
  }

  const normalized = normalizeStructuredValue(value);

  if (typeof normalized === 'string') return normalized || '-';
  if (Array.isArray(normalized)) return formatUnknownValue(normalized);

  return '-';
}

export function formatEnum(value?: string | null) {
  if (!value) return '-';

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getStructuredValueEntries(value: unknown): StructuredValueEntry[] {
  const normalized = normalizeStructuredValue(value);

  if (!isPlainRecord(normalized)) {
    return [];
  }

  return Object.entries(normalized)
    .map(([key, entryValue]) => ({
      label: humanizeKey(key),
      value: formatUnknownValue(entryValue),
    }))
    .filter((entry) => entry.value !== '-');
}

export function formatUnknownValue(value: unknown): string {
  const normalized = normalizeStructuredValue(value);

  if (normalized === null || normalized === undefined || normalized === '') {
    return '-';
  }

  if (typeof normalized === 'string') {
    return normalized.trim() || '-';
  }

  if (typeof normalized === 'number') {
    return Number.isFinite(normalized) ? String(normalized) : '-';
  }

  if (typeof normalized === 'boolean') {
    return normalized ? 'Yes' : 'No';
  }

  if (Array.isArray(normalized)) {
    const items = normalized.map(formatUnknownValue).filter((item) => item !== '-');
    return items.length > 0 ? items.join(', ') : 'None recorded';
  }

  if (isPlainRecord(normalized)) {
    const entries = Object.entries(normalized)
      .map(([key, entryValue]) => `${humanizeKey(key)}: ${formatUnknownValue(entryValue)}`)
      .filter((item) => !item.endsWith(': -'));

    return entries.length > 0 ? entries.join('; ') : 'None recorded';
  }

  return '-';
}

export function normalizeStructuredValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
