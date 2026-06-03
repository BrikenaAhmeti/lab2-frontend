import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarCheck,
  CircleCheck,
  ClipboardList,
  Clock3,
  HeartPulse,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Stethoscope,
  UserRound,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { formatWorkingHoursLine } from '@/features/settings/workingHours';
import { defaultPublicSiteSettings, usePublicSiteSettings } from '@/features/public/hooks/usePublicSiteSettings';

interface PublicPageIntroProps {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
}

interface IconCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

const trustStats = [
  { value: '24/7', label: 'digital access' },
  { value: '4', label: 'care steps connected' },
  { value: '1', label: 'patient record view' },
];

const homeHighlights: IconCard[] = [
  {
    icon: CalendarCheck,
    title: 'Smarter scheduling',
    body: 'Appointments, follow-ups, and visit context stay close together.',
  },
  {
    icon: ClipboardList,
    title: 'Clear clinical flow',
    body: 'Departments, doctors, services, and records share the same visual language.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    body: 'Public pages stay calm while portal work remains protected behind sign-in.',
  },
  {
    icon: MessageSquare,
    title: 'Connected updates',
    body: 'Patients and staff have clearer paths for questions, requests, and next steps.',
  },
];

const careAreas: IconCard[] = [
  {
    icon: HeartPulse,
    title: 'Primary care',
    body: 'Everyday visits, wellness checks, prevention, and long-term care planning.',
  },
  {
    icon: Stethoscope,
    title: 'Specialist consults',
    body: 'Focused visits with coordinated referrals and cleaner preparation.',
  },
  {
    icon: Activity,
    title: 'Diagnostics',
    body: 'Lab and review workflows designed to keep results easy to track.',
  },
  {
    icon: WalletCards,
    title: 'Billing clarity',
    body: 'A simple path from services to invoices, payments, and patient history.',
  },
];

const careSteps = [
  'Choose a service or department',
  'Share visit details once',
  'Meet the right care team',
  'Track results and follow-up',
];

const departmentCards: IconCard[] = [
  {
    icon: Building2,
    title: 'Front desk ready',
    body: 'Reception, department routing, and patient intake are designed as one flow.',
  },
  {
    icon: Activity,
    title: 'Clinical handoffs',
    body: 'Teams can move from appointment context to records without losing the thread.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational control',
    body: 'Administrative tools keep public information and portal activity separated.',
  },
];

const serviceGuide: IconCard[] = [
  {
    icon: Clock3,
    title: 'Predictable visit windows',
    body: 'Static service details help patients understand what to expect before booking.',
  },
  {
    icon: UserRound,
    title: 'Matched to the right team',
    body: 'Services connect patients to departments and qualified staff profiles.',
  },
  {
    icon: CircleCheck,
    title: 'Clean confirmation path',
    body: 'The appointment journey is easier when service, time, and details are visible.',
  },
];

const doctorGuide: IconCard[] = [
  {
    icon: Stethoscope,
    title: 'Profile-first browsing',
    body: 'Patients can scan specialty, department, and care focus without extra clutter.',
  },
  {
    icon: CalendarCheck,
    title: 'Availability aware',
    body: 'The page is ready for live schedules while still looking complete without them.',
  },
  {
    icon: MessageSquare,
    title: 'Follow-up friendly',
    body: 'Doctor discovery connects naturally with appointments and secure messaging.',
  },
];

function IconTile({ icon: Icon, className = '' }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ${className}`}>
      <Icon aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

function SectionHeading({ eyebrow, title, body }: PublicPageIntroProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-muted">{body}</p>
    </div>
  );
}

export function PublicPageIntro({ eyebrow, title, body, children }: PublicPageIntroProps) {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-end md:justify-between">
        <SectionHeading eyebrow={eyebrow} title={title} body={body} />
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </section>
  );
}

export function PublicHomeStaticSections() {
  return (
    <>
      <section className="relative overflow-hidden bg-cobalt-900 text-white">
        <img
          src="/images/auth/auth-container.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,31,71,0.96),rgba(8,66,96,0.84),rgba(12,105,112,0.62))]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/85">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Digital care coordination
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal sm:text-5xl md:text-6xl">MedSphere</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">
              A calmer way to connect appointments, care teams, services, and patient communication in one modern healthcare experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/book-appointment"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-cobalt-900 shadow-soft transition hover:bg-white/90"
              >
                Book appointment
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore services
              </Link>
            </div>
            <dl className="mt-10 grid max-w-xl gap-4 sm:grid-cols-3">
              {trustStats.map((stat) => (
                <div key={stat.label} className="border-l border-white/20 pl-4">
                  <dt className="text-sm text-white/70">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/95 p-4 text-cobalt-900 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/medsphere.png" alt="" className="h-10 w-10 rounded-lg bg-white object-cover" loading="lazy" decoding="async" />
                <div>
                  <p className="text-sm font-semibold">Book an Appointment</p>
                  <p className="text-xs text-slate-500">Smart scheduling assistant</p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Live</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[11px] font-medium text-slate-500 sm:grid-cols-4">
              {['Service', 'Date', 'Details', 'Confirm'].map((step, index) => (
                <div key={step} className="space-y-2">
                  <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${index < 3 ? 'bg-primary text-white' : 'bg-surface text-muted'}`}>
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">Selected service</p>
                  <p className="text-sm font-semibold">General consultation</p>
                </div>
                <Stethoscope aria-hidden="true" className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">Available time</p>
                  <p className="text-sm font-semibold">10:30 AM today</p>
                </div>
                <CalendarCheck aria-hidden="true" className="h-5 w-5 text-primary" />
              </div>
              <div className="grid grid-cols-2 gap-0 text-sm">
                <div className="border-r border-border px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">Duration</p>
                  <p className="mt-1 font-semibold">15 minutes</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <p className="mt-1 font-semibold text-success">Ready to confirm</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-lg bg-cobalt-900 px-4 py-3 text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/12">
                <PhoneCall aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">Voice-ready booking</p>
                <p className="text-xs text-white/70">Designed for quick patient requests.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {homeHighlights.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <IconTile icon={item.icon} />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionHeading
            eyebrow="Care journey"
            title="From first request to follow-up, every step has a place."
            body="The public website now gives patients a clearer first impression while the portal keeps the detailed clinical workflow behind secure access."
          />
          <div className="rounded-lg border border-border bg-background p-5">
            <ol className="grid gap-3 sm:grid-cols-2">
              {careSteps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 text-sm font-medium text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            eyebrow="Care areas"
            title="Care information that feels prepared from the first visit."
            body="Patients can quickly understand common care paths, service types, and next steps before they enter the portal."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {careAreas.map((item) => (
              <article key={item.title} className="rounded-lg border border-border bg-card p-5">
                <IconTile icon={item.icon} />
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function PublicAboutStaticSections() {
  return (
    <>
      <PublicPageIntro
        eyebrow="About"
        title="A connected healthcare workspace with a cleaner public face."
        body="MedSphere brings patient communication, appointments, departments, records, and operations into a calmer digital experience for care teams and patients."
      />
      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
          {departmentCards.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-soft">
              <IconTile icon={item.icon} />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-cobalt-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Care philosophy</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">Quiet systems make better care feel easier.</h2>
          </div>
          <p className="text-sm leading-7 text-white/78">
            The site now gives visitors a useful, modern first impression with clear care paths, calm language, and visual structure that supports both patients and staff.
          </p>
        </div>
      </section>
    </>
  );
}

export function PublicDepartmentsStaticSections() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          eyebrow="Department model"
          title="Departments are presented as coordinated care areas."
          body="Patients can orient themselves around intake, handoffs, and care coordination before choosing a specific service."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {departmentCards.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-background p-5">
              <IconTile icon={item.icon} />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicServicesStaticSections() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          eyebrow="Service planning"
          title="A clearer path from service discovery to appointment booking."
          body="Service information is organized around time, team fit, and the steps patients need before confirming a visit."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {serviceGuide.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-background p-5">
              <IconTile icon={item.icon} />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicDoctorsStaticSections() {
  return (
    <section className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeading
          eyebrow="Care team"
          title="Doctor discovery should feel calm, direct, and trustworthy."
          body="Profile cards and care-team guidance work together so patients can understand specialties, availability, and follow-up paths."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {doctorGuide.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-background p-5">
              <IconTile icon={item.icon} />
              <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicContactStaticSections() {
  const settingsQuery = usePublicSiteSettings();
  const siteSettings = settingsQuery.data ?? defaultPublicSiteSettings;
  const hours = siteSettings.workingHours.filter((row) => row.isOpen);
  const cards: IconCard[] = [
    {
      icon: PhoneCall,
      title: siteSettings.phone || siteSettings.email ? 'Call or email' : 'Contact support',
      body: [siteSettings.phone, siteSettings.email].filter(Boolean).join(' · ') || 'Use the contact form for non-urgent questions and routing requests.',
    },
    {
      icon: CalendarCheck,
      title: 'Appointments',
      body: 'Patients can register first, then manage appointment details from the portal.',
    },
    {
      icon: siteSettings.addressLines.length > 0 ? Building2 : ShieldCheck,
      title: siteSettings.addressLines.length > 0 ? 'Visit information' : 'Privacy',
      body: siteSettings.addressLines.length > 0
        ? siteSettings.addressLines.join(', ')
        : 'Avoid sending sensitive medical details through the public contact form.',
    },
  ];

  if (hours.length > 0) {
    cards.splice(1, 0, {
      icon: Clock3,
      title: 'Working hours',
      body: hours.map(formatWorkingHoursLine).join(' · '),
    });
  }

  return (
    <section className="bg-card">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => (
          <article key={item.title} className="rounded-lg border border-border bg-background p-5">
            <IconTile icon={item.icon} />
            <h2 className="mt-4 text-base font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
