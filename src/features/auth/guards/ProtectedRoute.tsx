import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

function BootstrapSkeleton() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-surface" />
      </div>
    </div>
  );
}

export default function ProtectedRoute() {
  const location = useLocation();
  const { accessToken, user, status } = useAppSelector((state) => state.auth);

  if (status === 'idle' || status === 'loading') {
    return <BootstrapSkeleton />;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
