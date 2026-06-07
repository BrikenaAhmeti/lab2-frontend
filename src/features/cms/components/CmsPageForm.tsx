import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import {
  cmsPageFormSchema,
  emptyCmsPageValues,
  type CmsPageFormValues,
} from '@/features/cms/cms.schemas';

interface CmsPageFormProps {
  values?: CmsPageFormValues;
  loading: boolean;
  submitLabel: string;
  submitError?: string;
  onSubmit: (values: CmsPageFormValues) => void;
  onCancel?: () => void;
}

export default function CmsPageForm({
  values,
  loading,
  submitLabel,
  submitError = '',
  onSubmit,
  onCancel,
}: CmsPageFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CmsPageFormValues>({
    resolver: zodResolver(cmsPageFormSchema),
    defaultValues: values ?? emptyCmsPageValues,
  });

  useEffect(() => {
    reset(values ?? emptyCmsPageValues);
  }, [reset, values]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input id="cms-page-title" label="Title" disabled={loading} error={errors.title?.message} {...register('title')} />
        <Input id="cms-page-slug" label="Slug" disabled={loading} error={errors.slug?.message} {...register('slug')} />
        <Input
          id="cms-page-meta-title"
          label="Meta Title"
          disabled={loading}
          error={errors.metaTitle?.message}
          {...register('metaTitle')}
        />
        <label htmlFor="cms-page-meta-description" className="block space-y-1.5 md:col-span-2">
          <span className="text-sm font-medium text-foreground">Meta Description</span>
          <textarea
            id="cms-page-meta-description"
            disabled={loading}
            className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            {...register('metaDescription')}
          />
          {errors.metaDescription ? <p className="text-xs text-danger">{errors.metaDescription.message}</p> : null}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" className="h-4 w-4 rounded border-border" disabled={loading} {...register('isPublished')} />
          Published
        </label>
      </div>

      {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
