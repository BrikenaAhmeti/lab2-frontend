import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission } from '@/features/auth/utils/permission';

describe('permission utility', () => {
  const permissions = [
    'patients:read:own',
    'patients:read:department',
    'departments:manage:all',
    'appointments:read',
  ];

  it('resolves scoped permissions correctly', () => {
    expect(hasPermission(permissions, 'patients:read', 'own')).toBe(true);
    expect(hasPermission(permissions, 'patients:read', 'department')).toBe(true);
    expect(hasPermission(permissions, 'patients:read', 'all')).toBe(false);
    expect(hasPermission(permissions, 'departments:manage', 'all')).toBe(true);
  });

  it('supports all and any modes', () => {
    expect(hasAnyPermission(permissions, ['patients:read:department', 'departments:manage:all'], 'all')).toBe(true);
    expect(hasAnyPermission(permissions, ['users:create', 'appointments:read:own'], 'any')).toBe(true);
    expect(hasAnyPermission(permissions, ['users:create', 'billing:write:all'], 'any')).toBe(false);
  });
});
