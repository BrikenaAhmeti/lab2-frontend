export interface ReceptionistScheduleOption {
  id: string;
  label: string;
}

interface ReceptionistScheduleFiltersProps {
  departmentId: string;
  staffId: string;
  departments: ReceptionistScheduleOption[];
  staff: ReceptionistScheduleOption[];
  onDepartmentChange: (departmentId: string) => void;
  onStaffChange: (staffId: string) => void;
}

export default function ReceptionistScheduleFilters({
  departmentId,
  staffId,
  departments,
  staff,
  onDepartmentChange,
  onStaffChange,
}: ReceptionistScheduleFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Department</span>
        <select
          value={departmentId}
          onChange={(event) => onDepartmentChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All departments</option>
          {departments.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground">Doctor</span>
        <select
          value={staffId}
          onChange={(event) => onStaffChange(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="">All doctors</option>
          {staff.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
