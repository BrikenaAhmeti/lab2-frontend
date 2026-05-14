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
});
