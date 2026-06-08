import { describe, expect, it } from 'vitest';
import { getStaffEmail } from '@/features/staff/hooks/useStaff';

describe('staff display helpers', () => {
  it('uses direct staff emails first', () => {
    expect(getStaffEmail({ user: { email: 'direct@medsphere.local' }, employeeCode: 'Dr. Amina El-Sayed' })).toBe(
      'direct@medsphere.local'
    );
  });

  it('uses known seeded demo account emails when auth details are missing', () => {
    expect(getStaffEmail({ userId: '11111111-1111-4111-8111-111111111112', employeeCode: 'Daniel Okafor' })).toBe(
      'clinic.admin@medsphere.local'
    );
  });

  it('derives seeded staff emails from display names instead of showing a dash', () => {
    expect(getStaffEmail({ userId: 'b2000000-0000-4000-8000-000000000001', employeeCode: 'Dr. Amina El-Sayed' })).toBe(
      'amina.el-sayed@medsphere.local'
    );
  });
});
