import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { ServiceRecord } from '@/lib/api/services-api';
import { emptyServiceFormValues, serviceFormSchema, type ServiceFormValues } from '@/features/services/services.schemas';
import { toServiceFormValues } from '@/features/services/hooks/useServiceCatalog';

interface ServiceCatalogFormModalProps {
  open: boolean;
  departments: DepartmentRecord[];
  service: ServiceRecord | null;
  defaultDepartmentId: string;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: ServiceFormValues) => void;
}

export default function ServiceCatalogFormModal({
  open,
  departments,
  service,
  defaultDepartmentId,
  loading,
  submitError,
  onClose,
  onSubmit,
}: ServiceCatalogFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyServiceFormValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (service) {
      reset(toServiceFormValues(service));
      return;
    }

    reset({
      ...emptyServiceFormValues,
      departmentId: defaultDepartmentId,
    });
  }, [defaultDepartmentId, open, reset, service]);

  if (!open) {
    return null;
  }

  const noDepartments = departments.length === 0;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground">{service ? 'Edit clinical service' : 'Add clinical service'}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <label htmlFor="service-department-id" className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">Department</span>
              <select
                id="service-department-id"
                disabled={noDepartments || loading}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('departmentId')}
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.departmentId ? <p className="text-xs text-danger">{errors.departmentId.message}</p> : null}
            </label>
            <Input
              id="service-name"
              label="Clinical service name"
              disabled={loading}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="service-duration"
              label="Duration"
              type="number"
              disabled={loading}
              error={errors.defaultDurationMinutes?.message}
              {...register('defaultDurationMinutes', { valueAsNumber: true })}
            />
            <Input
              id="service-price"
              label="Estimated fee"
              type="number"
              step="0.01"
              disabled={loading}
              error={errors.defaultPrice?.message}
              {...register('defaultPrice', { valueAsNumber: true })}
            />
            <Input
              id="service-sort-order"
              label="Sort Order"
              type="number"
              disabled={loading}
              error={errors.sortOrder?.message}
              {...register('sortOrder', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                disabled={loading}
                {...register('isActive')}
              />
              Active
            </label>
            <label htmlFor="service-description" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                id="service-description"
                disabled={loading}
                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('description')}
              />
              {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
            </label>
          </div>
          {noDepartments ? <p className="text-sm text-muted">No departments available. Add a department first.</p> : null}
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={noDepartments}>
              {service ? 'Save changes' : 'Create clinical service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
