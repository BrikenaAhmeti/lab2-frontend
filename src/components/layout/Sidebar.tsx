import clsx from 'clsx';
import { Link, NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closeSidebar } from '@/features/ui/uiSlice';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import type { PortalConfig, PortalNavItem } from '@/layouts/portalConfig';

function canSeeItem(item: PortalNavItem, permissions: string[], roles: string[]) {
  if (!item.requiredPermissions?.length) return true;
  if (hasAnyRole(roles, ['Admin', 'Super Admin'])) return true;
  return hasAnyPermission(permissions, item.requiredPermissions, 'any');
}

export default function Sidebar({ portal }: { portal: PortalConfig }) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];

  const content = (
    <div className="flex h-full flex-col bg-card">
      <Link to={portal.homePath} className="flex items-center gap-3 border-b border-border p-5">
        <img src="/medsphere.png" alt="MedSphere" className="h-10 w-10 rounded-lg object-cover" />
        <div>
          <p className="text-lg font-semibold text-foreground">MedSphere</p>
          <p className="text-xs text-muted">{portal.title}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {portal.navGroups.map((group) => {
          const items = group.items.filter((item) => canSeeItem(item, permissions, roles));
          if (items.length === 0) return null;

          return (
            <section key={group.label}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase text-muted">{group.label}</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end ?? item.to === portal.homePath}
                    onClick={() => dispatch(closeSidebar())}
                    className={({ isActive }) =>
                      clsx(
                        'block rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted hover:bg-surface hover:text-foreground'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </section>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">{content}</aside>
      <div className={clsx('fixed inset-0 z-40 lg:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute inset-0 bg-foreground/30"
          onClick={() => dispatch(closeSidebar())}
        />
        <aside className="relative h-full w-72 border-r border-border shadow-panel">{content}</aside>
      </div>
    </>
  );
}
