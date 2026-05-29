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
const PublicCmsPage = lazy(() => import('@/pages/public/PublicCmsPage'));
const PublicDepartmentsPage = lazy(() => import('@/pages/public/PublicDepartmentsPage'));
const PublicDoctorsPage = lazy(() => import('@/pages/public/PublicDoctorsPage'));
const PublicServicesPage = lazy(() => import('@/pages/public/PublicServicesPage'));
const PublicContactPage = lazy(() => import('@/pages/public/PublicContactPage'));
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
const PatientFeedbackPage = lazy(() => import('@/features/feedback/pages/PatientFeedbackPage'));
const FeedbackInboxPage = lazy(() => import('@/features/feedback/pages/FeedbackInboxPage'));
const ContactInboxPage = lazy(() => import('@/features/contact/pages/ContactInboxPage'));
const ConsultationPage = lazy(() => import('@/features/consultation/pages/ConsultationPage'));
const LabReviewPage = lazy(() => import('@/features/lab/pages/LabReviewPage'));
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage'));
const PatientBillingPage = lazy(() => import('@/features/billing/pages/PatientBillingPage'));
const ReportBuilderPage = lazy(() => import('@/features/reports/pages/ReportBuilderPage'));
const PatientLabResultsPage = lazy(() => import('@/features/patient-portal/pages/PatientLabResultsPage'));
const PatientPrescriptionsPage = lazy(() => import('@/features/patient-portal/pages/PatientPrescriptionsPage'));
const PatientMedicalRecordsPage = lazy(() => import('@/features/patient-portal/pages/PatientMedicalRecordsPage'));
const CmsPagesPage = lazy(() => import('@/features/cms/pages/CmsPagesPage'));
const CmsPageEditorPage = lazy(() => import('@/features/cms/pages/CmsPageEditorPage'));
const CmsBannersPage = lazy(() => import('@/features/cms/pages/CmsBannersPage'));
const ChatPage = lazy(() => import('@/features/chat/pages/ChatPage'));
const MessagesRedirect = lazy(() => import('@/features/chat/pages/MessagesRedirect'));

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
    { path: 'messages', element: lazyRoute(<ChatPage />) },
    { path: 'messages/:roomId', element: lazyRoute(<ChatPage />) },
    { path: 'profile', element: lazyRoute(<ProfilePage />) },
    { path: 'sessions', element: lazyRoute(<SessionsPage />) },
  ];
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: lazyRoute(<PublicHomePage />),
  },
  {
    path: '/public',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/about',
    element: lazyRoute(<PublicCmsPage />),
  },
  {
    path: '/departments',
    element: lazyRoute(<PublicDepartmentsPage />),
  },
  {
    path: '/doctors',
    element: lazyRoute(<PublicDoctorsPage />),
  },
  {
    path: '/services',
    element: lazyRoute(<PublicServicesPage />),
  },
  {
    path: '/contact',
    element: lazyRoute(<PublicContactPage />),
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
        path: '/messages',
        element: lazyRoute(<MessagesRedirect />),
      },
      {
        path: '/messages/:roomId',
        element: lazyRoute(<MessagesRedirect />),
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
          { path: 'billing', element: lazyRoute(<BillingPage portal="admin" />) },
          { path: 'reports', element: lazyRoute(<ReportBuilderPage />) },
          { path: 'feedback', element: lazyRoute(<FeedbackInboxPage portal="admin" />) },
          { path: 'contact', element: lazyRoute(<ContactInboxPage />) },
          { path: 'users', element: lazyRoute(<UsersPage />) },
          { path: 'cms', element: <Navigate to="/admin/cms/pages" replace /> },
          { path: 'cms/pages', element: lazyRoute(<CmsPagesPage />) },
          { path: 'cms/pages/:id', element: lazyRoute(<CmsPageEditorPage />) },
          { path: 'cms/banners', element: lazyRoute(<CmsBannersPage />) },
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
          { path: 'messages', element: lazyRoute(<ChatPage />) },
          { path: 'messages/:roomId', element: lazyRoute(<ChatPage />) },
          { path: 'medical-records', element: lazyRoute(<PatientMedicalRecordsPage />) },
          { path: 'lab-results', element: lazyRoute(<PatientLabResultsPage />) },
          { path: 'prescriptions', element: lazyRoute(<PatientPrescriptionsPage />) },
          { path: 'billing', element: lazyRoute(<PatientBillingPage />) },
          { path: 'feedback', element: lazyRoute(<PatientFeedbackPage />) },
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
          { path: 'feedback', element: lazyRoute(<FeedbackInboxPage portal="doctor" />) },
          { path: 'feedback/:id', element: lazyRoute(<FeedbackInboxPage portal="doctor" />) },
          { path: 'consultations/:appointmentId', element: lazyRoute(<ConsultationPage />) },
          { path: 'lab-reviews', element: lazyRoute(<LabReviewPage />) },
          { path: 'lab-reviews/:id', element: lazyRoute(<LabReviewPage />) },
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
          { path: 'messages', element: lazyRoute(<ChatPage />) },
          { path: 'messages/:roomId', element: lazyRoute(<ChatPage />) },
          { path: 'billing', element: lazyRoute(<BillingPage portal="receptionist" />) },
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
      { path: '/dashboard/billing', element: <Navigate to="/admin/billing" replace /> },
      { path: '/dashboard/reports', element: <Navigate to="/admin/reports" replace /> },
      { path: '/dashboard/feedback', element: <Navigate to="/admin/feedback" replace /> },
      { path: '/dashboard/contact', element: <Navigate to="/admin/contact" replace /> },
      { path: '/dashboard/users', element: <Navigate to="/admin/users" replace /> },
      { path: '/dashboard/cms', element: <Navigate to="/admin/cms/pages" replace /> },
      { path: '/dashboard/cms/pages', element: <Navigate to="/admin/cms/pages" replace /> },
      { path: '/dashboard/cms/banners', element: <Navigate to="/admin/cms/banners" replace /> },
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
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
