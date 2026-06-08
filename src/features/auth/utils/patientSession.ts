import type { AuthUser } from '@/features/auth/authSlice';
import { getUserRoleNames, hasRole } from './roles';

type IdSource = Record<string, unknown>;

function asRecord(value: unknown): IdSource | null {
  return value && typeof value === 'object' ? (value as IdSource) : null;
}

function textId(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function nestedPatientId(value: unknown) {
  const source = asRecord(value);
  if (!source) return '';

  return (
    textId(source.id) ||
    textId(source.patientId) ||
    textId(source.patient_id) ||
    textId(source.patientProfileId) ||
    textId(source.patient_profile_id)
  );
}

function directPatientId(source: IdSource) {
  return (
    textId(source.patientId) ||
    textId(source.patient_id) ||
    textId(source.patientProfileId) ||
    textId(source.patient_profile_id) ||
    nestedPatientId(source.patient) ||
    nestedPatientId(source.patientProfile) ||
    nestedPatientId(source.patient_profile)
  );
}

export function resolveSessionPatientId(user: AuthUser | null | undefined) {
  const source = asRecord(user);
  if (!source) return '';

  const explicitPatientId = directPatientId(source);

  if (explicitPatientId) {
    return explicitPatientId;
  }

  if (user && hasRole(getUserRoleNames(user), 'Patient')) {
    return textId(source.profileId) || textId(source.profile_id) || nestedPatientId(source.profile);
  }

  return '';
}
