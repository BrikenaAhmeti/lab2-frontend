import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import PortalRedirect from './PortalRedirect';
import { hasPermission, type PermissionScope } from '../utils/permission';

interface ScopeGuardProps {
  resourceAction: string;
  requiredScope?: PermissionScope;
  children: ReactNode;
}

export default function ScopeGuard({ resourceAction, requiredScope, children }: ScopeGuardProps) {
  const permissions = useAppSelector((state) => state.auth.user?.permissions ?? []);
  const allowed = hasPermission(permissions, resourceAction, requiredScope);

  if (!allowed) {
    return <PortalRedirect />;
  }

  return <>{children}</>;
}
