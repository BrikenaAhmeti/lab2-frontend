export type PortalKey =
  | 'admin'
  | 'patient'
  | 'doctor'
  | 'nurse'
  | 'lab'
  | 'pharmacy'
  | 'receptionist';

export interface PortalNavItem {
  to: string;
  label: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  end?: boolean;
}

export interface PortalNavGroup {
  label: string;
  items: PortalNavItem[];
}

export interface PortalConfig {
  key: PortalKey;
  title: string;
  eyebrow: string;
  homePath: string;
  navGroups: PortalNavGroup[];
}

export const portalConfigs: Record<PortalKey, PortalConfig> = {
  admin: {
    key: 'admin',
    title: 'Admin Portal',
    eyebrow: 'Facility operations',
    homePath: '/admin',
    navGroups: [
      {
        label: 'Workspace',
        items: [
          { to: '/admin', label: 'Dashboard' },
          { to: '/admin/departments', label: 'Departments', requiredPermissions: ['departments:read'] },
          { to: '/admin/patients', label: 'Patients', requiredPermissions: ['patients:read', 'patients:create'] },
          { to: '/admin/inventory', label: 'Inventory', requiredPermissions: ['inventory:read'] },
          { to: '/admin/billing', label: 'Billing', requiredPermissions: ['billing:read', 'billing:read:all'] },
          { to: '/admin/reports', label: 'Reports', requiredPermissions: ['reports:generate'] },
          {
            to: '/admin/search',
            label: 'Advanced Search',
            requiredPermissions: [
              'patients:read',
              'appointments:read',
              'lab_orders:read',
              'inventory:read',
              'staff:read',
              'audit_logs:read',
            ],
          },
          { to: '/admin/messages', label: 'Messages' },
          { to: '/admin/feedback', label: 'Feedback', requiredPermissions: ['feedback:read', 'feedback:read:all'] },
          { to: '/admin/contact', label: 'Contact Inbox', requiredPermissions: ['contact:read', 'contact:read:all'] },
        ],
      },
      {
        label: 'Organization',
        items: [
          { to: '/admin/organization/services', label: 'Service Catalog', requiredPermissions: ['services:read'] },
          {
            to: '/admin/organization/staff-position-types',
            label: 'Staff Position Types',
            requiredPermissions: ['staff-position-types:read', 'staff_types:manage'],
          },
          { to: '/admin/organization/settings', label: 'Settings', requiredPermissions: ['settings:manage'] },
        ],
      },
      {
        label: 'Staff Management',
        items: [
          { to: '/admin/staff', label: 'Staff Directory', requiredPermissions: ['staff:read', 'staff:manage'], end: true },
          { to: '/admin/staff/schedules', label: 'Schedule Overview', requiredPermissions: ['staff:read', 'staff:manage'] },
        ],
      },
      {
        label: 'CMS',
        items: [
          { to: '/admin/cms/pages', label: 'Pages', requiredPermissions: ['cms:edit'] },
          { to: '/admin/cms/banners', label: 'Banners', requiredPermissions: ['cms:edit'] },
        ],
      },
      {
        label: 'Account',
        items: [
          { to: '/admin/profile', label: 'Profile' },
          { to: '/admin/sessions', label: 'Sessions', requiredRoles: ['Super Admin'] },
        ],
      },
    ],
  },
  patient: {
    key: 'patient',
    title: 'Patient Portal',
    eyebrow: 'Care access',
    homePath: '/patient',
    navGroups: [
      {
        label: 'Care',
        items: [
          { to: '/patient', label: 'Dashboard' },
          { to: '/patient/book-appointment', label: 'Book Appointment' },
          { to: '/patient/appointments', label: 'My Appointments' },
          { to: '/patient/medical-records', label: 'Medical Records' },
          { to: '/patient/lab-results', label: 'Lab Results' },
          { to: '/patient/prescriptions', label: 'Prescriptions' },
          { to: '/patient/billing', label: 'Billing' },
          { to: '/patient/messages', label: 'Messages' },
          { to: '/patient/profile', label: 'Profile' },
        ],
      },
    ],
  },
  doctor: {
    key: 'doctor',
    title: 'Doctor Portal',
    eyebrow: 'Clinical workspace',
    homePath: '/doctor',
    navGroups: [
      {
        label: 'Clinical',
        items: [
          { to: '/doctor', label: 'Dashboard' },
          { to: '/doctor/feedback', label: 'Feedback', requiredPermissions: ['feedback:read'] },
          { to: '/doctor/lab-reviews', label: 'Lab Reviews', requiredPermissions: ['lab_results:review'] },
          { to: '/doctor/messages', label: 'Messages' },
          { to: '/doctor/profile', label: 'Profile' },
        ],
      },
    ],
  },
  nurse: {
    key: 'nurse',
    title: 'Nurse Portal',
    eyebrow: 'Department care',
    homePath: '/nurse',
    navGroups: [
      {
        label: 'Care',
        items: [
          { to: '/nurse', label: 'Dashboard' },
          { to: '/nurse/messages', label: 'Messages' },
          { to: '/nurse/profile', label: 'Profile' },
        ],
      },
    ],
  },
  lab: {
    key: 'lab',
    title: 'Lab Portal',
    eyebrow: 'Order processing',
    homePath: '/lab',
    navGroups: [
      {
        label: 'Laboratory',
        items: [
          { to: '/lab', label: 'Dashboard' },
          { to: '/lab/messages', label: 'Messages' },
          { to: '/lab/profile', label: 'Profile' },
        ],
      },
    ],
  },
  pharmacy: {
    key: 'pharmacy',
    title: 'Pharmacy Portal',
    eyebrow: 'Fulfillment',
    homePath: '/pharmacy',
    navGroups: [
      {
        label: 'Pharmacy',
        items: [
          { to: '/pharmacy', label: 'Queue', requiredPermissions: ['pharmacy:read'] },
          { to: '/pharmacy/messages', label: 'Messages' },
          { to: '/pharmacy/profile', label: 'Profile' },
        ],
      },
    ],
  },
  receptionist: {
    key: 'receptionist',
    title: 'Receptionist Portal',
    eyebrow: 'Front desk',
    homePath: '/receptionist',
    navGroups: [
      {
        label: 'Reception',
        items: [
          { to: '/receptionist', label: 'Dashboard' },
          { to: '/receptionist/book-appointment', label: 'Book Appointment', requiredPermissions: ['appointments:create'] },
          { to: '/receptionist/appointments', label: 'Appointments', requiredPermissions: ['appointments:read'] },
          { to: '/receptionist/messages', label: 'Messages' },
          { to: '/receptionist/patients', label: 'Patients', requiredPermissions: ['patients:read', 'patients:create'] },
          { to: '/receptionist/billing', label: 'Billing', requiredPermissions: ['billing:read', 'billing:read:all'] },
          { to: '/receptionist/profile', label: 'Profile' },
        ],
      },
    ],
  },
};
