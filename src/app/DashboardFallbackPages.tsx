import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import UsersPage from '@/features/users/pages/UsersPage';
import { Link } from 'react-router-dom';
import Card from '@/ui/atoms/Card';
import Badge from '@/ui/atoms/Badge';

export function DashboardHome() {
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const canManageStaff = roles.includes('Admin') || roles.includes('Super Admin');
  const title = user?.email ? `Welcome back, ${user.email}` : 'MedSphere Dashboard';

  const stats = [
    { label: 'Today\u2019s Appointments', value: '128', trend: '+14', variant: 'info' as const, to: '/receptionist' },
    { label: 'Checked-in Patients', value: '46', trend: '72% on time', variant: 'success' as const, to: '/patient' },
    { label: 'Pending Lab Orders', value: '19', trend: '-5 since noon', variant: 'warning' as const, to: '/lab' },
    { label: 'Low Stock Alerts', value: '7', trend: '3 critical', variant: 'danger' as const, to: '/pharmacy' },
    { label: 'Revenue Today', value: '$18,420', trend: '+8.4%', variant: 'success' as const, to: '/admin' },
  ];

  const quickActions = [
    { label: 'Register Patient', description: 'Create a new patient profile', to: '/patient' },
    { label: 'Book Appointment', description: 'Schedule a consultation', to: '/receptionist' },
    { label: 'View Lab Queue', description: 'Review pending lab work', to: '/lab' },
    { label: 'Manage Staff', description: 'Coordinate shifts and roles', to: '/admin/users', disabled: !canManageStaff },
  ];

  const activity = [
    { patient: 'Emma Rivera', event: 'Patient checked in', status: 'Complete', variant: 'success' as const, time: '8 min ago' },
    { patient: 'Miles Jordan', event: 'Appointment booked', status: 'Scheduled', variant: 'info' as const, time: '18 min ago' },
    { patient: 'Nadia Foster', event: 'Lab result completed', status: 'Complete', variant: 'success' as const, time: '27 min ago' },
    { patient: 'Owen Clarke', event: 'Prescription issued', status: 'Issued', variant: 'neutral' as const, time: '41 min ago' },
  ];

  const appointments = [
    { patient: 'Sofia Bennett', doctor: 'Dr. Arben Hoxha', time: '10:30 AM', status: 'Checked in', variant: 'success' as const },
    { patient: 'Liam Carter', doctor: 'Dr. Elena Krasniqi', time: '11:15 AM', status: 'Scheduled', variant: 'info' as const },
    { patient: 'Mira Novak', doctor: 'Dr. Nora Selimi', time: '12:00 PM', status: 'Pending', variant: 'warning' as const },
  ];

  const team = [
    { name: 'Dr. Arben Hoxha', role: 'Doctor', status: 'Consulting' },
    { name: 'Nurse Hana Berisha', role: 'Nurse', status: 'Triage' },
    { name: 'Lab Tech Mira Gashi', role: 'Lab', status: 'Processing' },
    { name: 'Elira Krasniqi', role: 'Reception', status: 'Front desk' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="success">Live system</Badge>
              <span className="text-sm text-muted">Last updated just now</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted sm:text-base">
              {'Overview of today\u2019s healthcare operations'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
            <div className="rounded-xl border border-border bg-surface/70 p-4 transition hover:bg-surface hover:scale-[1.01]">
              <p className="text-muted">Clinic Capacity</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">84%</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/70 p-4 transition hover:bg-surface hover:scale-[1.01]">
              <p className="text-muted">Avg. Wait</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">12 min</p>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <Link key={item.label} to={item.to} className="block">
            <Card className="p-4 transition hover:bg-surface hover:scale-[1.01]">
              <p className="text-sm text-muted">{item.label}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                <Badge variant={item.variant}>{item.trend}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <Card title="Quick Actions" subtitle="Common operational workflows">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.length === 0 && <p className="text-sm text-muted">No data available</p>}
          {quickActions.map((action) => {
            const actionContent = (
              <>
                <p className="font-medium text-foreground">{action.label}</p>
                <p className="mt-1 text-sm text-muted">{action.description}</p>
                <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-surface/80">
                  {action.label}
                </span>
              </>
            );

            if (action.disabled) {
              return (
                <div
                  key={action.label}
                  aria-disabled="true"
                  className="rounded-xl border border-border bg-surface/70 p-4 opacity-60"
                >
                  {actionContent}
                </div>
              );
            }

            return (
              <Link
                key={action.label}
                to={action.to}
                className="rounded-xl border border-border bg-surface/70 p-4 transition hover:bg-surface hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                {actionContent}
              </Link>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card title={'Today\u2019s Activity'} subtitle="Live activity across patient workflows">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Activity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 && (
                  <tr className="border-t border-border">
                    <td className="px-4 py-6 text-center text-muted" colSpan={4}>
                      No data available
                    </td>
                  </tr>
                )}
                {activity.map((item) => (
                  <tr key={`${item.patient}-${item.event}`} className="border-t border-border transition hover:bg-surface/70">
                    <td className="px-4 py-3 font-medium text-foreground">{item.patient}</td>
                    <td className="px-4 py-3 text-muted">{item.event}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.variant}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Upcoming Appointments" subtitle="Next scheduled visits">
          <ul className="space-y-3">
            {appointments.length === 0 && <li className="text-sm text-muted">No data available</li>}
            {appointments.map((appointment) => (
              <li
                key={`${appointment.patient}-${appointment.time}`}
                className="rounded-xl border border-border bg-surface/70 p-4 transition hover:bg-surface hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{appointment.patient}</p>
                    <p className="mt-1 text-sm text-muted">{appointment.doctor}</p>
                  </div>
                  <Badge variant={appointment.variant}>{appointment.status}</Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{appointment.time}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card title="Team On Duty" subtitle="Current clinical and operations coverage">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {team.length === 0 && <p className="text-sm text-muted">No data available</p>}
          {team.map((member) => (
            <div key={member.name} className="rounded-xl border border-border bg-surface/70 p-4 transition hover:bg-surface hover:scale-[1.01]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{member.name}</p>
                  <p className="mt-1 text-sm text-muted">{member.role}</p>
                </div>
                <Badge variant="neutral">{member.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function RolePage({ title }: { title: string }) {
  return (
    <Card title={title} subtitle="Protected by role guard">
      <p className="text-sm text-muted">Access granted to this role-specific dashboard.</p>
    </Card>
  );
}

export function UsersAccessGuard() {
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const allowedByRole = hasAnyRole(roles, ['Admin', 'Super Admin']);
  const allowedByPermission = hasAnyPermission(permissions, ['users:create', 'users:read'], 'any');

  if (!allowedByRole && !allowedByPermission) {
    return <Forbidden />;
  }

  return <UsersPage />;
}

export function ScopedDoctorPage() {
  return (
    <Card title="Doctor Dashboard" subtitle="Protected by role guard">
      <p className="text-sm text-muted">Access granted to this role-specific dashboard.</p>
    </Card>
  );
}

export function ErrorBoundaryPage() {
  return (
    <Card title="Error" subtitle="Something went wrong">
      <p className="text-sm text-danger">Please refresh the page and try again.</p>
    </Card>
  );
}
