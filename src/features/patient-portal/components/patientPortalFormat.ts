import type { PharmacyStatus, PrescriptionLifecycleStatus } from '@/lib/api/prescriptions-api';

export function formatPatientPortalDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function formatPatientPortalStatus(value?: string | null) {
  return value ? value.toLowerCase().replaceAll('_', ' ') : '-';
}

export function prescriptionTone(status: PrescriptionLifecycleStatus) {
  return status === 'VOIDED' ? 'danger' : 'success';
}

export function pharmacyTone(status?: PharmacyStatus | null) {
  if (status === 'DISPENSED') return 'success';
  if (status === 'ON_HOLD' || status === 'PARTIALLY_DISPENSED') return 'warning';
  if (status === 'CANCELLED') return 'danger';
  return 'info';
}

export function downloadPatientPdf(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}
