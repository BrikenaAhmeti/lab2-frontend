import { Navigate, createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Unauthorized from '@/components/common/Unauthorized';
import Forbidden from '@/components/common/Forbidden';
import ProtectedRoute from '@/features/auth/guards/ProtectedRoute';
import RoleGuard from '@/features/auth/guards/RoleGuard';
import LoginPage from '@/features/auth/pages/LoginPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import ProfilePage from '@/features/profile/pages/ProfilePage';
import SessionsPage from '@/features/sessions/pages/SessionsPage';
import DepartmentsPage from '@/features/departments/pages/DepartmentsPage';
import { DashboardHome, ErrorBoundaryPage, RolePage, ScopedDoctorPage, UsersAccessGuard } from '@/app/DashboardFallbackPages';

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
    path: '/resend-verification',
    element: <ResendVerificationPage />,
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
          { path: 'departments', element: <DepartmentsPage /> },
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
