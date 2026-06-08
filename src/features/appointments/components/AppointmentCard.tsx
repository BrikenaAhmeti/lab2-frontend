import { memo, useMemo } from 'react';
import Button from '@/ui/atoms/Button';
import type { AppointmentView } from '@/lib/api/appointments-api';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { formatAppointmentDate, formatAppointmentTimeRange, isFinalAppointment } from './appointmentFormat';

interface AppointmentCardProps {
  appointment: AppointmentView;
  onCancel: (appointment: AppointmentView) => void;
  onDetail: (appointment: AppointmentView) => void;
  onReschedule: (appointment: AppointmentView) => void;
  showScheduleActions?: boolean;
}

function AppointmentCard({
  appointment,
  onCancel,
  onDetail,
  onReschedule,
  showScheduleActions = true,
}: AppointmentCardProps) {
  const canChange = useMemo(
    () =>
      showScheduleActions &&
      !isFinalAppointment(appointment.status) &&
      new Date(appointment.scheduledAt).getTime() > Date.now(),
    [appointment.scheduledAt, appointment.status, showScheduleActions]
  );

  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{appointment.service.name}</h3>
          <p className="mt-1 text-sm text-muted">{appointment.department.name}</p>
          <p className="mt-2 text-sm text-foreground">{formatAppointmentDate(appointment.scheduledAt)}</p>
          <p className="mt-1 text-xs text-muted">{formatAppointmentTimeRange(appointment)}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        <p>
          <span className="text-muted">Patient: </span>
          <span className="font-medium text-foreground">{appointment.patient.name}</span>
        </p>
        <p>
          <span className="text-muted">Staff: </span>
          <span className="font-medium text-foreground">{appointment.staff?.displayName ?? 'Staff member'}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => onDetail(appointment)}>
          Details
        </Button>
        {canChange ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!appointment.staffProfileId}
            onClick={() => onReschedule(appointment)}
          >
            Reschedule
          </Button>
        ) : null}
        {canChange ? (
          <Button type="button" size="sm" variant="danger" onClick={() => onCancel(appointment)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default memo(AppointmentCard);
