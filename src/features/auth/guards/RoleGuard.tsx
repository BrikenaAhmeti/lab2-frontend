import { type ReactNode } from 'react';
import { useAppSelector } from '@/app/hooks';
import Forbidden from '@/components/common/Forbidden';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const allowed = roles.some((role) => allowedRoles.includes(role));

  if (!allowed) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
