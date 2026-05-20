import type { AppointmentType, AppointmentView } from '@/lib/api/appointments-api';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import {
  canCheckInAppointment,
  canMarkNoShowAppointment,
  formatAppointmentDate,
  formatAppointmentTimeRange,
  isFinalAppointment,
} from './appointmentFormat';

const typeLabels: Record<AppointmentType, string> = {
  IN_PERSON: 'In person',
  VIRTUAL: 'Virtual',
  WALK_IN: 'Walk-in',
  FOLLOW_UP: 'Follow-up',
};

interface ReceptionistScheduleTableProps {
  appointments: AppointmentView[];
  actionLoading?: boolean;
  onCheckIn: (appointment: AppointmentView) => void;
  onNoShow: (appointment: AppointmentView) => void;
  onCancel: (appointment: AppointmentView) => void;
  onReschedule: (appointment: AppointmentView) => void;
  onDetail: (appointment: AppointmentView) => void;
}

function canReschedule(appointment: AppointmentView) {
  return (
    Boolean(appointment.staffProfileId) &&
    !isFinalAppointment(appointment.status) &&
    new Date(appointment.scheduledAt).getTime() > Date.now()
  );
}

export default function ReceptionistScheduleTable({
  appointments,
  actionLoading,
  onCheckIn,
  onNoShow,
  onCancel,
  onReschedule,
  onDetail,
}: ReceptionistScheduleTableProps) {
  if (appointments.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
        No appointments match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-surface/70 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Time</th>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Visit</th>
            <th className="px-4 py-3 font-semibold">Tags</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td className="whitespace-nowrap px-4 py-4 align-top">
                <p className="font-medium text-foreground">{formatAppointmentTimeRange(appointment)}</p>
                <p className="mt-1 text-xs text-muted">{formatAppointmentDate(appointment.scheduledAt)}</p>
              </td>
              <td className="px-4 py-4 align-top">
                <p className="font-medium text-foreground">{appointment.patient.name}</p>
                <p className="mt-1 text-xs text-muted">{appointment.patient.phone ?? appointment.patient.email ?? 'No contact'}</p>
              </td>
              <td className="px-4 py-4 align-top">
                <p className="font-medium text-foreground">{appointment.service.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {`${appointment.department.name} - ${appointment.staff?.displayName ?? 'Staff member'}`}
                </p>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-wrap gap-2">
                  <AppointmentStatusBadge status={appointment.status} />
                  <Badge variant={appointment.appointmentType === 'WALK_IN' ? 'warning' : 'neutral'}>
                    {typeLabels[appointment.appointmentType]}
                  </Badge>
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onDetail(appointment)}>
                    Details
                  </Button>
                  {canCheckInAppointment(appointment.status) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => onCheckIn(appointment)}
                    >
                      Check in
                    </Button>
                  ) : null}
                  {canMarkNoShowAppointment(appointment) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={actionLoading}
                      onClick={() => onNoShow(appointment)}
                    >
                      No show
                    </Button>
                  ) : null}
                  {canReschedule(appointment) ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => onReschedule(appointment)}>
                      Reschedule
                    </Button>
                  ) : null}
                  {!isFinalAppointment(appointment.status) ? (
                    <Button type="button" size="sm" variant="danger" onClick={() => onCancel(appointment)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
