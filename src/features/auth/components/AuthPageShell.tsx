import { CalendarCheck, ChevronDown, FileText, Globe2, HeartPulse, Home, LockKeyhole, ShieldCheck } from 'lucide-react';
import i18n from 'i18next';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  compact?: boolean;
}

const careFeatures = [
  {
    title: 'Secure & Private',
    description: 'Enterprise-grade protection for your health data.',
    Icon: LockKeyhole,
  },
  {
    title: 'Smart Scheduling',
    description: 'Book appointments and manage reminders with ease.',
    Icon: CalendarCheck,
  },
  {
    title: 'Connected Records',
    description: 'Access medical history and test results in one place.',
    Icon: FileText,
  },
];

export default function AuthPageShell({ eyebrow, title, subtitle, children, compact = false }: AuthPageShellProps) {
  const { t } = useTranslation('common');
  const currentLanguage = (i18n.language || 'en').slice(0, 2).toLowerCase();
  const backToWebsiteLabel = t('auth.backToWebsite', { defaultValue: 'Back to website' });

  return (
    <main className="min-h-screen bg-white text-foreground">
      <div
        className={clsx(
          'grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-[minmax(0,1.02fr)_minmax(30rem,0.98fr)]',
          !compact && 'xl:grid-cols-[minmax(0,0.92fr)_minmax(34rem,1.08fr)]'
        )}
      >
          <section className="relative hidden overflow-hidden bg-[#06245d] text-white lg:flex">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(10,44,110,0.9),rgba(3,24,67,1))]" aria-hidden="true" />
            <div className="absolute inset-x-12 top-1/2 h-px bg-cyan-300/20" aria-hidden="true" />
            <div className="relative flex w-full flex-col p-10 xl:p-12">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/10 p-1.5 ring-1 ring-white/25">
                  <img src="/medsphere.png" alt="" className="h-full w-full rounded-lg object-cover" loading="eager" decoding="async" />
                </span>
                <div>
                  <p className="text-2xl font-bold uppercase leading-6">MEDSPHERE</p>
                  <p className="text-sm font-medium text-white/78">Health. Connected.</p>
                </div>
              </div>

              <div className="mt-16 max-w-xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>AI-Powered. Human-Centered Care.</span>
                </div>
                <h1 className="text-5xl font-bold leading-tight">
                  Welcome Back to <span className="text-cyan-300">MedSphere</span>
                </h1>
                <p className="mt-5 max-w-md text-lg leading-8 text-white/78">
                  Sign in to access your health dashboard, manage appointments, and connect with your care team.
                </p>
              </div>

              <div className="mt-10 grid max-w-xl gap-5">
                {careFeatures.map(({ title: featureTitle, description, Icon }) => (
                  <div key={featureTitle} className="flex items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-300/12 text-cyan-100">
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-base font-semibold text-white">{featureTitle}</span>
                      <span className="mt-1 block max-w-sm text-sm leading-6 text-white/72">{description}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-100">
                  <HeartPulse size={22} aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-white/75">
                  MedSphere keeps care teams, patients, and records connected through one secure portal.
                </p>
              </div>
            </div>
          </section>

          <section className="flex min-h-[calc(100vh-1.5rem)] flex-col bg-white px-4 py-5 sm:min-h-[calc(100vh-2rem)] sm:px-8 lg:min-h-[calc(100vh-2.5rem)] lg:px-10">
            <div className={clsx('w-full', compact ? 'max-w-xl' : 'max-w-4xl')}>
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <Link
                    to="/"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-cobalt-950/70 transition hover:border-cobalt-200 hover:bg-cobalt-50 hover:text-cobalt-700"
                  >
                    <Home size={16} aria-hidden="true" />
                    {backToWebsiteLabel}
                  </Link>
                </div>
                <label
                  htmlFor="auth-language"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-cobalt-950/70 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.5)] transition hover:border-cobalt-200 hover:bg-cobalt-50 hover:text-cobalt-700"
                >
                  <Globe2 size={16} aria-hidden="true" />
                  <select
                    id="auth-language"
                    value={currentLanguage === 'de' ? 'de' : 'en'}
                    onChange={(event) => i18n.changeLanguage(event.target.value)}
                    className="cursor-pointer appearance-none bg-transparent pr-5 text-sm font-semibold outline-none"
                    aria-label="Language"
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <ChevronDown size={15} className="-ml-5 pointer-events-none" aria-hidden="true" />
                </label>
              </div>

              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-soft ring-1 ring-cobalt-100">
                  <img src="/medsphere.png" alt="MedSphere" className="h-full w-full rounded-lg object-cover" loading="eager" decoding="async" />
                </span>
                <span>
                  <span className="block text-lg font-bold uppercase leading-5 text-cobalt-950">MEDSPHERE</span>
                  <span className="block text-xs font-medium text-cobalt-900/75">Health. Connected.</span>
                </span>
              </div>

              <div className="mb-7">
                <p className="text-sm font-semibold text-cobalt-600">{eyebrow}</p>
                <h2 className="mt-2 text-3xl font-bold leading-tight text-cobalt-950">{title}</h2>
                <p className="mt-2 text-base leading-7 text-cobalt-950/65">{subtitle}</p>
              </div>
              {children}
            </div>
          </section>
      </div>
    </main>
  );
}
