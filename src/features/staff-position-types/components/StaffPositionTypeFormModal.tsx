import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { StaffPositionTypeRecord } from '@/lib/api/staff-position-types-api';
import {
  emptyStaffPositionTypeFormValues,
  staffPositionTypeFormSchema,
  type StaffPositionTypeFormValues,
} from '@/features/staff-position-types/staffPositionTypes.schemas';
import { toStaffPositionTypeFormValues } from '@/features/staff-position-types/hooks/useStaffPositionTypes';

interface StaffPositionTypeFormModalProps {
  open: boolean;
  departments: DepartmentRecord[];
  record: StaffPositionTypeRecord | null;
  loading: boolean;
  submitError: string;
  onClose: () => void;
  onSubmit: (values: StaffPositionTypeFormValues) => void;
}

const suggestedRoleKeys = [
  'super_admin',
  'admin',
  'doctor',
  'nurse',
  'lab_technician',
  'pharmacist',
  'receptionist',
  'patient',
];

export default function StaffPositionTypeFormModal({
  open,
  departments,
  record,
  loading,
  submitError,
  onClose,
  onSubmit,
}: StaffPositionTypeFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffPositionTypeFormValues>({
    resolver: zodResolver(staffPositionTypeFormSchema),
    defaultValues: emptyStaffPositionTypeFormValues,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (record) {
      reset(toStaffPositionTypeFormValues(record));
      return;
    }

    reset(emptyStaffPositionTypeFormValues);
  }, [open, record, reset]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4">
      <div className="panel w-full max-w-2xl p-5">
        <h3 className="text-lg font-semibold text-foreground">{record ? 'Edit staff position type' : 'Add staff position type'}</h3>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="staff-position-type-name"
              label="Name"
              disabled={loading}
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="staff-position-type-default-role-key"
              label="Default Role Key"
              list="staff-position-type-role-key-suggestions"
              disabled={loading}
              error={errors.defaultRoleKey?.message}
              helperText={record?.defaultRoleName ? `Current backend label: ${record.defaultRoleName}` : 'Submit the backend role key'}
              {...register('defaultRoleKey')}
            />
            <datalist id="staff-position-type-role-key-suggestions">
              {suggestedRoleKeys.map((roleKey) => (
                <option key={roleKey} value={roleKey} />
              ))}
            </datalist>
            <label htmlFor="staff-position-type-departments" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Applicable Departments</span>
              <select
                id="staff-position-type-departments"
                multiple
                disabled={loading}
                className="min-h-36 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('applicableDepartmentIds')}
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.applicableDepartmentIds ? (
                <p className="text-xs text-danger">{errors.applicableDepartmentIds.message}</p>
              ) : (
                <p className="text-xs text-muted">Leave empty to make this available to all departments.</p>
              )}
            </label>
            <label htmlFor="staff-position-type-description" className="block space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Description</span>
              <textarea
                id="staff-position-type-description"
                disabled={loading}
                className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                {...register('description')}
              />
              {errors.description ? <p className="text-xs text-danger">{errors.description.message}</p> : null}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground md:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                disabled={loading}
                {...register('isActive')}
              />
              Active
            </label>
          </div>
          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {record ? 'Save changes' : 'Create staff position type'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
