import type { PharmacyStatus, PrescriptionLifecycleStatus } from '@/lib/api/prescriptions-api';
import type { MedicalRecordView } from '@/lib/api/medical-records-api';

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

function filenamePart(value?: string | null, fallback = 'document') {
  const normalized = value
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

function dateFilePart(value?: string | null) {
  return value?.slice(0, 10) || 'undated';
}

export function getMedicalRecordPdfFileName(record: MedicalRecordView) {
  const patientName = record.patient.name || `${record.patient.firstName} ${record.patient.lastName}`;
  const patient = filenamePart(patientName, 'patient');
  const recordTopic = filenamePart(record.diagnosis || record.chiefComplaint, 'consultation-record');
  const date = dateFilePart(record.appointment?.scheduledAt ?? record.createdAt);

  return `medical-record-${patient}-${recordTopic}-${date}.pdf`;
}
