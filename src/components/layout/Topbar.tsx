import { Menu } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { toggleSidebar } from '@/features/ui/uiSlice';
import type { PortalConfig } from '@/layouts/portalConfig';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

export default function Topbar({ portal }: { portal: PortalConfig }) {
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-foreground transition hover:bg-card lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">{portal.eyebrow}</p>
            <h1 className="truncate text-lg font-semibold text-foreground md:text-xl">{portal.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
