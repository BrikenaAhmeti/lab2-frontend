import type { AuthUser } from '@/features/auth/authSlice';
import { getUserRoleNames, hasRole } from './roles';

function textId(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

export function resolveSessionPatientId(user: AuthUser | null | undefined) {
  const explicitPatientId = textId(user?.patientId) || textId(user?.patientProfileId);

  if (explicitPatientId) {
    return explicitPatientId;
  }

  if (user && hasRole(getUserRoleNames(user), 'Patient')) {
    return textId(user.profileId);
  }

  return '';
}
