import { describe, expect, it } from 'vitest';
import { resolveSessionPatientId } from '@/features/auth/utils/patientSession';

describe('patient session utilities', () => {
  it('uses explicit patient ids from the session', () => {
    expect(
      resolveSessionPatientId({
        id: 'user-1',
        patientId: 'patient-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      })
    ).toBe('patient-1');

    expect(
      resolveSessionPatientId({
        id: 'user-1',
        patientProfileId: 'patient-profile-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      })
    ).toBe('patient-profile-1');
  });

  it('supports backend patient id aliases and nested patient profiles', () => {
    expect(
      resolveSessionPatientId({
        id: 'user-1',
        patient_id: 'patient-snake-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      })
    ).toBe('patient-snake-1');

    expect(
      resolveSessionPatientId({
        id: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
        patientProfile: { id: 'patient-nested-1' },
      })
    ).toBe('patient-nested-1');

    expect(
      resolveSessionPatientId({
        id: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
        profile: { patient_id: 'patient-profile-nested-1' },
      })
    ).toBe('patient-profile-nested-1');
  });

  it('uses profileId only for patient sessions', () => {
    expect(
      resolveSessionPatientId({
        id: 'user-1',
        profileId: 'patient-profile-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      })
    ).toBe('patient-profile-1');

    expect(
      resolveSessionPatientId({
        id: 'doctor-user',
        profileId: 'doctor-profile-1',
        email: 'doctor@example.com',
        roles: ['Doctor'],
        permissions: [],
      })
    ).toBe('');
  });

  it('does not guess the patient id from the account user id', () => {
    expect(
      resolveSessionPatientId({
        id: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      })
    ).toBe('');
  });
});
