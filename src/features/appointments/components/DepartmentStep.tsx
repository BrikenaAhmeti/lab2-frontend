import type { DepartmentRecord } from '@/lib/api/departments-api';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

interface DepartmentStepProps {
  departments: DepartmentRecord[];
  selectedId?: string;
  loading: boolean;
  error?: string;
  onSelect: (department: DepartmentRecord) => void;
}

export default function DepartmentStep({ departments, selectedId, loading, error, onSelect }: DepartmentStepProps) {
  if (loading) {
    return <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading departments...</div>;
  }

  if (error) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
        No active departments are available.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {departments.map((department) => (
        <button
          key={department.id}
          type="button"
          onClick={() => onSelect(department)}
          className={`rounded-xl border p-4 text-left transition hover:border-primary ${
            selectedId === department.id ? 'border-primary bg-primary/10' : 'border-border bg-background'
          }`}
        >
          <span className="font-semibold text-foreground">{department.name}</span>
          {department.description ? <span className="mt-1 block text-sm text-muted">{department.description}</span> : null}
          {department.floor ? <span className="mt-3 block text-xs text-muted">{department.floor}</span> : null}
        </button>
      ))}
    </div>
  );
}
