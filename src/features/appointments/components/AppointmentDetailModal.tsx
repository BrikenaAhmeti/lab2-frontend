import Button from '@/ui/atoms/Button';
import type { AppointmentView } from '@/lib/api/appointments-api';
import AppointmentStatusBadge from './AppointmentStatusBadge';
import { formatAppointmentDate } from './appointmentFormat';

interface AppointmentDetailModalProps {
  appointment: AppointmentView | null;
  onClose: () => void;
}

export default function AppointmentDetailModal({ appointment, onClose }: AppointmentDetailModalProps) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <section className="panel w-full max-w-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appointment details</h2>
            <p className="mt-1 text-sm text-muted">{appointment.service.name}</p>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted">Patient</dt>
            <dd className="font-medium text-foreground">{appointment.patient.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Staff</dt>
            <dd className="font-medium text-foreground">{appointment.staff?.displayName ?? 'Staff member'}</dd>
          </div>
          <div>
            <dt className="text-muted">Department</dt>
            <dd className="font-medium text-foreground">{appointment.department.name}</dd>
          </div>
          <div>
            <dt className="text-muted">Date and time</dt>
            <dd className="font-medium text-foreground">{formatAppointmentDate(appointment.scheduledAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Duration</dt>
            <dd className="font-medium text-foreground">{`${appointment.durationMinutes} minutes`}</dd>
          </div>
          <div>
            <dt className="text-muted">Price</dt>
            <dd className="font-medium text-foreground">{`EUR ${Number(appointment.basePrice).toFixed(2)}`}</dd>
          </div>
        </dl>

        {appointment.notes ? (
          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3 text-sm">
            <p className="text-muted">Notes</p>
            <p className="mt-1 text-foreground">{appointment.notes}</p>
          </div>
        ) : null}

        {appointment.cancellationNote ? (
          <div className="mt-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
            {appointment.cancellationNote}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </section>
    </div>
  );
}
