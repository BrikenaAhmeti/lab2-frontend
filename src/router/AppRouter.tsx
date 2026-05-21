import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import Forbidden from '@/components/common/Forbidden';
import Unauthorized from '@/components/common/Unauthorized';
import PrivateRoute from '@/components/guards/PrivateRoute';
import RoleGuard from '@/features/auth/guards/RoleGuard';
import LoginPage from '@/features/auth/pages/LoginPage';
import PatientRegistrationPage from '@/features/auth/pages/PatientRegistrationPage';
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import AdminLayout from '@/layouts/AdminLayout';
import PatientLayout from '@/layouts/PatientLayout';
import DoctorLayout from '@/layouts/DoctorLayout';
import NurseLayout from '@/layouts/NurseLayout';
import LabLayout from '@/layouts/LabLayout';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import ReceptionistLayout from '@/layouts/ReceptionistLayout';
import RoleRedirect from './RoleRedirect';

const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage'));
const PublicDoctorsPage = lazy(() => import('@/pages/public/PublicDoctorsPage'));
const AdminDashboardPage = lazy(() => import('@/pages/portals/AdminDashboardPage'));
const PatientDashboardPage = lazy(() => import('@/pages/portals/PatientDashboardPage'));
const DoctorDashboardPage = lazy(() => import('@/pages/portals/DoctorDashboardPage'));
const NurseDashboardPage = lazy(() => import('@/pages/portals/NurseDashboardPage'));
const LabDashboardPage = lazy(() => import('@/pages/portals/LabDashboardPage'));
const PharmacyDashboardPage = lazy(() => import('@/pages/portals/PharmacyDashboardPage'));
const ReceptionistDashboardPage = lazy(() => import('@/pages/portals/ReceptionistDashboardPage'));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage'));
const SessionsPage = lazy(() => import('@/features/sessions/pages/SessionsPage'));
const DepartmentsPage = lazy(() => import('@/features/departments/pages/DepartmentsPage'));
const ServicesPage = lazy(() => import('@/features/services/pages/ServicesPage'));
const StaffPositionTypesPage = lazy(() => import('@/pages/admin/organization/StaffPositionTypesPage'));
const SettingsPage = lazy(() => import('@/pages/admin/organization/SettingsPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const StaffDirectoryPage = lazy(() => import('@/features/staff/pages/StaffDirectoryPage'));
const StaffProfilePage = lazy(() => import('@/features/staff/pages/StaffProfilePage'));
const StaffScheduleOverviewPage = lazy(() => import('@/features/staff/pages/StaffScheduleOverviewPage'));
const PatientsPage = lazy(() => import('@/features/patients/pages/PatientsPage'));
const PatientProfilePage = lazy(() => import('@/features/patients/pages/PatientProfilePage'));
const PatientSelfProfilePage = lazy(() => import('@/features/patients/pages/PatientSelfProfilePage'));
const BookAppointmentPage = lazy(() => import('@/features/appointments/pages/BookAppointmentPage'));
const AppointmentsPage = lazy(() => import('@/features/appointments/pages/AppointmentsPage'));
const ConsultationPage = lazy(() => import('@/features/consultation/pages/ConsultationPage'));

function RouteSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-surface" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-surface" />
    </div>
  );
}

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteSkeleton />}>{element}</Suspense>;
}

function portalRoutes(home: ReactNode) {
  return [
    { index: true, element: lazyRoute(home) },
    { path: 'profile', element: lazyRoute(<ProfilePage />) },
    { path: 'sessions', element: lazyRoute(<SessionsPage />) },
  ];
}

export const router = createBrowserRouter([
  {
    path: '/public',
    element: lazyRoute(<PublicHomePage />),
  },
  {
    path: '/doctors',
    element: lazyRoute(<PublicDoctorsPage />),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <PatientRegistrationPage />,
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
    element: <PrivateRoute />,
    children: [
      {
        path: '/role-redirect',
        element: <RoleRedirect />,
      },
      {
        path: '/admin',
        element: (
          <RoleGuard allowedRoles={['Admin', 'Super Admin']}>
            <AdminLayout />
          </RoleGuard>
        ),
        children: [
          ...portalRoutes(<AdminDashboardPage />),
          { path: 'departments', element: lazyRoute(<DepartmentsPage />) },
          { path: 'staff', element: lazyRoute(<StaffDirectoryPage />) },
          { path: 'staff/schedules', element: lazyRoute(<StaffScheduleOverviewPage />) },
          { path: 'staff/:id', element: lazyRoute(<StaffProfilePage />) },
          { path: 'patients', element: lazyRoute(<PatientsPage />) },
          { path: 'patients/:id', element: lazyRoute(<PatientProfilePage />) },
          { path: 'users', element: lazyRoute(<UsersPage />) },
          { path: 'organization/services', element: lazyRoute(<ServicesPage />) },
          { path: 'organization/service-catalog', element: <Navigate to="/admin/organization/services" replace /> },
          { path: 'organization/staff-position-types', element: lazyRoute(<StaffPositionTypesPage />) },
          { path: 'organization/settings', element: lazyRoute(<SettingsPage />) },
        ],
      },
      {
        path: '/patient',
        element: (
          <RoleGuard allowedRoles={['Patient']}>
            <PatientLayout />
          </RoleGuard>
        ),
        children: [
          { index: true, element: lazyRoute(<PatientDashboardPage />) },
          { path: 'book-appointment', element: lazyRoute(<BookAppointmentPage mode="patient" />) },
          { path: 'appointments', element: lazyRoute(<AppointmentsPage mode="patient" />) },
          { path: 'profile', element: lazyRoute(<PatientSelfProfilePage />) },
          { path: 'sessions', element: lazyRoute(<SessionsPage />) },
        ],
      },
      {
        path: '/doctor',
        element: (
          <RoleGuard allowedRoles={['Doctor']}>
            <DoctorLayout />
          </RoleGuard>
        ),
        children: [
          ...portalRoutes(<DoctorDashboardPage />),
          { path: 'consultations/:appointmentId', element: lazyRoute(<ConsultationPage />) },
        ],
      },
      {
        path: '/nurse',
        element: (
          <RoleGuard allowedRoles={['Nurse']}>
            <NurseLayout />
          </RoleGuard>
        ),
        children: portalRoutes(<NurseDashboardPage />),
      },
      {
        path: '/lab',
        element: (
          <RoleGuard allowedRoles={['Lab Technician']}>
            <LabLayout />
          </RoleGuard>
        ),
        children: portalRoutes(<LabDashboardPage />),
      },
      {
        path: '/pharmacy',
        element: (
          <RoleGuard allowedRoles={['Pharmacist']}>
            <PharmacyLayout />
          </RoleGuard>
        ),
        children: portalRoutes(<PharmacyDashboardPage />),
      },
      {
        path: '/receptionist',
        element: (
          <RoleGuard allowedRoles={['Receptionist']}>
            <ReceptionistLayout />
          </RoleGuard>
        ),
        children: [
          ...portalRoutes(<ReceptionistDashboardPage />),
          { path: 'book-appointment', element: lazyRoute(<BookAppointmentPage mode="receptionist" />) },
          { path: 'appointments', element: lazyRoute(<AppointmentsPage mode="receptionist" />) },
          { path: 'patients', element: lazyRoute(<PatientsPage basePath="/receptionist/patients" />) },
          { path: 'patients/:id', element: lazyRoute(<PatientProfilePage basePath="/receptionist" />) },
        ],
      },
      { path: '/dashboard', element: <RoleRedirect /> },
      { path: '/dashboard/profile', element: <Navigate to="/admin/profile" replace /> },
      { path: '/dashboard/sessions', element: <Navigate to="/admin/sessions" replace /> },
      { path: '/dashboard/departments', element: <Navigate to="/admin/departments" replace /> },
      { path: '/dashboard/staff', element: <Navigate to="/admin/staff" replace /> },
      { path: '/dashboard/staff/schedules', element: <Navigate to="/admin/staff/schedules" replace /> },
      { path: '/dashboard/patients', element: <Navigate to="/admin/patients" replace /> },
      { path: '/dashboard/users', element: <Navigate to="/admin/users" replace /> },
      {
        path: '/dashboard/admin/organization/services',
        element: <Navigate to="/admin/organization/services" replace />,
      },
      {
        path: '/dashboard/admin/organization/staff-position-types',
        element: <Navigate to="/admin/organization/staff-position-types" replace />,
      },
      {
        path: '/dashboard/admin/organization/settings',
        element: <Navigate to="/admin/organization/settings" replace />,
      },
      { path: '/dashboard/doctor', element: <Navigate to="/doctor" replace /> },
      { path: '/dashboard/nurse', element: <Navigate to="/nurse" replace /> },
      { path: '/dashboard/lab', element: <Navigate to="/lab" replace /> },
      { path: '/dashboard/pharmacy', element: <Navigate to="/pharmacy" replace /> },
      { path: '/dashboard/reception', element: <Navigate to="/receptionist" replace /> },
      { path: '/dashboard/patient', element: <Navigate to="/patient" replace /> },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/public" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/public" replace />,
  },
]);
