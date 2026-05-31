import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { resolveUserPortalPath } from '@/features/auth/utils/roles';

export default function RoleRedirect() {
  const user = useAppSelector((state) => state.auth.user);
  return <Navigate to={resolveUserPortalPath(user)} replace />;
}
