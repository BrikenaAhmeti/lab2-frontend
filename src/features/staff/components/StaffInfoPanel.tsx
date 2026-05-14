import Badge from '@/ui/atoms/Badge';
import { getStaffEmail, getStaffName, getStaffStatus } from '@/features/staff/hooks/useStaff';
import type { StaffRecord } from '@/lib/api/staff-api';

export default function StaffInfoPanel({ staff }: { staff: StaffRecord }) {
  const details = [
    ['Name', getStaffName(staff)],
    ['Email', getStaffEmail(staff)],
    ['Phone', staff.user?.phone ?? staff.phone ?? '-'],
    ['Position', staff.positionType?.name ?? '-'],
    ['Specialization', staff.specialization ?? '-'],
  ];

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">Personal info</h3>
        <Badge variant={getStaffStatus(staff).toLowerCase() === 'active' ? 'success' : 'neutral'}>
          {getStaffStatus(staff)}
        </Badge>
      </div>
      <dl className="grid gap-3 md:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase text-muted">{label}</dt>
            <dd className="mt-1 text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
      {staff.bio ? <p className="mt-4 text-sm text-muted">{staff.bio}</p> : null}
    </section>
  );
}
