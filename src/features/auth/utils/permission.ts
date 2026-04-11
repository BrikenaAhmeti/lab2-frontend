export type PermissionScope = 'own' | 'department' | 'all';

interface ParsedPermission {
  resourceAction: string;
  scope: PermissionScope;
}

const scopeRank: Record<PermissionScope, number> = {
  own: 1,
  department: 2,
  all: 3,
};

function normalizeScope(scope?: string): PermissionScope {
  if (scope === 'department' || scope === 'all' || scope === 'own') return scope;
  return 'own';
}

function parsePermission(permission: string): ParsedPermission {
  const parts = permission.split(':');
  if (parts.length < 2) {
    return { resourceAction: permission, scope: 'own' };
  }

  const maybeScope = parts[parts.length - 1];
  if (maybeScope === 'own' || maybeScope === 'department' || maybeScope === 'all') {
    return {
      resourceAction: parts.slice(0, -1).join(':'),
      scope: maybeScope,
    };
  }

  return {
    resourceAction: parts.join(':'),
    scope: 'own',
  };
}

export function hasPermission(
  userPermissions: string[],
  resourceAction: string,
  requiredScope?: PermissionScope
): boolean {
  const requiredRank = scopeRank[normalizeScope(requiredScope)];

  return userPermissions.some((permission) => {
    const parsed = parsePermission(permission);
    if (parsed.resourceAction !== resourceAction) return false;
    return scopeRank[parsed.scope] >= requiredRank;
  });
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
  mode: 'any' | 'all' = 'all'
): boolean {
  if (requiredPermissions.length === 0) return true;
  if (mode === 'any') {
    return requiredPermissions.some((perm) => {
      const parsed = parsePermission(perm);
      return hasPermission(userPermissions, parsed.resourceAction, parsed.scope);
    });
  }

  return requiredPermissions.every((perm) => {
    const parsed = parsePermission(perm);
    return hasPermission(userPermissions, parsed.resourceAction, parsed.scope);
  });
}
