import Button from '@/ui/atoms/Button';
import type { StaffPositionTypeRecord } from '@/lib/api/staff-position-types-api';

interface DeleteStaffPositionTypeDialogProps {
  record: StaffPositionTypeRecord | null;
  errorMessage: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteStaffPositionTypeDialog({
  record,
  errorMessage,
  loading,
  onClose,
  onConfirm,
}: DeleteStaffPositionTypeDialogProps) {
  if (!record) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-md p-5">
        <h3 className="text-lg font-semibold text-foreground">Delete staff position type?</h3>
        <p className="mt-2 text-sm text-muted">
          {`This will softly delete ${record.name}. Existing historical references remain available, but admins will no longer be able to assign it to new staff profiles.`}
        </p>
        {errorMessage ? <p className="mt-3 text-sm text-danger">{errorMessage}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
