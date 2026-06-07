import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import CalendarDateTimePicker from '@/ui/molecules/CalendarDateTimePicker';
import type { CmsBanner } from '@/lib/api/cms-api';
import {
  cmsBannerFormSchema,
  emptyCmsBannerValues,
  type CmsBannerFormValues,
} from '@/features/cms/cms.schemas';
import { toBannerFormValues } from '@/features/cms/hooks/useCms';

interface BannerFormModalProps {
  open: boolean;
  banner: CmsBanner | null;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: CmsBannerFormValues) => void;
}

export default function BannerFormModal({
  open,
  banner,
  loading,
  submitError,
  onClose,
  onSubmit,
}: BannerFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CmsBannerFormValues>({
    resolver: zodResolver(cmsBannerFormSchema),
    defaultValues: emptyCmsBannerValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(banner ? toBannerFormValues(banner) : emptyCmsBannerValues);
  }, [banner, open, reset]);

  if (!open) {
    return null;
  }

  const startDate = watch('startDate') ?? '';
  const endDate = watch('endDate') ?? '';

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground">{banner ? 'Edit Banner' : 'Add Banner'}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input id="cms-banner-title" label="Title" disabled={loading} error={errors.title?.message} {...register('title')} />
            <Input
              id="cms-banner-sort-order"
              label="Sort Order"
              type="number"
              disabled={loading}
              error={errors.sortOrder?.message}
              {...register('sortOrder', { valueAsNumber: true })}
            />
            <Input
              id="cms-banner-image-url"
              label="Image URL"
              disabled={loading}
              error={errors.imageUrl?.message}
              {...register('imageUrl')}
            />
            <Input
              id="cms-banner-link-url"
              label="Link URL"
              disabled={loading}
              error={errors.linkUrl?.message}
              {...register('linkUrl')}
            />
            <CalendarDateTimePicker
              id="cms-banner-start-date"
              label="Start Date"
              value={startDate}
              disabled={loading}
              error={errors.startDate?.message}
              onChange={(value) => setValue('startDate', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            />
            <CalendarDateTimePicker
              id="cms-banner-end-date"
              label="End Date"
              value={endDate}
              defaultTime="23:59"
              disabled={loading}
              error={errors.endDate?.message}
              onChange={(value) => setValue('endDate', value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-border" disabled={loading} {...register('isActive')} />
              Active
            </label>
            <label htmlFor="cms-banner-message" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Message</span>
              <textarea
                id="cms-banner-message"
                disabled={loading}
                className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('message')}
              />
              {errors.message ? <p className="text-xs text-danger">{errors.message.message}</p> : null}
            </label>
          </div>

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {banner ? 'Save changes' : 'Create banner'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
