import { ArrowRight, Building2, CalendarDays, ListOrdered, Phone } from 'lucide-react';
import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Modal from '@/ui/molecules/Modal';
import WorkingHoursSummary from '@/ui/molecules/WorkingHoursSummary';
import { normalizeWorkingHours } from '@/features/settings/workingHours';
import type { DepartmentRecord } from '@/lib/api/departments-api';

interface DepartmentDetailsModalProps {
  department: DepartmentRecord | null;
  onClose: () => void;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/45 px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{value || '-'}</p>
    </div>
  );
}

export default function DepartmentDetailsModal({ department, onClose }: DepartmentDetailsModalProps) {
  if (!department) {
    return null;
  }

  const hoursRows = normalizeWorkingHours(department.operatingHours);

  return (
    <Modal
      open={Boolean(department)}
      title="Department details"
      description="Review the department profile, visibility, and operating hours."
      maxWidth="lg"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Link
            to={`/admin/organization/services?departmentId=${department.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            View services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-xl font-semibold text-foreground">{department.name}</h4>
            {department.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{department.description}</p> : null}
          </div>
          <Badge variant={department.isActive ? 'success' : 'neutral'} className="mt-1">
            {department.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Floor" value={department.floor ?? '-'} icon={<Building2 className="h-4 w-4" />} />
          <DetailItem label="Extension" value={department.phoneExtension ?? '-'} icon={<Phone className="h-4 w-4" />} />
          <DetailItem label="Sort order" value={department.sortOrder} icon={<ListOrdered className="h-4 w-4" />} />
          <DetailItem label="Updated" value={formatDateTime(department.updatedAt)} icon={<CalendarDays className="h-4 w-4" />} />
        </div>

        <section className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="text-sm font-semibold text-foreground">Operating hours</h5>
            <span className="text-xs text-muted">{`Created ${formatDateTime(department.createdAt)}`}</span>
          </div>
          <WorkingHoursSummary rows={hoursRows} />
        </section>
      </div>
    </Modal>
  );
}
