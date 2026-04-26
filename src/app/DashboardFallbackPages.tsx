import Forbidden from '@/components/common/Forbidden';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission } from '@/features/auth/utils/permission';
import UsersPage from '@/features/users/pages/UsersPage';
import Card from '@/ui/atoms/Card';

export function DashboardHome() {
  return (
    <Card title="MedSphere" subtitle="Role-aware healthcare command center">
      <p className="text-sm text-muted">Select a module from the sidebar.</p>
    </Card>
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
  const allowedByRole = roles.includes('Admin') || roles.includes('Super Admin');
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
