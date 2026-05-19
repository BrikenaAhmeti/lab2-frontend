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

export default function StaffStep({ staff, selectedId, loading, error, onSelect }: StaffStepProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading staff...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
        No public staff members are available for this department.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {staff.map((member) => (
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
          {member.bio ? <span className="mt-3 block text-sm text-muted">{member.bio}</span> : null}
          <span className="mt-3 flex flex-wrap gap-1.5">
            {member.departments?.map((department) => (
              <Badge key={department.id}>{department.name ?? department.department?.name ?? 'Department'}</Badge>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}
