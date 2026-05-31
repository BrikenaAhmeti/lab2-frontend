import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import PortalRedirect from './PortalRedirect';
import { hasAnyRole } from '@/features/auth/utils/permission';
import { getUserRoleNames } from '@/features/auth/utils/roles';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const user = useAppSelector((state) => state.auth.user);
  const roles = getUserRoleNames(user);
  const allowed = hasAnyRole(roles, allowedRoles);

  if (!allowed) {
    return <PortalRedirect />;
  }

  return <>{children}</>;
}
