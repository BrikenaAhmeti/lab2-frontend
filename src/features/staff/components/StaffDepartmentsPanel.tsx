import { useState } from 'react';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import {
  getApiErrorMessage,
  getStaffDepartmentId,
  getStaffDepartmentName,
  useAssignStaffDepartment,
  useRemoveStaffDepartment,
  useStaffDepartments,
} from '@/features/staff/hooks/useStaff';
import type { StaffRecord } from '@/lib/api/staff-api';

export default function StaffDepartmentsPanel({ staff }: { staff: StaffRecord }) {
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');
  const departmentsQuery = useStaffDepartments();
  const assignMutation = useAssignStaffDepartment(staff.id);
  const removeMutation = useRemoveStaffDepartment(staff.id);
  const assignedIds = new Set(staff.departments?.map(getStaffDepartmentId) ?? []);
  const availableDepartments = (departmentsQuery.data ?? []).filter((department) => !assignedIds.has(department.id));
  const pending = assignMutation.isPending || removeMutation.isPending;

  const addDepartment = async () => {
    if (!departmentId) return;
    setError('');

    try {
      await assignMutation.mutateAsync(departmentId);
      setDepartmentId('');
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError, 'Department could not be assigned'));
    }
  };

  const removeDepartment = async (id: string) => {
    setError('');

    try {
      await removeMutation.mutateAsync(id);
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError, 'Department could not be removed'));
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-border p-4">
      <h3 className="text-base font-semibold text-foreground">Department assignments</h3>
      {error ? <FeedbackMessage type="error" message={error} /> : null}

      <div className="flex flex-wrap gap-2">
        {staff.departments?.length ? (
          staff.departments.map((department) => (
            <span key={department.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1">
              <Badge>{getStaffDepartmentName(department)}</Badge>
              <button
                type="button"
                disabled={pending}
                onClick={() => removeDepartment(getStaffDepartmentId(department))}
                className="text-xs font-medium text-danger disabled:opacity-50"
              >
                Remove
              </button>
            </span>
          ))
        ) : (
          <p className="text-sm text-muted">No departments assigned.</p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label htmlFor="staff-department" className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Add department</span>
          <select
            id="staff-department"
            value={departmentId}
            disabled={departmentsQuery.isLoading || pending}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">Select department</option>
            {availableDepartments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </label>
        <Button type="button" className="self-end" loading={assignMutation.isPending} disabled={!departmentId} onClick={addDepartment}>
          Add
        </Button>
      </div>
    </section>
  );
}
