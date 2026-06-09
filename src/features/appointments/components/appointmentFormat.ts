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

export function isWeekendDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();

  return weekday === 0 || weekday === 6;
}

export function getBookableDateInputValues(count: number, startOffsetDays = 1) {
  const dates: string[] = [];
  const date = new Date();
  date.setDate(date.getDate() + startOffsetDays);

  while (dates.length < count) {
    const value = formatDateInputValue(date);

    if (!isWeekendDateInput(value)) {
      dates.push(value);
    }

    date.setDate(date.getDate() + 1);
  }

  return dates;
}

export function getNextBookableDateInputValue(startOffsetDays = 1) {
  return getBookableDateInputValues(1, startOffsetDays)[0];
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
