import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { getUserRoleNames, resolvePortalPath } from '@/features/auth/utils/roles';

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

export default function PortalRedirect({ fallbackPath = '/' }: { fallbackPath?: string }) {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const destination = resolvePortalPath(getUserRoleNames(user));
  const target = normalizePath(destination) === normalizePath(location.pathname)
    ? fallbackPath
    : destination;

  return <Navigate to={target} replace state={{ deniedFrom: location }} />;
}
