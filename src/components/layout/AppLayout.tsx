import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@/ui/atoms/Button';
import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { authApi } from '@/lib/api/auth-api';
import { clearSession } from '@/features/auth/authSlice';
import { clearPersistedSession } from '@/features/auth/useAuthBootstrap';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';

const navItems = [
  { to: '/dashboard', labelKey: 'auth.navDashboard' },
  { to: '/dashboard/profile', labelKey: 'auth.navProfile' },
  { to: '/dashboard/sessions', labelKey: 'auth.navSessions' },
  { to: '/dashboard/departments', labelKey: 'auth.navDepartments' },
  { to: '/dashboard/users', labelKey: 'auth.navUsers', requiresUserAdmin: true },
  { to: '/dashboard/doctor', labelKey: 'auth.navDoctor' },
  { to: '/dashboard/nurse', labelKey: 'auth.navNurse' },
  { to: '/dashboard/lab', labelKey: 'auth.navLab' },
  { to: '/dashboard/pharmacy', labelKey: 'auth.navPharmacy' },
  { to: '/dashboard/reception', labelKey: 'auth.navReception' },
  { to: '/dashboard/patient', labelKey: 'auth.navPatient' },
];

export default function AppLayout() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const roles = user?.roles ?? [];
  const permissions = user?.permissions ?? [];
  const canManageUsers =
    hasAnyRole(roles, ['Admin', 'Super Admin']) ||
    hasAnyPermission(permissions, ['users:create', 'users:read'], 'any');
  const visibleNavItems = navItems.filter((item) => !item.requiresUserAdmin || canManageUsers);

  const onLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      dispatch(clearSession());
      clearPersistedSession();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card/90 p-5 backdrop-blur-xl lg:block">
          <Link to="/dashboard" className="mb-8 flex items-center gap-3">
            <img src="/medsphere.png" alt="MedSphere" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-lg font-semibold tracking-wide text-foreground">MedSphere</p>
              <p className="text-xs text-muted">Healthcare Operations</p>
            </div>
          </Link>

          <nav className="space-y-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  isActive
                    ? 'block rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground shadow-soft'
                    : 'block rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground'
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">{t('auth.topbarLabel')}</p>
                <h1 className="text-xl font-semibold text-foreground">{user?.email ?? 'MedSphere'}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LanguageSwitch />
                <ThemeToggle />
                <Button variant="danger" onClick={onLogout}>{t('auth.logout')}</Button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
