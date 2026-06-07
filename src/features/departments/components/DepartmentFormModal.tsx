import { Plus, Save } from 'lucide-react';
import { type FormEvent } from 'react';
import Button from '@/ui/atoms/Button';
import Input from '@/ui/atoms/Input';
import Modal from '@/ui/molecules/Modal';
import SwitchField from '@/ui/molecules/SwitchField';
import TextareaField from '@/ui/molecules/TextareaField';
import WorkingHoursEditor from '@/ui/molecules/WorkingHoursEditor';
import type { DepartmentRecord } from '@/lib/api/departments-api';
import type { DepartmentForm } from '@/features/departments/departmentsForm';

interface DepartmentFormModalProps {
  open: boolean;
  department: DepartmentRecord | null;
  form: DepartmentForm;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
  onChange: (form: DepartmentForm) => void;
  onSubmit: () => void;
}

export default function DepartmentFormModal({
  open,
  department,
  form,
  loading,
  errorMessage,
  onClose,
  onChange,
  onSubmit,
}: DepartmentFormModalProps) {
  const updateForm = <Key extends keyof DepartmentForm>(key: Key, value: DepartmentForm[Key]) => {
    onChange({ ...form, [key]: value });
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Modal
      open={open}
      title={department ? 'Edit department' : 'Add department'}
      description="Keep public catalog details, staff routing, and service organization aligned in one place."
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="department-form"
            loading={loading}
            leftIcon={department ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {department ? 'Save changes' : 'Create department'}
          </Button>
        </div>
      }
    >
      <form id="department-form" className="space-y-5" onSubmit={submitForm}>
        <section className="rounded-lg border border-border bg-surface/35 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="department-name"
              label="Name"
              value={form.name}
              disabled={loading}
              onChange={(event) => updateForm('name', event.target.value)}
            />
            <Input
              id="department-floor"
              label="Floor"
              value={form.floor}
              disabled={loading}
              onChange={(event) => updateForm('floor', event.target.value)}
            />
            <Input
              id="department-phone-extension"
              label="Phone extension"
              value={form.phoneExtension}
              disabled={loading}
              onChange={(event) => updateForm('phoneExtension', event.target.value)}
            />
            <Input
              id="department-sort-order"
              label="Sort order"
              type="number"
              min={0}
              value={form.sortOrder}
              disabled={loading}
              onChange={(event) => updateForm('sortOrder', event.target.value === '' ? 0 : Number(event.target.value))}
            />
            <TextareaField
              id="department-description"
              label="Description"
              value={form.description}
              disabled={loading}
              className="min-h-28"
              onChange={(event) => updateForm('description', event.target.value)}
              helperText="This appears in department cards and details."
            />
            <SwitchField
              id="department-active"
              label="Department is active"
              checked={form.isActive}
              disabled={loading}
              description={
                form.isActive
                  ? 'Visible in catalogs and available for linking services.'
                  : 'Hidden from active lists until it is reactivated.'
              }
              onChange={(checked) => updateForm('isActive', checked)}
              className="self-start md:mt-6"
            />
          </div>
        </section>

        <WorkingHoursEditor
          idPrefix="department-hours"
          rows={form.operatingHoursRows}
          disabled={loading}
          onChange={(rows) => updateForm('operatingHoursRows', rows)}
        />

        {errorMessage ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
            {errorMessage}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
