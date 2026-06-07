import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save } from 'lucide-react';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Modal from '@/ui/molecules/Modal';
import SwitchField from '@/ui/molecules/SwitchField';
import TextareaField from '@/ui/molecules/TextareaField';
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
    control,
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

  const noDepartments = departments.length === 0;

  return (
    <Modal
      open={open}
      title={service ? 'Edit clinical service' : 'Add clinical service'}
      description="Keep service details, fees, scheduling defaults, and availability together."
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-catalog-form"
            loading={loading}
            disabled={noDepartments}
            leftIcon={service ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {service ? 'Save changes' : 'Create clinical service'}
          </Button>
        </div>
      }
    >
      <form id="service-catalog-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <section className="rounded-lg border border-border bg-surface/35 p-4">
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
              label="Sort order"
              type="number"
              disabled={loading}
              error={errors.sortOrder?.message}
              {...register('sortOrder', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => {
                const checked = field.value ?? true;

                return (
                  <SwitchField
                    id="service-active"
                    label={checked ? 'Service is active' : 'Service is inactive'}
                    checked={checked}
                    disabled={loading}
                    description={
                      checked
                        ? 'Visible in catalogs and available for scheduling.'
                        : 'Hidden from active selections until reactivated.'
                    }
                    onChange={field.onChange}
                    className="self-start md:mt-6"
                  />
                );
              }}
            />
            <div className="md:col-span-2">
              <TextareaField
                id="service-description"
                label="Description"
                disabled={loading}
                className="min-h-28"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
          </div>
        </section>

        {noDepartments ? <p className="text-sm text-muted">No departments available. Add a department first.</p> : null}
        {submitError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {submitError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
