import { describe, expect, it } from 'vitest';
import { portalConfigs } from '@/layouts/portalConfig';

describe('portalConfigs', () => {
  it('wires the admin organization links required by MS-9', () => {
    const organization = portalConfigs.admin.navGroups.find((group) => group.label === 'Organization');

    expect(organization?.items).toEqual([
      expect.objectContaining({ label: 'Service Catalog', to: '/admin/organization/services' }),
      expect.objectContaining({ label: 'Staff Position Types', to: '/admin/organization/staff-position-types' }),
      expect.objectContaining({ label: 'Settings', to: '/admin/organization/settings' }),
    ]);
  });

  it('wires the admin staff management links required by MS-10', () => {
    const staffManagement = portalConfigs.admin.navGroups.find((group) => group.label === 'Staff Management');

    expect(staffManagement?.items).toEqual([
      expect.objectContaining({ label: 'Staff Directory', to: '/admin/staff' }),
      expect.objectContaining({ label: 'Schedule Overview', to: '/admin/staff/schedules' }),
    ]);
  });

  it('wires the admin inventory link required by MS-28', () => {
    const workspace = portalConfigs.admin.navGroups.find((group) => group.label === 'Workspace');

    expect(workspace?.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Inventory', to: '/admin/inventory', requiredPermissions: ['inventory:read'] }),
    ]));
  });

  it('keeps voice AI logs out of the standalone admin navigation', () => {
    const adminItems = portalConfigs.admin.navGroups.flatMap((group) => group.items);

    expect(adminItems).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Voice AI Logs' }),
    ]));
  });

  it('keeps sessions visible only to super admins', () => {
    const allItems = Object.values(portalConfigs).flatMap((config) =>
      config.navGroups.flatMap((group) => group.items.map((item) => ({ ...item, portal: config.key })))
    );

    expect(allItems.filter((item) => item.label === 'Sessions')).toEqual([
      expect.objectContaining({
        portal: 'admin',
        to: '/admin/sessions',
        requiredRoles: ['Super Admin'],
      }),
    ]);
  });

  it('wires the patient portal links required by MS-55', () => {
    const care = portalConfigs.patient.navGroups.find((group) => group.label === 'Care');

    expect(care?.items).toEqual([
      expect.objectContaining({ label: 'Dashboard', to: '/patient' }),
      expect.objectContaining({ label: 'Book Appointment', to: '/patient/book-appointment' }),
      expect.objectContaining({ label: 'My Appointments', to: '/patient/appointments' }),
      expect.objectContaining({ label: 'Medical Records', to: '/patient/medical-records' }),
      expect.objectContaining({ label: 'Lab Results', to: '/patient/lab-results' }),
      expect.objectContaining({ label: 'Prescriptions', to: '/patient/prescriptions' }),
      expect.objectContaining({ label: 'Billing', to: '/patient/billing' }),
      expect.objectContaining({ label: 'Messages', to: '/patient/messages' }),
      expect.objectContaining({ label: 'Profile', to: '/patient/profile' }),
    ]);
  });

  it('wires nurse clinical detail links', () => {
    const care = portalConfigs.nurse.navGroups.find((group) => group.label === 'Care');

    expect(care?.items).toEqual([
      expect.objectContaining({ label: 'Dashboard', to: '/nurse' }),
      expect.objectContaining({ label: 'Appointments', to: '/nurse/appointments' }),
      expect.objectContaining({ label: 'Patients', to: '/nurse/patients' }),
      expect.objectContaining({ label: 'Medical Records', to: '/nurse/medical-records' }),
      expect.objectContaining({ label: 'Messages', to: '/nurse/messages' }),
      expect.objectContaining({ label: 'Profile', to: '/nurse/profile' }),
    ]);
  });

  it('wires pharmacist inventory management into the pharmacy portal', () => {
    const pharmacy = portalConfigs.pharmacy.navGroups.find((group) => group.label === 'Pharmacy');

    expect(pharmacy?.items).toEqual([
      expect.objectContaining({ label: 'Queue', to: '/pharmacy' }),
      expect.objectContaining({
        label: 'Inventory',
        to: '/pharmacy/inventory',
        requiredRoles: ['Pharmacist'],
      }),
      expect.objectContaining({ label: 'Messages', to: '/pharmacy/messages' }),
      expect.objectContaining({ label: 'Profile', to: '/pharmacy/profile' }),
    ]);
  });
});
