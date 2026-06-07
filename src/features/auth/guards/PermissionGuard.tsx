import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import PortalRedirect from './PortalRedirect';
import { hasAnyPermission } from '../utils/permission';

interface PermissionGuardProps {
  requiredPermissions: string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
}

export default function PermissionGuard({
  requiredPermissions,
  mode = 'all',
  fallback = null,
  children,
}: PermissionGuardProps) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const allowed = hasAnyPermission(permissions, requiredPermissions, mode);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function PermissionRouteGuard(props: Omit<PermissionGuardProps, 'fallback'>) {
  return <PermissionGuard {...props} fallback={<PortalRedirect />} />;
}
