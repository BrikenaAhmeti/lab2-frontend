import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import { getApiErrorMessage, getStaffDepartmentName, getStaffName, useStaffList } from '@/features/staff/hooks/useStaff';
import Badge from '@/ui/atoms/Badge';
import Button from '@/ui/atoms/Button';
import Card from '@/ui/atoms/Card';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';

function canReadStaff(permissions: string[], roles: string[]) {
  return (
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['staff:read', 'staff:manage', 'staff:manage:all'], 'any')
  );
}

export default function StaffScheduleOverviewPage() {
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const staffQuery = useStaffList({ page: 1, limit: 50, status: 'active' });
  const rows = staffQuery.data?.items ?? [];

  if (!canReadStaff(permissions, roles)) {
    return <Forbidden />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Staff Management' }, { label: 'Schedule Overview' }]} />

      <Card title="Schedule Overview" subtitle="Open staff schedule and exception tabs from one place">
        {staffQuery.isLoading ? <div className="rounded-xl border border-border p-4 text-sm text-muted">Loading schedules...</div> : null}
        {staffQuery.isError ? <FeedbackMessage type="error" message={getApiErrorMessage(staffQuery.error, 'Staff schedules could not be loaded')} /> : null}

        {!staffQuery.isLoading && !staffQuery.isError && rows.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
            No active staff members found.
          </p>
        ) : null}

        {!staffQuery.isLoading && !staffQuery.isError && rows.length > 0 ? (
          <div className="space-y-2">
            {rows.map((staff) => (
              <section key={staff.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">{getStaffName(staff)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {staff.departments?.map((department) => (
                      <Badge key={department.id}>{getStaffDepartmentName(department)}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/staff/${staff.id}?tab=schedule`}>
                    <Button size="sm" variant="secondary">Schedule</Button>
                  </Link>
                  <Link to={`/admin/staff/${staff.id}?tab=exceptions`}>
                    <Button size="sm" variant="secondary">Exceptions</Button>
                  </Link>
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
