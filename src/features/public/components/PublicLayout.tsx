import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { CalendarPlus, LogIn } from 'lucide-react';
import { formatWorkingHoursLine } from '@/features/settings/workingHours';
import type { PublicSiteSettings } from '@/features/public/hooks/usePublicSiteSettings';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/departments', label: 'Departments' },
  { to: '/doctors', label: 'Doctors' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
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
  const hoursPreview = siteSettings.workingHours.filter((row) => row.isOpen).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cobalt-900 p-1.5 shadow-soft">
              <img src="/medsphere.png" alt="" className="h-full w-full rounded-lg bg-white object-cover" loading="lazy" decoding="async" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-5 text-foreground">{siteSettings.facilityName}</span>
              <span className="block text-xs font-medium text-muted">{siteSettings.tagline}</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'rounded-lg px-3 py-2 font-medium transition',
                  isActive(location.pathname, link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-primary hover:bg-primary/10" to="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Portal</span>
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-cobalt-900 px-3.5 py-2 font-semibold text-white shadow-soft hover:bg-cobalt-800" to="/book-appointment">
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
