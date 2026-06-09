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
  return formatDateInputValue(new Date());
}

export function getDateInputValueFromToday(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateInputValue(date);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function isFinalAppointment(status: AppointmentStatus) {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW';
}

export function isPastAppointment(appointment: AppointmentView) {
  return new Date(appointment.scheduledAt).getTime() < Date.now() || isFinalAppointment(appointment.status);
}

export function canCheckInAppointment(status: AppointmentStatus) {
  return status === 'SCHEDULED' || status === 'CONFIRMED';
}

export function canMarkNoShowAppointment(appointment: AppointmentView, graceMinutes = 15) {
  const canTransition = appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED';
  const readyAt = new Date(appointment.scheduledAt).getTime() + graceMinutes * 60 * 1000;

  return canTransition && Date.now() >= readyAt;
}
