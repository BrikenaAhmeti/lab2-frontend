import { PowerOff } from 'lucide-react';
import Button from '@/ui/atoms/Button';
import Modal from '@/ui/molecules/Modal';
import type { DepartmentRecord } from '@/lib/api/departments-api';

interface DeactivateDepartmentDialogProps {
  department: DepartmentRecord | null;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeactivateDepartmentDialog({
  department,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}: DeactivateDepartmentDialogProps) {
  if (!department) {
    return null;
  }

  return (
    <Modal
      open={Boolean(department)}
      title="Deactivate department?"
      description={`This will mark ${department.name} as inactive. You can activate it again later.`}
      maxWidth="sm"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={loading}
            leftIcon={<PowerOff className="h-4 w-4" />}
            onClick={onConfirm}
          >
            Deactivate
          </Button>
        </div>
      }
    >
      {errorMessage ? (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </div>
      ) : (
        <p className="text-sm text-muted">Inactive departments stay in admin history but stop appearing as active options.</p>
      )}
    </Modal>
  );
}
