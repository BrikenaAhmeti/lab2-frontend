import type { AuthUser } from '@/features/auth/authSlice';

type AuthUserSource = Partial<AuthUser> & { patient_profile?: unknown };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function text(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(text).filter(Boolean);
  }

  const single = text(value);
  return single ? [single] : [];
}

function assignText(target: Record<string, unknown>, key: string, value: unknown) {
  const next = text(value);
  if (next) {
    target[key] = next;
  }
}

function assignArray(target: Record<string, unknown>, key: string, value: unknown) {
  const next = stringList(value);
  if (next.length > 0) {
    target[key] = next;
  }
}

function assignObject(target: Record<string, unknown>, key: string, value: unknown) {
  if (asRecord(value)) {
    target[key] = value;
  }
}

function normalizeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
}

function decodeBase64UrlJson(value: string) {
  const decoded = globalThis.atob(normalizeBase64Url(value));

  try {
    return decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
  } catch {
    return decoded;
  }
}

export function decodeJwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) return null;

  const [, payload] = token.split('.');
  if (!payload) return null;

  try {
    return asRecord(JSON.parse(decodeBase64UrlJson(payload)));
  } catch {
    return null;
  }
}

export function authUserFromAccessToken(token?: string | null): AuthUser | null {
  const claims = decodeJwtPayload(token);
  if (!claims) return null;

  const source: AuthUserSource = {
    id: text(claims.sub) || text(claims.id) || text(claims.userId) || text(claims.user_id),
    email: text(claims.email),
    username: text(claims.username) || text(claims.preferred_username) || undefined,
    firstName: text(claims.firstName) || text(claims.first_name) || text(claims.given_name) || undefined,
    lastName: text(claims.lastName) || text(claims.last_name) || text(claims.family_name) || undefined,
    roles: stringList(claims.roles).length > 0 ? stringList(claims.roles) : stringList(claims.role),
    permissions: stringList(claims.permissions),
    role: text(claims.role) || undefined,
    patientId: text(claims.patientId) || text(claims.patient_id) || undefined,
    patientProfileId: text(claims.patientProfileId) || text(claims.patient_profile_id) || undefined,
    profileId: text(claims.profileId) || text(claims.profile_id) || undefined,
    patient_id: text(claims.patient_id) || undefined,
    patient_profile_id: text(claims.patient_profile_id) || undefined,
    profile_id: text(claims.profile_id) || undefined,
  };

  assignObject(source, 'patient', claims.patient);
  assignObject(source, 'patientProfile', claims.patientProfile);
  assignObject(source, 'patient_profile', claims.patient_profile);
  assignObject(source, 'profile', claims.profile);

  return mergeAuthUserSources(source);
}

export function mergeAuthUserSources(...sources: Array<AuthUserSource | null | undefined>): AuthUser | null {
  const merged: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;

    assignText(merged, 'id', source.id);
    assignText(merged, 'email', source.email);
    assignText(merged, 'name', source.name);
    assignText(merged, 'firstName', source.firstName);
    assignText(merged, 'lastName', source.lastName);
    assignText(merged, 'username', source.username);
    assignText(merged, 'role', source.role);
    assignArray(merged, 'roles', source.roles);
    assignArray(merged, 'permissions', source.permissions);
    assignText(merged, 'patientId', source.patientId);
    assignText(merged, 'patientProfileId', source.patientProfileId);
    assignText(merged, 'profileId', source.profileId);
    assignText(merged, 'patient_id', source.patient_id);
    assignText(merged, 'patient_profile_id', source.patient_profile_id);
    assignText(merged, 'profile_id', source.profile_id);
    assignObject(merged, 'patient', source.patient);
    assignObject(merged, 'patientProfile', source.patientProfile);
    assignObject(merged, 'patient_profile', source.patient_profile);
    assignObject(merged, 'profile', source.profile);
  }

  const id = text(merged.id);
  if (!id) return null;

  const patientId =
    text(merged.patientId) ||
    text(merged.patient_id) ||
    text(merged.patientProfileId) ||
    text(merged.patient_profile_id);

  if (patientId) {
    merged.patientId = text(merged.patientId) || patientId;
    merged.patient_id = text(merged.patient_id) || patientId;
    merged.patientProfileId = text(merged.patientProfileId) || patientId;
    merged.patient_profile_id = text(merged.patient_profile_id) || patientId;
    merged.profileId = text(merged.profileId) || patientId;
  }

  return {
    ...merged,
    id,
    email: text(merged.email),
    roles: stringList(merged.roles),
    permissions: stringList(merged.permissions),
  } as AuthUser;
}
