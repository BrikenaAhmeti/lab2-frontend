import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import Unauthorized from '@/components/common/Unauthorized';
import PrivateRoute from '@/components/guards/PrivateRoute';
import RouteErrorBoundary from '@/components/common/RouteErrorBoundary';
import RoleGuard from '@/features/auth/guards/RoleGuard';
import RoleRedirect from './RoleRedirect';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const PatientRegistrationPage = lazy(() => import('@/features/auth/pages/PatientRegistrationPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('@/features/auth/pages/ResendVerificationPage'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const PatientLayout = lazy(() => import('@/layouts/PatientLayout'));
const DoctorLayout = lazy(() => import('@/layouts/DoctorLayout'));
const NurseLayout = lazy(() => import('@/layouts/NurseLayout'));
const LabLayout = lazy(() => import('@/layouts/LabLayout'));
const PharmacyLayout = lazy(() => import('@/layouts/PharmacyLayout'));
const ReceptionistLayout = lazy(() => import('@/layouts/ReceptionistLayout'));
const PublicHomePage = lazy(() => import('@/pages/public/PublicHomePage'));
const PublicCmsPage = lazy(() => import('@/pages/public/PublicCmsPage'));
const PublicDepartmentsPage = lazy(() => import('@/pages/public/PublicDepartmentsPage'));
const PublicDoctorsPage = lazy(() => import('@/pages/public/PublicDoctorsPage'));
const PublicServicesPage = lazy(() => import('@/pages/public/PublicServicesPage'));
const PublicBookAppointmentPage = lazy(() => import('@/pages/public/PublicBookAppointmentPage'));
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
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage'));
const BillingPage = lazy(() => import('@/features/billing/pages/BillingPage'));
const PatientBillingPage = lazy(() => import('@/features/billing/pages/PatientBillingPage'));
const ReportBuilderPage = lazy(() => import('@/features/reports/pages/ReportBuilderPage'));
const AdvancedSearchPage = lazy(() => import('@/features/search/pages/AdvancedSearchPage'));
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
    errorElement: <RouteErrorBoundary />,
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
    path: '/book-appointment',
    element: lazyRoute(<PublicBookAppointmentPage />),
  },
  {
    path: '/contact',
    element: lazyRoute(<PublicContactPage />),
  },
  {
    path: '/login',
    element: lazyRoute(<LoginPage />),
  },
  {
    path: '/register',
    element: lazyRoute(<PatientRegistrationPage />),
  },
  {
    path: '/forgot-password',
    element: lazyRoute(<ForgotPasswordPage />),
  },
  {
    path: '/reset-password',
    element: lazyRoute(<ResetPasswordPage />),
  },
  {
    path: '/verify-email',
    element: lazyRoute(<VerifyEmailPage />),
  },
  {
    path: '/resend-verification',
    element: lazyRoute(<ResendVerificationPage />),
  },
  {
    path: '/401',
    element: <Unauthorized />,
  },
  {
    path: '/403',
    element: <Navigate to="/role-redirect" replace />,
  },
  {
    element: <PrivateRoute />,
    errorElement: <RouteErrorBoundary />,
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
            {lazyRoute(<AdminLayout />)}
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
          { path: 'inventory', element: lazyRoute(<InventoryPage />) },
          { path: 'billing', element: lazyRoute(<BillingPage portal="admin" />) },
          { path: 'reports', element: lazyRoute(<ReportBuilderPage />) },
          { path: 'voice-ai', element: <Navigate to="/admin/sessions?tab=voice-ai" replace /> },
          { path: 'search', element: <Navigate to="/admin/search/patients" replace /> },
          { path: 'search/:resource', element: lazyRoute(<AdvancedSearchPage />) },
          { path: 'feedback', element: lazyRoute(<FeedbackInboxPage portal="admin" />) },
          { path: 'contact', element: lazyRoute(<ContactInboxPage />) },
          { path: 'users', element: <Navigate to="/admin/staff" replace /> },
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
            {lazyRoute(<PatientLayout />)}
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
            {lazyRoute(<DoctorLayout />)}
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
            {lazyRoute(<NurseLayout />)}
          </RoleGuard>
        ),
        children: portalRoutes(<NurseDashboardPage />),
      },
      {
        path: '/lab',
        element: (
          <RoleGuard allowedRoles={['Lab Technician']}>
            {lazyRoute(<LabLayout />)}
          </RoleGuard>
        ),
        children: portalRoutes(<LabDashboardPage />),
      },
      {
        path: '/pharmacy',
        element: (
          <RoleGuard allowedRoles={['Pharmacist']}>
            {lazyRoute(<PharmacyLayout />)}
          </RoleGuard>
        ),
        children: portalRoutes(<PharmacyDashboardPage />),
      },
      {
        path: '/receptionist',
        element: (
          <RoleGuard allowedRoles={['Receptionist']}>
            {lazyRoute(<ReceptionistLayout />)}
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
      { path: '/dashboard/inventory', element: <Navigate to="/admin/inventory" replace /> },
      { path: '/dashboard/billing', element: <Navigate to="/admin/billing" replace /> },
      { path: '/dashboard/reports', element: <Navigate to="/admin/reports" replace /> },
      { path: '/dashboard/feedback', element: <Navigate to="/admin/feedback" replace /> },
      { path: '/dashboard/contact', element: <Navigate to="/admin/contact" replace /> },
      { path: '/dashboard/users', element: <Navigate to="/admin/staff" replace /> },
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
    errorElement: <RouteErrorBoundary />,
  },
]);
