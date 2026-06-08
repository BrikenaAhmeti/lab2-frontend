import { describe, expect, it } from 'vitest';
import { authUserFromAccessToken, mergeAuthUserSources } from '@/features/auth/utils/tokenSession';

function encodeJwtPayload(payload: Record<string, unknown>) {
  const encoded = globalThis
    .btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `header.${encoded}.signature`;
}

describe('token session utilities', () => {
  it('builds an auth user from backend token claims', () => {
    const user = authUserFromAccessToken(
      encodeJwtPayload({
        sub: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: ['appointments:create:own'],
        patientProfileId: 'patient-1',
      })
    );

    expect(user).toMatchObject({
      id: 'user-1',
      email: 'arta@example.com',
      roles: ['Patient'],
      permissions: ['appointments:create:own'],
      patientProfileId: 'patient-1',
    });
  });

  it('merges fresh backend session fields over stale stored session data', () => {
    const merged = mergeAuthUserSources(
      {
        id: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
      },
      {
        id: 'user-1',
        email: 'arta@example.com',
        roles: ['Patient'],
        permissions: [],
        patientId: 'patient-from-auth',
      }
    );

    expect(merged?.patientId).toBe('patient-from-auth');
  });
});
