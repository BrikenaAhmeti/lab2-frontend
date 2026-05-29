import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import {
  emptyReportTemplateValues,
  reportTemplateSchema,
  type ReportTemplateFormValues,
} from '@/features/reports/reports.schemas';

interface ReportTemplateModalProps {
  open: boolean;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onSubmit: (values: ReportTemplateFormValues) => void;
}

export default function ReportTemplateModal({
  open,
  loading,
  errorMessage,
  onClose,
  onSubmit,
}: ReportTemplateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportTemplateFormValues>({
    resolver: zodResolver(reportTemplateSchema),
    defaultValues: emptyReportTemplateValues,
  });

  useEffect(() => {
    if (open) reset(emptyReportTemplateValues);
  }, [open, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-lg p-5">
        <h3 className="text-lg font-semibold text-foreground">Save Template</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input id="report-template-name" label="Template name" disabled={loading} error={errors.name?.message} {...register('name')} />
          <label htmlFor="report-template-description" className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Description</span>
            <textarea
              id="report-template-description"
              disabled={loading}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              {...register('description')}
            />
            {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
          </label>
          {errorMessage ? <p className="text-sm text-danger">{errorMessage}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save template
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
