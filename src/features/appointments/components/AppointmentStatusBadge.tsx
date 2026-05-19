import Badge from '@/ui/atoms/Badge';
import type { AppointmentStatus } from '@/lib/api/appointments-api';
import { getAppointmentStatusLabel } from './appointmentFormat';

const statusTone: Record<AppointmentStatus, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  SCHEDULED: 'info',
  CONFIRMED: 'success',
  CHECKED_IN: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
};

export default function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={statusTone[status]}>{getAppointmentStatusLabel(status)}</Badge>;
}
