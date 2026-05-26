import { useAppSelector } from '@/app/hooks';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';

export function useCmsAccess() {
  const user = useAppSelector((state) => state.auth.user);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];

  return {
    canManageCms: hasAnyRole(roles, ['Super Admin']) || hasAnyPermission(permissions, ['cms:edit'], 'any'),
  };
}
