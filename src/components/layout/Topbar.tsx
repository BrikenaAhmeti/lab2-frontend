import ThemeToggle from '@/ui/molecules/ThemeToggle';
import LanguageSwitch from '@/ui/molecules/LanguageSwitch';
import { useAppDispatch } from '@/app/hooks';
import { toggleSidebar } from '@/features/ui/uiSlice';
import type { PortalConfig } from '@/layouts/portalConfig';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

export default function Topbar({ portal }: { portal: PortalConfig }) {
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-lg font-semibold text-foreground lg:hidden"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            =
          </button>
          <div className="min-w-0">
            <p className="text-sm text-muted">{portal.eyebrow}</p>
            <h1 className="truncate text-xl font-semibold text-foreground">{portal.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitch />
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
