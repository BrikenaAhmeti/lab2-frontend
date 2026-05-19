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
          { to: '/admin/users', label: 'Users', requiredPermissions: ['users:read'] },
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
        label: 'Account',
        items: [
          { to: '/admin/profile', label: 'Profile' },
          { to: '/admin/sessions', label: 'Sessions' },
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
          { to: '/patient/book-appointment', label: 'Book Appointment', requiredPermissions: ['appointments:create'] },
          { to: '/patient/appointments', label: 'My Appointments', requiredPermissions: ['appointments:read'] },
          { to: '/patient/profile', label: 'Profile' },
          { to: '/patient/sessions', label: 'Sessions' },
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
          { to: '/doctor/profile', label: 'Profile' },
          { to: '/doctor/sessions', label: 'Sessions' },
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
          { to: '/nurse/profile', label: 'Profile' },
          { to: '/nurse/sessions', label: 'Sessions' },
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
          { to: '/lab/profile', label: 'Profile' },
          { to: '/lab/sessions', label: 'Sessions' },
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
          { to: '/pharmacy', label: 'Dashboard' },
          { to: '/pharmacy/profile', label: 'Profile' },
          { to: '/pharmacy/sessions', label: 'Sessions' },
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
          { to: '/receptionist/patients', label: 'Patients', requiredPermissions: ['patients:read', 'patients:create'] },
          { to: '/receptionist/profile', label: 'Profile' },
          { to: '/receptionist/sessions', label: 'Sessions' },
        ],
      },
    ],
  },
};
