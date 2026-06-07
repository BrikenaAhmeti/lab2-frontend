import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useAppSelector } from '@/app/hooks';

const navItems = [
  { to: '/app', label: 'Overview' },
  { to: '/app/transactions', label: 'Transactions' },
  { to: '/app/tan-transactions', label: 'Live Query' },
];

export default function AppLayout() {
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role || localStorage.getItem('role') || 'admin';

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-border bg-card/90 p-5 backdrop-blur-xl lg:block">
          <div className="mb-8 flex items-center gap-3">
            <img src="/medsphere.png" alt="MedSphere" className="h-11 w-11 rounded-xl object-cover" loading="lazy" decoding="async" />
            <div>
              <p className="text-lg font-semibold tracking-wide text-foreground">MedSphere</p>
              <p className="text-xs text-muted">Healthcare Operations</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  clsx(
                    'block rounded-xl px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted hover:bg-surface hover:text-foreground'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 panel bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Active Role</p>
            <p className="mt-2 text-sm font-semibold capitalize text-foreground">{role}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Dashboard</p>
                <h1 className="text-xl font-semibold text-foreground">Good evening, {user?.name ?? 'Team'}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <LanguageSwitch />
                <ThemeToggle />
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
