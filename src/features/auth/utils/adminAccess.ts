import { hasAnyRole } from './permission';
import { normalizeRoleName } from './roles';

const protectedAdminRoleKeys = new Set(['admin', 'superadmin', 'clinicaladmin']);

type RoleCarrier = {
  roles?: string[];
  role?: string | null;
};

type PositionRoleLike = {
  name?: string | null;
  defaultRoleKey?: string | null;
  defaultRoleName?: string | null;
  roleKey?: string | null;
  roleName?: string | null;
};

type StaffRecordLike = RoleCarrier & {
  email?: string | null;
  positionType?: PositionRoleLike | null;
  user?: RoleCarrier & {
    email?: string | null;
  };
};

function compactRoleKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function containsAdminWord(value: string) {
  return /\b(admin|administrator)\b/i.test(value.replace(/[_-]+/g, ' '));
}

function isProtectedAdminEmail(value?: string | null) {
  if (!value) return false;

  const localPart = value.split('@')[0] ?? '';
  return containsAdminWord(localPart);
}

export function isSuperAdmin(roles: string[] = []) {
  return hasAnyRole(roles, ['Super Admin']);
}

export function isProtectedAdminRole(value?: string | null) {
  if (!value) return false;

  const normalizedValue = normalizeRoleName(value);
  return (
    protectedAdminRoleKeys.has(compactRoleKey(value)) ||
    protectedAdminRoleKeys.has(compactRoleKey(normalizedValue)) ||
    containsAdminWord(value)
  );
}

export function filterProtectedAdminRoles<T extends string>(roles: T[], allowProtected: boolean) {
  return allowProtected ? roles : roles.filter((role) => !isProtectedAdminRole(role));
}

export function hasProtectedAdminRole(roles: string[] = []) {
  return roles.some(isProtectedAdminRole);
}

export function isProtectedStaffPosition(position?: PositionRoleLike | null) {
  if (!position) return false;

  return [
    position.defaultRoleKey,
    position.defaultRoleName,
    position.roleKey,
    position.roleName,
    position.name,
  ].some(isProtectedAdminRole);
}

export function isProtectedStaffRecord(staff?: StaffRecordLike | null) {
  if (!staff) return false;

  return (
    hasProtectedAdminRole(staff.roles) ||
    isProtectedAdminRole(staff.role) ||
    hasProtectedAdminRole(staff.user?.roles) ||
    isProtectedAdminRole(staff.user?.role) ||
    isProtectedStaffPosition(staff.positionType) ||
    isProtectedAdminEmail(staff.user?.email ?? staff.email)
  );
}

export function canManageProtectedAdminTargets(roles: string[] = []) {
  return isSuperAdmin(roles);
}
