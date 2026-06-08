import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Building2,
  CalendarPlus,
  ClipboardList,
  Home,
  Info,
  LogIn,
  Menu,
  PhoneCall,
  Stethoscope,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formatWorkingHoursLine } from '@/features/settings/workingHours';
import type { PublicSiteSettings } from '@/features/public/hooks/usePublicSiteSettings';

const links: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: Info },
  { to: '/departments', label: 'Departments', icon: Building2 },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/services', label: 'Services', icon: ClipboardList },
  { to: '/contact', label: 'Contact', icon: PhoneCall },
];

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname.startsWith(to);
}

interface PublicLayoutProps {
  children: ReactNode;
  siteSettings: PublicSiteSettings;
}

export default function PublicLayout({ children, siteSettings }: PublicLayoutProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hoursPreview = siteSettings.workingHours.filter((row) => row.isOpen).slice(0, 3);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setIsMenuOpen(false)}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cobalt-900 p-1.5 shadow-soft">
                <img src="/medsphere.png" alt="" className="h-full w-full rounded-lg bg-white object-cover" loading="lazy" decoding="async" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold leading-5 text-foreground">{siteSettings.facilityName}</span>
                <span className="block truncate text-xs font-medium text-muted">{siteSettings.tagline}</span>
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card lg:hidden"
              aria-controls="public-mobile-navigation"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
          <div id="public-mobile-navigation" className={clsx('grid gap-2 border-t border-border/80 pt-3 text-sm lg:hidden', !isMenuOpen && 'hidden')}>
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(location.pathname, link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setIsMenuOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition',
                    active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-primary transition hover:bg-primary/10"
              to="/login"
              onClick={() => setIsMenuOpen(false)}
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Portal</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-lg bg-cobalt-900 px-3.5 py-2.5 font-semibold text-white shadow-soft transition hover:bg-cobalt-800"
              to="/book-appointment"
              onClick={() => setIsMenuOpen(false)}
            >
              <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Book</span>
            </Link>
          </div>
          <div className="hidden items-center gap-0.5 text-sm lg:flex xl:gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(location.pathname, link.to);

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium transition xl:px-3',
                    active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface hover:text-foreground'
                  )}
                >
                  <Icon className="hidden h-4 w-4 xl:block" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            <Link className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-primary transition hover:bg-primary/10 xl:px-3" to="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Portal</span>
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-cobalt-900 px-3 py-2 font-semibold text-white shadow-soft transition hover:bg-cobalt-800 xl:px-3.5" to="/book-appointment">
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              <span>Book</span>
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="bg-cobalt-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.15fr_0.8fr_0.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
                <img src="/medsphere.png" alt="" className="h-full w-full rounded-lg object-cover" loading="lazy" decoding="async" />
              </span>
              <div>
                <p className="font-semibold">{siteSettings.facilityName}</p>
                <p className="text-sm text-white/65">{siteSettings.tagline}</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
              {siteSettings.description}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Explore</h2>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <Link to="/departments" className="hover:text-white">Departments</Link>
              <Link to="/services" className="hover:text-white">Services</Link>
              <Link to="/doctors" className="hover:text-white">Care team</Link>
              <Link to="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Access</h2>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              <Link to="/book-appointment" className="hover:text-white">Book appointment</Link>
              <Link to="/register" className="hover:text-white">Patient registration</Link>
              <Link to="/login" className="hover:text-white">Secure portal</Link>
              <Link to="/about" className="hover:text-white">About {siteSettings.facilityName}</Link>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Contact</h2>
            <div className="mt-4 grid gap-2 text-sm text-white/70">
              {siteSettings.phone ? <a href={`tel:${siteSettings.phone}`} className="hover:text-white">{siteSettings.phone}</a> : null}
              {siteSettings.email ? <a href={`mailto:${siteSettings.email}`} className="hover:text-white">{siteSettings.email}</a> : null}
              {siteSettings.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {hoursPreview.map((row) => (
                <p key={row.day}>{formatWorkingHoursLine(row)}</p>
              ))}
              {!siteSettings.phone && !siteSettings.email && siteSettings.addressLines.length === 0 && hoursPreview.length === 0 ? (
                <Link to="/contact" className="hover:text-white">Send a question</Link>
              ) : null}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-white/48 md:flex-row md:items-center md:justify-between">
            <p>{siteSettings.facilityName} Healthcare Management Platform</p>
            <p>Public content is separate from protected patient data.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
