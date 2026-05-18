import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { resolvePortalPath } from '@/features/auth/utils/roles';

export { resolvePortalPath };

export default function RoleRedirect() {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  return <Navigate to={resolvePortalPath(roles)} replace />;
}
