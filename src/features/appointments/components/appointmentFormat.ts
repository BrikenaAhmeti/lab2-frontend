import type { AppointmentStatus, AppointmentView } from '@/lib/api/appointments-api';

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

export function getAppointmentStatusLabel(status: AppointmentStatus) {
  return statusLabels[status];
}

export function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatAppointmentTimeRange(appointment: AppointmentView) {
  const start = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(appointment.scheduledAt)
  );
  const end = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(appointment.endAt)
  );

  return `${start} - ${end}`;
}

export function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function isFinalAppointment(status: AppointmentStatus) {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW';
}

export function isPastAppointment(appointment: AppointmentView) {
  return new Date(appointment.scheduledAt).getTime() < Date.now() || isFinalAppointment(appointment.status);
}
