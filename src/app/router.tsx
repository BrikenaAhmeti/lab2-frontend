import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Unauthorized from '@/components/common/Unauthorized';
import Forbidden from '@/components/common/Forbidden';
import ProtectedRoute from '@/features/auth/guards/ProtectedRoute';
import RoleGuard from '@/features/auth/guards/RoleGuard';
import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission } from '@/features/auth/utils/permission';
import Card from '@/ui/atoms/Card';
import LoginPage from '@/features/auth/pages/LoginPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import SessionsPage from '@/features/sessions/pages/SessionsPage';
import UsersPage from '@/features/users/pages/UsersPage';

function DashboardHome() {
  return (
    <Card title="MedSphere" subtitle="Role-aware healthcare command center">
      <p className="text-sm text-muted">Select a module from the sidebar.</p>
    </Card>
  );
}

function RolePage({ title }: { title: string }) {
  return (
    <Card title={title} subtitle="Protected by role guard">
      <p className="text-sm text-muted">Access granted to this role-specific dashboard.</p>
    </Card>
  );
}

function UsersAccessGuard() {
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

function ScopedDoctorPage() {
  return (
    <Card title="Doctor Dashboard" subtitle="Protected by role guard">
      <p className="text-sm text-muted">Access granted to this role-specific dashboard.</p>
    </Card>
  );
}

function ErrorBoundaryPage() {
  return (
    <Card title="Error" subtitle="Something went wrong">
      <p className="text-sm text-danger">Please refresh the page and try again.</p>
    </Card>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundaryPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  {
    path: '/401',
    element: <Unauthorized />,
  },
  {
    path: '/403',
    element: <Forbidden />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <AppLayout />,
        errorElement: <ErrorBoundaryPage />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'sessions', element: <SessionsPage /> },
          {
            path: 'users',
            element: <UsersAccessGuard />,
          },
          {
            path: 'doctor',
            element: (
              <RoleGuard allowedRoles={['Doctor']}>
                <ScopedDoctorPage />
              </RoleGuard>
            ),
          },
          {
            path: 'nurse',
            element: (
              <RoleGuard allowedRoles={['Nurse']}>
                <RolePage title="Nurse Dashboard" />
              </RoleGuard>
            ),
          },
          {
            path: 'lab',
            element: (
              <RoleGuard allowedRoles={['Lab Technician']}>
                <RolePage title="Lab Dashboard" />
              </RoleGuard>
            ),
          },
          {
            path: 'pharmacy',
            element: (
              <RoleGuard allowedRoles={['Pharmacist']}>
                <RolePage title="Pharmacy Dashboard" />
              </RoleGuard>
            ),
          },
          {
            path: 'reception',
            element: (
              <RoleGuard allowedRoles={['Receptionist']}>
                <RolePage title="Reception Dashboard" />
              </RoleGuard>
            ),
          },
          {
            path: 'patient',
            element: (
              <RoleGuard allowedRoles={['Patient']}>
                <RolePage title="Patient Dashboard" />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
