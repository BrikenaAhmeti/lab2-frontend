import CmsPageForm from '@/features/cms/components/CmsPageForm';
import type { CmsPageFormValues } from '@/features/cms/cms.schemas';

interface CmsPageFormModalProps {
  open: boolean;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: CmsPageFormValues) => void;
}

export default function CmsPageFormModal({ open, loading, submitError, onClose, onSubmit }: CmsPageFormModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Add CMS Page</h3>
        <CmsPageForm loading={loading} submitLabel="Create page" submitError={submitError} onCancel={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
}
