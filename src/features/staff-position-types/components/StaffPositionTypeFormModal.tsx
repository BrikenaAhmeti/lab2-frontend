import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { Check, Plus, Save } from 'lucide-react';
import Input from '@/ui/atoms/Input';
import Button from '@/ui/atoms/Button';
import Modal from '@/ui/molecules/Modal';
import SelectField from '@/ui/molecules/SelectField';
import SwitchField from '@/ui/molecules/SwitchField';
import TextareaField from '@/ui/molecules/TextareaField';
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

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'lab_technician', label: 'Lab Technician' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'patient', label: 'Patient' },
];

function formatRoleKeyLabel(roleKey: string) {
  const configuredOption = roleOptions.find((option) => option.value === roleKey);

  if (configuredOption) {
    return configuredOption.label;
  }

  return roleKey
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<StaffPositionTypeFormValues>({
    resolver: zodResolver(staffPositionTypeFormSchema),
    defaultValues: emptyStaffPositionTypeFormValues,
  });

  const selectedRoleKey = watch('defaultRoleKey');

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

  const roleKeyOptions = useMemo(() => {
    if (!selectedRoleKey || roleOptions.some((option) => option.value === selectedRoleKey)) {
      return roleOptions;
    }

    return [...roleOptions, { value: selectedRoleKey, label: formatRoleKeyLabel(selectedRoleKey) }];
  }, [selectedRoleKey]);

  return (
    <Modal
      open={open}
      title={record ? 'Edit staff position type' : 'Add staff position type'}
      description="Connect position types to backend roles, departments, and active availability."
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="staff-position-type-form"
            loading={loading}
            leftIcon={record ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {record ? 'Save changes' : 'Create staff position type'}
          </Button>
        </div>
      }
    >
      <form id="staff-position-type-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <section className="rounded-lg border border-border bg-surface/35 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="staff-position-type-name"
              label="Name"
              disabled={loading}
              error={errors.name?.message}
              {...register('name')}
            />
            <Controller
              control={control}
              name="defaultRoleKey"
              render={({ field }) => (
                <SelectField
                  id="staff-position-type-default-role-key"
                  label="Default role"
                  value={field.value}
                  disabled={loading}
                  error={errors.defaultRoleKey?.message}
                  helperText={field.value ? `Backend key: ${field.value}` : 'Select the backend role for this position.'}
                  onBlur={field.onBlur}
                  onChange={field.onChange}
                >
                  <option value="">Select user role</option>
                  {roleKeyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
              )}
            />
            <Controller
              control={control}
              name="applicableDepartmentIds"
              render={({ field }) => {
                const selectedDepartmentIds = field.value ?? [];

                const toggleDepartment = (departmentId: string) => {
                  field.onChange(
                    selectedDepartmentIds.includes(departmentId)
                      ? selectedDepartmentIds.filter((selectedId) => selectedId !== departmentId)
                      : [...selectedDepartmentIds, departmentId]
                  );
                };

                return (
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">Applicable departments</span>
                      <span className="text-xs font-medium text-muted">
                        {selectedDepartmentIds.length === 0
                          ? 'All departments'
                          : `${selectedDepartmentIds.length} selected`}
                      </span>
                    </div>

                    <div className="rounded-xl border border-border bg-background p-3">
                      {departments.length === 0 ? (
                        <p className="text-sm text-muted">No active departments are available.</p>
                      ) : (
                        <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                          {departments.map((department) => {
                            const selected = selectedDepartmentIds.includes(department.id);

                            return (
                              <button
                                key={department.id}
                                type="button"
                                aria-pressed={selected}
                                disabled={loading}
                                onClick={() => toggleDepartment(department.id)}
                                className={clsx(
                                  'flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
                                  selected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-surface/35 text-foreground hover:border-primary/40'
                                )}
                              >
                                <span
                                  className={clsx(
                                    'grid h-5 w-5 shrink-0 place-items-center rounded border',
                                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'
                                  )}
                                  aria-hidden="true"
                                >
                                  {selected ? <Check className="h-3.5 w-3.5" /> : null}
                                </span>
                                <span className="min-w-0 truncate">{department.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {errors.applicableDepartmentIds ? (
                      <p className="text-xs text-danger">{errors.applicableDepartmentIds.message}</p>
                    ) : (
                      <p className="text-xs text-muted">Leave empty to make this available to all departments.</p>
                    )}
                  </div>
                );
              }}
            />
            <div className="md:col-span-2">
              <TextareaField
                id="staff-position-type-description"
                label="Description"
                disabled={loading}
                className="min-h-28"
                error={errors.description?.message}
                {...register('description')}
              />
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => {
                const checked = field.value ?? true;

                return (
                  <SwitchField
                    id="staff-position-type-active"
                    label={checked ? 'Position type is active' : 'Position type is inactive'}
                    checked={checked}
                    disabled={loading}
                    description={
                      checked
                        ? 'Available in staff assignment forms and active selections.'
                        : 'Hidden from active selections until reactivated.'
                    }
                    onChange={field.onChange}
                    className="md:col-span-2"
                  />
                );
              }}
            />
          </div>
        </section>

        {submitError ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {submitError}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
