import Button from '@/ui/atoms/Button';
import type { ServiceRecord } from '@/lib/api/services-api';

interface DeleteServiceDialogProps {
  service: ServiceRecord | null;
  errorMessage: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteServiceDialog({
  service,
  errorMessage,
  loading,
  onClose,
  onConfirm,
}: DeleteServiceDialogProps) {
  if (!service) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-md p-5">
        <h3 className="text-lg font-semibold text-foreground">Delete service?</h3>
        <p className="mt-2 text-sm text-muted">
          {`This will softly delete ${service.name}. You can keep historical references, but the service should no longer be used for new work.`}
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
