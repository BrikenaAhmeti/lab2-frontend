import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import { CMS_SECTION_TYPES, type CmsSection } from '@/lib/api/cms-api';
import { usePublicDepartments } from '@/features/public/hooks/usePublicCatalog';
import { getPublicStaffDisplayName, isDoctorProfile } from '@/features/public/utils/publicStaffPresentation';
import { usePublicStaffList } from '@/features/staff/hooks/useStaff';
import {
  cmsSectionFormSchema,
  emptyCmsSectionValues,
  type CmsSectionFormValues,
} from '@/features/cms/cms.schemas';
import { toSectionFormValues } from '@/features/cms/hooks/useCms';

type ContentMap = Record<string, unknown>;
type DynamicSource = 'manual' | 'doctor-cards' | 'department-cards';

interface SectionEditorPanelProps {
  open: boolean;
  section: CmsSection | null;
  nextSortOrder: number;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: CmsSectionFormValues) => void;
}

function isContentMap(value: unknown): value is ContentMap {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseContentJson(value?: string) {
  if (!value?.trim()) return {};

  try {
    const parsed = JSON.parse(value);
    return isContentMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function contentSource(content: ContentMap): DynamicSource {
  const display = text(content.display);

  if (display === 'doctor-cards' || display === 'doctor-directory') return 'doctor-cards';
  if (display === 'department-cards') return 'department-cards';
  return 'manual';
}

function stringifyContent(content: ContentMap) {
  return Object.keys(content).length > 0 ? JSON.stringify(content, null, 2) : '';
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CmsSectionFormValues>({
    resolver: zodResolver(cmsSectionFormSchema),
    defaultValues: emptyCmsSectionValues,
  });
  const contentJson = watch('contentJson') ?? '';
  const content = useMemo(() => parseContentJson(contentJson), [contentJson]);
  const dynamicSource = contentSource(content);
  const staffQuery = usePublicStaffList({ page: 1, limit: 100 });
  const departmentsQuery = usePublicDepartments();
  const doctors = (staffQuery.data?.items ?? []).filter(isDoctorProfile);
  const departments = departmentsQuery.data?.items ?? [];
  const selectedDoctorIds = useMemo(
    () => Array.from(new Set([...stringArray(content.doctorIds), ...stringArray(content.staffIds)])),
    [content],
  );
  const selectedDepartmentIds = useMemo(() => stringArray(content.departmentIds), [content]);

  const updateContent = (nextContent: ContentMap) => {
    setValue('contentJson', stringifyContent(nextContent), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSourceChange = (source: DynamicSource) => {
    if (source === 'manual') {
      const { display: _display, doctorIds: _doctorIds, staffIds: _staffIds, departmentIds: _departmentIds, ...rest } = content;
      updateContent(rest);
      return;
    }

    setValue('type', 'TEXT', { shouldDirty: true, shouldValidate: true });
    updateContent({
      ...content,
      display: source,
    });
  };

  const toggleDoctor = (doctorId: string) => {
    const nextIds = selectedDoctorIds.includes(doctorId)
      ? selectedDoctorIds.filter((id) => id !== doctorId)
      : [...selectedDoctorIds, doctorId];
    const { staffIds: _staffIds, ...rest } = content;
    const nextContent: ContentMap = {
      ...rest,
      display: 'doctor-cards',
    };

    if (nextIds.length > 0) nextContent.doctorIds = nextIds;
    else delete nextContent.doctorIds;

    updateContent(nextContent);
  };

  const toggleDepartment = (departmentId: string) => {
    const nextIds = selectedDepartmentIds.includes(departmentId)
      ? selectedDepartmentIds.filter((id) => id !== departmentId)
      : [...selectedDepartmentIds, departmentId];
    const nextContent: ContentMap = {
      ...content,
      display: dynamicSource === 'manual' ? 'department-cards' : dynamicSource,
    };

    if (nextIds.length > 0) nextContent.departmentIds = nextIds;
    else delete nextContent.departmentIds;

    updateContent(nextContent);
  };

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
            <label htmlFor="cms-section-dynamic-source" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Dynamic source</span>
              <select
                id="cms-section-dynamic-source"
                value={dynamicSource}
                disabled={loading}
                onChange={(event) => handleSourceChange(event.target.value as DynamicSource)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="manual">Manual content</option>
                <option value="doctor-cards">Doctor cards</option>
                <option value="department-cards">Department cards</option>
              </select>
            </label>
            {dynamicSource === 'doctor-cards' ? (
              <fieldset className="rounded-xl border border-border bg-background p-4 md:col-span-2">
                <legend className="px-1 text-sm font-semibold text-foreground">Doctors</legend>
                {staffQuery.isLoading ? <p className="mt-2 text-sm text-muted">Loading doctors...</p> : null}
                {staffQuery.isError ? <p className="mt-2 text-sm text-danger">Doctors are not available right now.</p> : null}
                {!staffQuery.isLoading && !staffQuery.isError && doctors.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No public doctors found.</p>
                ) : null}
                {doctors.length > 0 ? (
                  <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {doctors.map((doctor) => (
                      <label
                        key={doctor.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDoctorIds.includes(doctor.id)}
                          disabled={loading}
                          onChange={() => toggleDoctor(doctor.id)}
                          className="mt-1 h-4 w-4 rounded border-border"
                        />
                        <span>
                          <span className="block font-medium">{getPublicStaffDisplayName(doctor)}</span>
                          <span className="block text-xs text-muted">{doctor.specialization ?? doctor.positionType?.name ?? 'Doctor'}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </fieldset>
            ) : null}
            {dynamicSource === 'department-cards' ? (
              <fieldset className="rounded-xl border border-border bg-background p-4 md:col-span-2">
                <legend className="px-1 text-sm font-semibold text-foreground">Departments</legend>
                {departmentsQuery.isLoading ? <p className="mt-2 text-sm text-muted">Loading departments...</p> : null}
                {departmentsQuery.isError ? <p className="mt-2 text-sm text-danger">Departments are not available right now.</p> : null}
                {!departmentsQuery.isLoading && !departmentsQuery.isError && departments.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">No public departments found.</p>
                ) : null}
                {departments.length > 0 ? (
                  <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDepartmentIds.includes(department.id)}
                          disabled={loading}
                          onChange={() => toggleDepartment(department.id)}
                          className="mt-1 h-4 w-4 rounded border-border"
                        />
                        <span>
                          <span className="block font-medium">{department.name}</span>
                          <span className="block text-xs text-muted">
                            {[department.floor ? `Floor ${department.floor}` : null, department.phoneExtension ? `Ext. ${department.phoneExtension}` : null]
                              .filter(Boolean)
                              .join(' · ') || 'Department'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </fieldset>
            ) : null}
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
