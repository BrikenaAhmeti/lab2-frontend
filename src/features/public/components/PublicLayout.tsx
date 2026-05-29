import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import type { ReactNode } from 'react';

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
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/medsphere.png" alt="MedSphere" className="h-10 w-10 rounded-lg object-cover" loading="lazy" decoding="async" />
            <span className="text-base font-semibold">MedSphere</span>
          </Link>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'rounded-lg px-3 py-2 transition',
                  isActive(location.pathname, link.to)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link className="rounded-lg px-3 py-2 text-primary hover:bg-primary/10" to="/login">
              Sign in
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>MedSphere</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/register" className="hover:text-foreground">Patient registration</Link>
            <Link to="/login" className="hover:text-foreground">Staff portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
