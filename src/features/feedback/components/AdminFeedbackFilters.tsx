import { getStaffName, useStaffDepartments, useStaffList } from '@/features/staff/hooks/useStaff';

interface AdminFeedbackFiltersProps {
  staffProfileId: string;
  departmentId: string;
  onStaffChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
}

export default function AdminFeedbackFilters({
  staffProfileId,
  departmentId,
  onStaffChange,
  onDepartmentChange,
}: AdminFeedbackFiltersProps) {
  const staffQuery = useStaffList({ page: 1, limit: 100, status: 'active' });
  const departmentsQuery = useStaffDepartments();

  return (
    <>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Doctor</span>
        <select
          value={staffProfileId}
          onChange={(event) => onStaffChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All doctors</option>
          {(staffQuery.data?.items ?? []).map((staff) => (
            <option key={staff.id} value={staff.id}>
              {getStaffName(staff)}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Department</span>
        <select
          value={departmentId}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All departments</option>
          {(departmentsQuery.data ?? []).map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
