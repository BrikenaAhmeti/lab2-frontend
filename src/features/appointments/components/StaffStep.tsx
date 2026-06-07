import type { StaffRecord } from '@/lib/api/staff-api';
import { getStaffName } from '@/features/staff/hooks/useStaff';
import Badge from '@/ui/atoms/Badge';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface StaffStepProps {
  staff: StaffRecord[];
  selectedId?: string;
  loading: boolean;
  error?: string;
  onSelect: (staff: StaffRecord) => void;
}

function getDepartmentName(department: NonNullable<StaffRecord['departments']>[number]) {
  return department.name ?? department.department?.name ?? 'Department';
}

function getDepartmentNames(member: StaffRecord) {
  return (member.departments ?? [])
    .filter((department) => department.unassignedAt === undefined || department.unassignedAt === null)
    .filter((department) => department.department?.isActive !== false)
    .map(getDepartmentName);
}

export default function StaffStep({ staff, selectedId, loading, error, onSelect }: StaffStepProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading doctors and care providers...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
        No doctors or care providers are available for booking.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {staff.map((member) => {
        const departmentNames = getDepartmentNames(member);

        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(member)}
            className={`rounded-xl border p-4 text-left transition hover:border-primary ${
              selectedId === member.id ? 'border-primary bg-primary/10' : 'border-border bg-background'
            }`}
          >
            <span className="font-semibold text-foreground">{getStaffName(member)}</span>
            <span className="mt-1 block text-sm text-muted">
              {member.specialization ?? member.positionType?.name ?? 'Care provider'}
            </span>
            <span className="mt-2 block text-sm font-medium text-foreground">
              {departmentNames.length > 1
                ? `Departments: ${departmentNames.join(', ')}`
                : `Department: ${departmentNames[0] ?? 'Not assigned'}`}
            </span>
            {member.bio ? <span className="mt-3 block text-sm text-muted">{member.bio}</span> : null}
            {departmentNames.length > 0 ? (
              <span className="mt-3 flex flex-wrap gap-1.5">
                {departmentNames.map((departmentName) => (
                  <Badge key={departmentName}>{departmentName}</Badge>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
