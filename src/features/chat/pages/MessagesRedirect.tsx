import { Navigate, useParams } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectAuthUser } from '@/features/auth/authSelectors';
import { resolvePortalPath } from '@/features/auth/utils/roles';

export default function MessagesRedirect() {
  const { roomId } = useParams();
  const user = useAppSelector(selectAuthUser);
  const portalPath = resolvePortalPath(user?.roles ?? []);
  const target = roomId ? `${portalPath}/messages/${roomId}` : `${portalPath}/messages`;

  return <Navigate to={target} replace />;
}
