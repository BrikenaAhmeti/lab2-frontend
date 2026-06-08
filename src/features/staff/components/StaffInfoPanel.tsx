import { BriefcaseMedical, FileText, Mail, Phone, Stethoscope, UserRound } from 'lucide-react';
import Badge from '@/ui/atoms/Badge';
import { getStaffEmail, getStaffName, getStaffStatus } from '@/features/staff/hooks/useStaff';
import type { StaffRecord } from '@/lib/api/staff-api';

export default function StaffInfoPanel({ staff }: { staff: StaffRecord }) {
  const status = getStaffStatus(staff);
  const details = [
    { label: 'Name', value: getStaffName(staff), icon: UserRound },
    { label: 'Email', value: getStaffEmail(staff), icon: Mail },
    { label: 'Phone', value: staff.user?.phone ?? staff.phone ?? '-', icon: Phone },
    { label: 'Position', value: staff.positionType?.name ?? '-', icon: BriefcaseMedical },
    { label: 'Specialization', value: staff.specialization ?? '-', icon: Stethoscope },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-normal text-foreground">Personal info</h3>
          <p className="mt-1 text-sm text-muted">Identity, contact, and clinical role details</p>
        </div>
        <Badge variant={status.toLowerCase() === 'active' ? 'success' : 'neutral'}>
          {status}
        </Badge>
      </div>
      <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {details.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-lg border border-border bg-surface/40 p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted">
              <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-2 break-words text-sm font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      {staff.bio ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-muted">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            Profile note
          </div>
          <p className="mt-2 text-sm leading-7 text-muted">{staff.bio}</p>
        </div>
      ) : null}
    </section>
  );
}
