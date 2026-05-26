import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import { CMS_SECTION_TYPES, type CmsSection } from '@/lib/api/cms-api';
import {
  cmsSectionFormSchema,
  emptyCmsSectionValues,
  type CmsSectionFormValues,
} from '@/features/cms/cms.schemas';
import { toSectionFormValues } from '@/features/cms/hooks/useCms';

interface SectionEditorPanelProps {
  open: boolean;
  section: CmsSection | null;
  nextSortOrder: number;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: CmsSectionFormValues) => void;
}

export default function SectionEditorPanel({
  open,
  section,
  nextSortOrder,
  loading,
  submitError,
  onClose,
  onSubmit,
}: SectionEditorPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CmsSectionFormValues>({
    resolver: zodResolver(cmsSectionFormSchema),
    defaultValues: emptyCmsSectionValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (section) {
      reset(toSectionFormValues(section));
      return;
    }

    reset({
      ...emptyCmsSectionValues,
      sortOrder: nextSortOrder,
    });
  }, [nextSortOrder, open, reset, section]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-card p-5 shadow-panel">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{section ? 'Edit Section' : 'Add Section'}</h3>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label htmlFor="cms-section-type" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Type</span>
              <select
                id="cms-section-type"
                disabled={loading}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('type')}
              >
                {CMS_SECTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.type ? <p className="text-xs text-danger">{errors.type.message}</p> : null}
            </label>
            <Input
              id="cms-section-sort-order"
              label="Sort Order"
              type="number"
              disabled={loading}
              error={errors.sortOrder?.message}
              {...register('sortOrder', { valueAsNumber: true })}
            />
            <Input id="cms-section-title" label="Title" disabled={loading} error={errors.title?.message} {...register('title')} />
            <Input
              id="cms-section-subtitle"
              label="Subtitle"
              disabled={loading}
              error={errors.subtitle?.message}
              {...register('subtitle')}
            />
            <Input
              id="cms-section-image-url"
              label="Image URL"
              disabled={loading}
              error={errors.imageUrl?.message}
              {...register('imageUrl')}
            />
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border-border" disabled={loading} {...register('isVisible')} />
              Visible
            </label>
            <label htmlFor="cms-section-body" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Body</span>
              <textarea
                id="cms-section-body"
                disabled={loading}
                className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('body')}
              />
              {errors.body ? <p className="text-xs text-danger">{errors.body.message}</p> : null}
            </label>
            <label htmlFor="cms-section-content" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Content JSON</span>
              <textarea
                id="cms-section-content"
                disabled={loading}
                className="min-h-32 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder='{"items":[]}'
                {...register('contentJson')}
              />
              {errors.contentJson ? <p className="text-xs text-danger">{errors.contentJson.message}</p> : null}
            </label>
          </div>

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {section ? 'Save section' : 'Create section'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
