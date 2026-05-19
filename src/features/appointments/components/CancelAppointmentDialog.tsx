import Button from '@/ui/atoms/Button';
import type { AppointmentView } from '@/lib/api/appointments-api';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface CancelAppointmentDialogProps {
  appointment: AppointmentView | null;
  reason: string;
  loading: boolean;
  error?: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelAppointmentDialog({
  appointment,
  reason,
  loading,
  error,
  onReasonChange,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/40 p-4">
      <section className="panel w-full max-w-lg p-5">
        <h2 className="text-lg font-semibold text-foreground">Cancel appointment?</h2>
        <p className="mt-2 text-sm text-muted">
          {`${appointment.service.name} for ${appointment.patient.name}`}
        </p>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Reason</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {error ? <FeedbackMessage type="error" message={error} className="mt-3" /> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Keep appointment
          </Button>
          <Button type="button" variant="danger" disabled={!reason.trim()} loading={loading} onClick={onConfirm}>
            Cancel appointment
          </Button>
        </div>
      </section>
    </div>
  );
}
