import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';
import { hasAnyPermission } from '../utils/permission';

interface PermissionGuardProps {
  requiredPermissions: string[];
  mode?: 'any' | 'all';
  children: ReactNode;
}

export default function PermissionGuard({
  requiredPermissions,
  mode = 'all',
  children,
}: PermissionGuardProps) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const allowed = hasAnyPermission(permissions, requiredPermissions, mode);

  if (!allowed) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
