import type {
  PharmacyDispensingItemView,
  PharmacyDispensingStatusInput,
  PharmacyQueueView,
  PharmacyStatus,
} from '@/lib/api/pharmacy-api';

type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export const pharmacyStatusLabels: Record<PharmacyStatus, string> = {
  PENDING: 'Pending',
  ON_HOLD: 'On Hold',
  IN_PROGRESS: 'In Progress',
  PARTIALLY_DISPENSED: 'Partial',
  DISPENSED: 'Dispensed',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  OUT_OF_STOCK: 'Out of Stock',
  SUBSTITUTED: 'Substituted',
};

export const pharmacyStatusTone: Record<PharmacyStatus, BadgeTone> = {
  PENDING: 'warning',
  ON_HOLD: 'warning',
  IN_PROGRESS: 'info',
  PARTIALLY_DISPENSED: 'warning',
  DISPENSED: 'success',
  FULFILLED: 'success',
  CANCELLED: 'danger',
  OUT_OF_STOCK: 'danger',
  SUBSTITUTED: 'info',
};

export const dispensingStatusOptions: Array<{ value: PharmacyDispensingStatusInput; label: string }> = [
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'substituted', label: 'Substituted' },
];

const handledStatuses: PharmacyStatus[] = ['DISPENSED', 'OUT_OF_STOCK', 'SUBSTITUTED'];

export function formatPharmacyDateTime(value: string | null) {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function canStartQueue(queue: PharmacyQueueView) {
  return queue.status === 'PENDING' || queue.status === 'ON_HOLD';
}

export function canEditDispensing(queue: PharmacyQueueView) {
  return !queue.prescription.isVoided && queue.status !== 'FULFILLED' && queue.status !== 'CANCELLED';
}

export function isHandledDispensingStatus(status: PharmacyStatus) {
  return handledStatuses.includes(status);
}

export function canFulfillQueue(queue: PharmacyQueueView) {
  return (
    canEditDispensing(queue) &&
    queue.dispensingItems.length > 0 &&
    queue.dispensingItems.every((item) => isHandledDispensingStatus(item.status))
  );
}

export function toDispensingStatusInput(status: PharmacyStatus): PharmacyDispensingStatusInput {
  if (status === 'OUT_OF_STOCK') return 'out_of_stock';
  if (status === 'SUBSTITUTED') return 'substituted';
  return 'dispensed';
}

export function formatMedicationSummary(items: PharmacyDispensingItemView[]) {
  if (items.length === 0) return 'No medications';

  const names = items.map((item) => item.prescriptionItem.medicationName);
  const visible = names.slice(0, 3).join(', ');

  return names.length > 3 ? `${visible}, +${names.length - 3} more` : visible;
}

export function normalizeAllergies(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeAllergyValue(item))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      return normalizeAllergies(JSON.parse(trimmed));
    } catch {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  const item = normalizeAllergyValue(value);
  return item ? [item] : [];
}

function normalizeAllergyValue(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object') return String(value);

  const record = value as Record<string, unknown>;
  const direct = record.name ?? record.label ?? record.value ?? record.allergy ?? record.medication;

  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  return Object.entries(record)
    .filter(([, entryValue]) => typeof entryValue === 'string' || typeof entryValue === 'number')
    .map(([key, entryValue]) => `${key}: ${entryValue}`)
    .join(', ');
}
