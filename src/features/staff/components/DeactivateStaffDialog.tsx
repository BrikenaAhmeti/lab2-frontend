import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { getStaffName } from '@/features/staff/hooks/useStaff';
import type { StaffRecord } from '@/lib/api/staff-api';

interface DeactivateStaffDialogProps {
  staff: StaffRecord | null;
  error?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateStaffDialog({
  staff,
  error,
  loading,
  onClose,
  onConfirm,
}: DeactivateStaffDialogProps) {
  if (!staff) return null;

  const count = staff.futureAppointmentsCount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-foreground">Deactivate staff member?</h3>
        <p className="mt-2 text-sm text-muted">
          {getStaffName(staff)} has {count} future appointments. Deactivating may block scheduling for this staff member.
        </p>
        {error ? <FeedbackMessage type="error" message={error} className="mt-4" /> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>Deactivate</Button>
        </div>
      </section>
    </div>
  );
}
