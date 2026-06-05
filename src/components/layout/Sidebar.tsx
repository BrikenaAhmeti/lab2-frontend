import clsx from 'clsx';
import i18n from 'i18next';
import {
  Activity,
  BadgeHelp,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Mic,
  Moon,
  Monitor,
  PackageSearch,
  Pill,
  Search,
  Settings,
  Stethoscope,
  Sun,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closeSidebar } from '@/features/ui/uiSlice';
import { hasAnyPermission, hasAnyRole } from '@/features/auth/utils/permission';
import ChatNavUnreadBadge from '@/features/chat/components/ChatNavUnreadBadge';
import { useThemeMode } from '@/hooks/useThemeMode';
import type { PortalConfig, PortalNavItem } from '@/layouts/portalConfig';

function canSeeItem(item: PortalNavItem, permissions: string[], roles: string[]) {
  if (!item.requiredPermissions?.length) return true;
  if (hasAnyRole(roles, ['Admin', 'Super Admin'])) return true;
  return hasAnyPermission(permissions, item.requiredPermissions, 'any');
}

const navIcons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Departments: Building2,
  Patients: Users,
  Inventory: PackageSearch,
  Billing: CreditCard,
  Reports: FileText,
  'Voice AI Logs': Mic,
  'Advanced Search': Search,
  Messages: MessageSquare,
  Feedback: BadgeHelp,
  'Contact Inbox': Mail,
  Users,
  'Service Catalog': ClipboardList,
  'Staff Position Types': BookOpen,
  Settings,
  'Staff Directory': Stethoscope,
  'Schedule Overview': CalendarDays,
  Pages: FileText,
  Banners: Bell,
  Profile: UserRound,
  Sessions: Activity,
  'Book Appointment': CalendarDays,
  'My Appointments': CalendarDays,
  Appointments: CalendarDays,
  'Medical Records': ClipboardList,
  'Lab Results': FlaskConical,
  Prescriptions: Pill,
  'Lab Reviews': FlaskConical,
  Queue: Pill,
};

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

function SidebarControls() {
  const { mode, setMode } = useThemeMode();
  const currentLanguage = i18n.language.slice(0, 2).toLowerCase();
  const themeOptions = [
    { mode: 'light' as const, label: 'Light', icon: Sun },
    { mode: 'dark' as const, label: 'Dark', icon: Moon },
    { mode: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-1">
        <div className="flex items-center gap-1">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className={clsx(
                'h-7 rounded-md px-2 text-[11px] font-semibold transition',
                currentLanguage === language.code
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              )}
              onClick={() => i18n.changeLanguage(language.code)}
              aria-label={`Change language to ${language.label}`}
              title={language.label}
            >
              {language.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {themeOptions.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.mode}
                type="button"
                className={clsx(
                  'grid h-7 w-7 place-items-center rounded-md transition',
                  mode === option.mode
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )}
                onClick={() => setMode(option.mode)}
                aria-label={`Use ${option.label.toLowerCase()} theme`}
                title={option.label}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ portal }: { portal: PortalConfig }) {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const user = useAppSelector((state) => state.auth.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];

  const content = (
    <div className="flex h-full flex-col bg-[#06264a] text-slate-100">
      <Link to={portal.homePath} className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <img src="/medsphere.png" alt="MedSphere" className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/15" loading="lazy" decoding="async" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-wide text-white">MedSphere</p>
          <p className="truncate text-xs text-cyan-100/75">{portal.title}</p>
        </div>
      </Link>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
        {portal.navGroups.map((group) => {
          const items = group.items.filter((item) => canSeeItem(item, permissions, roles));
          if (items.length === 0) return null;

          return (
            <section key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/55">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = navIcons[item.label] ?? LayoutDashboard;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end ?? item.to === portal.homePath}
                      onClick={() => dispatch(closeSidebar())}
                      className={({ isActive }) =>
                        clsx(
                          'flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition',
                          isActive
                            ? 'bg-cyan-400 text-slate-950 shadow-soft'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.to.endsWith('/messages') && <ChatNavUnreadBadge active={isActive} />}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>
      <SidebarControls />
    </div>
  );

  return (
    <>
      <aside className="hidden h-[100dvh] w-72 shrink-0 overflow-hidden border-r border-[#0b345f] bg-[#06264a] lg:sticky lg:top-0 lg:block">{content}</aside>
      <div className={clsx('fixed inset-0 z-40 lg:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute inset-0 bg-foreground/30"
          onClick={() => dispatch(closeSidebar())}
        />
        <aside className="relative h-full w-[min(18rem,calc(100vw-2rem))] border-r border-[#0b345f] shadow-panel">{content}</aside>
      </div>
    </>
  );
}
