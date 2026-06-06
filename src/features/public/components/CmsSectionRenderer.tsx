import {
  Activity,
  ArrowRight,
  Baby,
  BadgeCheck,
  BarChart3,
  Bot,
  Brain,
  CalendarCheck,
  ChevronRight,
  Compass,
  CreditCard,
  FileLock2,
  FileText,
  FolderHeart,
  FolderLock,
  HeartPulse,
  LifeBuoy,
  LockKeyhole,
  LucideIcon,
  MessageSquare,
  MessagesSquare,
  Mic,
  Network,
  Phone,
  Route,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Video,
} from 'lucide-react';
import type { CmsSection } from '@/lib/api/cms-api';
import { usePublicStaffList } from '@/features/staff/hooks/useStaff';
import PublicDoctorCard from './PublicDoctorCard';
import { isDoctorProfile } from '../utils/publicStaffPresentation';
import { safeHref, safeImageSrc } from '@/utils/safeUrl';

type ContentMap = Record<string, unknown>;

const iconMap: Record<string, LucideIcon> = {
  activity: Activity,
  'arrow-right-circle': ArrowRight,
  baby: Baby,
  'badge-check': BadgeCheck,
  'bar-chart-3': BarChart3,
  bot: Bot,
  brain: Brain,
  calendar: CalendarCheck,
  compass: Compass,
  'credit-card': CreditCard,
  'file-lock-2': FileLock2,
  'file-text': FileText,
  'folder-heart': FolderHeart,
  'folder-lock': FolderLock,
  'heart-pulse': HeartPulse,
  'layout-dashboard': BarChart3,
  'life-buoy': LifeBuoy,
  'lock-keyhole': LockKeyhole,
  'message-square': MessageSquare,
  'messages-square': MessagesSquare,
  mic: Mic,
  network: Network,
  phone: Phone,
  route: Route,
  'scan-line': ScanLine,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
  star: Star,
  stethoscope: Stethoscope,
  video: Video,
};

function isMap(value: unknown): value is ContentMap {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberText(value: unknown) {
  if (typeof value === 'number') return String(value);
  return text(value);
}

function asArray(content: unknown, key: string) {
  if (!isMap(content)) return [];
  const value = content[key];
  return Array.isArray(value) ? value.filter(isMap) : [];
}

function contentItems(content: unknown) {
  const value = isMap(content) ? content.items : content;
  return Array.isArray(value) ? value.filter(isMap) : [];
}

function contentText(content: unknown, key: string) {
  return isMap(content) ? text(content[key]) : null;
}

function contentRecord(content: unknown, key: string) {
  return isMap(content) && isMap(content[key]) ? content[key] : null;
}

function IconBadge({ icon }: { icon?: unknown }) {
  const Icon = iconMap[text(icon) ?? ''] ?? ShieldCheck;

  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function SectionShell({
  children,
  tone = 'light',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'surface' | 'dark';
  className?: string;
}) {
  const toneClass =
    tone === 'dark'
      ? 'bg-cobalt-900 text-white'
      : tone === 'surface'
        ? 'bg-surface/80'
        : 'bg-background';

  return (
    <section className={`${toneClass} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">{children}</div>
    </section>
  );
}

function SectionHeading({
  section,
  eyebrow,
  center = false,
  dark = false,
}: {
  section: CmsSection;
  eyebrow?: string | null;
  center?: boolean;
  dark?: boolean;
}) {
  if (!section.title && !section.subtitle && !section.body && !eyebrow) {
    return null;
  }

  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? (
        <p className={`text-xs font-semibold uppercase tracking-normal ${dark ? 'text-med-200' : 'text-primary'}`}>
          {eyebrow}
        </p>
      ) : null}
      {section.title ? (
        <h2 className={`mt-3 text-2xl font-semibold tracking-normal sm:text-3xl md:text-4xl ${dark ? 'text-white' : 'text-foreground'}`}>
          {section.title}
        </h2>
      ) : null}
      {section.subtitle ? (
        <p className={`mt-4 text-base leading-8 md:text-lg ${dark ? 'text-white/78' : 'text-muted'}`}>{section.subtitle}</p>
      ) : null}
      {section.body ? (
        <p className={`mt-5 text-sm leading-7 md:text-base ${dark ? 'text-white/72' : 'text-muted'}`}>{section.body}</p>
      ) : null}
    </div>
  );
}

function Actions({ actions, dark = false }: { actions: ContentMap[]; dark?: boolean }) {
  if (actions.length === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {actions.map((action, index) => {
        const label = text(action.label) ?? 'Learn more';
        const href = safeHref(text(action.href)) ?? '#';
        const isPrimary = text(action.style) !== 'secondary';

        return (
          <a
            key={`${label}-${index}`}
            href={href}
            className={
              isPrimary
                ? 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90'
                : `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                    dark
                      ? 'border-white/30 bg-white/10 text-white hover:bg-white/15'
                      : 'border-border bg-card text-foreground hover:border-primary/40 hover:text-primary'
                  }`
            }
          >
            <span>{label}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}

function HeroSection({ section }: { section: CmsSection }) {
  const imageUrl = safeImageSrc(section.imageUrl) || '/medsphere-logo.png';
  const content = isMap(section.content) ? section.content : {};
  const actions = asArray(section.content, 'actions');
  const trustPills = Array.isArray(content.trustPills) ? content.trustPills.map(text).filter(Boolean) : [];
  const preview = contentRecord(section.content, 'preview');
  const panels = isMap(preview) && Array.isArray(preview.panels) ? preview.panels.filter(isMap) : [];
  const promptExamples = isMap(preview) && Array.isArray(preview.promptExamples) ? preview.promptExamples.map(text).filter(Boolean) : [];

  if (!section.title && !section.subtitle && !section.body && !section.imageUrl) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-cobalt-900 text-white">
      <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-42" loading="lazy" decoding="async" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,52,0.94),rgba(8,48,86,0.76),rgba(10,92,112,0.58))]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
        <div>
          {contentText(section.content, 'eyebrow') ? (
            <p className="text-xs font-semibold uppercase tracking-normal text-med-200">{contentText(section.content, 'eyebrow')}</p>
          ) : null}
          {section.title ? <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl md:text-6xl">{section.title}</h1> : null}
          {section.subtitle ? <p className="mt-5 max-w-2xl text-lg leading-8 text-white/86 md:text-xl">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">{section.body}</p> : null}
          <Actions actions={actions} dark />
          {trustPills.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {trustPills.map((pill) => (
                <span key={pill} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white/86">
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="rounded-lg border border-white/18 bg-white/12 p-4 shadow-2xl backdrop-blur-md">
          <div className="rounded-lg bg-white p-4 text-cobalt-900">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                  {isMap(preview) ? text(preview.assistantTitle) ?? 'AI Care Assistant' : 'AI Care Assistant'}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-cobalt-900">Connected patient guidance</h2>
              </div>
              <span className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                {isMap(preview) ? text(preview.assistantState) ?? 'Live' : 'Live'}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {panels.map((panel, index) => (
                <div key={`${text(panel.label) ?? index}`} className="rounded-lg bg-cobalt-50 px-3 py-4">
                  <p className="text-2xl font-semibold text-cobalt-900">{numberText(panel.value) ?? '0'}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{text(panel.label)}</p>
                </div>
              ))}
            </div>
            {promptExamples.length > 0 ? (
              <div className="mt-5 space-y-2">
                {promptExamples.slice(0, 3).map((prompt) => (
                  <div key={prompt} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <Mic className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

function FeatureGridSection({ section, items, tone = 'light' }: { section: CmsSection; items: ContentMap[]; tone?: 'light' | 'surface' }) {
  if (items.length === 0) return <SectionText section={section} />;

  return (
    <SectionShell tone={tone}>
      <SectionHeading section={section} eyebrow={contentText(section.content, 'eyebrow')} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <article key={`${text(item.title) ?? index}`} className="rounded-lg border border-border bg-card p-5 shadow-panel">
            <IconBadge icon={item.icon} />
            <h3 className="mt-5 text-lg font-semibold text-foreground">{text(item.title) ?? 'MedSphere capability'}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{text(item.description) ?? text(item.body)}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function ServiceCardsSection({ section }: { section: CmsSection }) {
  const services = asArray(section.content, 'services');

  if (services.length === 0) return <SectionText section={section} />;

  return (
    <SectionShell tone="surface">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading section={section} />
        <p className="max-w-xs text-sm leading-6 text-muted">
          Built for department-specific service catalogs, transparent durations, and patient-friendly explanations.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, index) => (
          <a
            key={`${text(service.title) ?? index}`}
            href={safeHref(text(service.href)) ?? '/services'}
            className="group rounded-lg border border-border bg-card p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft"
          >
            <div className="flex items-start justify-between gap-4">
              <IconBadge icon={service.icon} />
              <ChevronRight className="mt-2 h-5 w-5 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{text(service.title) ?? 'Service'}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{text(service.description)}</p>
          </a>
        ))}
      </div>
    </SectionShell>
  );
}

function DoctorCardsSection({ section }: { section: CmsSection }) {
  const filters = isMap(section.content) && Array.isArray(section.content.filters) ? section.content.filters.map(text).filter(Boolean) : [];
  const limitValue = Number(isMap(section.content) ? numberText(section.content.limit) ?? 0 : 0);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 4;
  const staffQuery = usePublicStaffList({ page: 1, limit: 24 });
  const doctors = (staffQuery.data?.items ?? []).filter(isDoctorProfile).slice(0, limit);

  if (staffQuery.isError) {
    return (
      <SectionShell>
        <SectionHeading section={section} />
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted">
          Public doctor profiles are not available right now.
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell>
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading section={section} />
        {filters.length > 0 ? (
          <div className="flex max-w-md flex-wrap gap-2">
            {filters.map((filter) => (
              <span key={filter} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted">
                {filter}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {staffQuery.isLoading
          ? Array.from({ length: Math.min(limit, 4) }).map((_, index) => (
              <div key={index} className="min-h-96 animate-pulse rounded-lg border border-border bg-card shadow-panel">
                <div className="h-40 bg-surface" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-surface" />
                  <div className="h-6 w-4/5 rounded bg-surface" />
                  <div className="h-16 rounded bg-surface" />
                </div>
              </div>
            ))
          : doctors.map((doctor, index) => <PublicDoctorCard key={doctor.id} staff={doctor} index={index} />)}
      </div>
      {!staffQuery.isLoading && doctors.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-card p-5 text-sm text-muted">
          No public doctor profiles are published yet.
        </div>
      ) : null}
    </SectionShell>
  );
}

function DepartmentCardsSection({ section }: { section: CmsSection }) {
  const departments = asArray(section.content, 'departments');

  if (departments.length === 0) return <SectionText section={section} />;

  return (
    <SectionShell tone="surface">
      <SectionHeading section={section} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department, index) => {
          const services = Array.isArray(department.services) ? department.services.map(text).filter(Boolean) : [];

          return (
            <article key={`${text(department.title) ?? index}`} className="rounded-lg border border-border bg-card p-5 shadow-panel">
              <div className="flex items-start gap-4">
                <IconBadge icon={department.icon} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{text(department.title) ?? 'Department'}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{text(department.description)}</p>
                </div>
              </div>
              {services.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span key={service} className="rounded-lg bg-surface px-2.5 py-1.5 text-xs text-muted">
                      {service}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}

function TimelineSection({ section }: { section: CmsSection }) {
  const steps = asArray(section.content, 'steps');

  if (steps.length === 0) return <SectionText section={section} />;

  return (
    <SectionShell>
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <SectionHeading section={section} />
        <div className="grid gap-4">
          {steps.map((step, index) => (
            <article key={`${text(step.title) ?? index}`} className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-border bg-card p-5 shadow-panel">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{text(step.title)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{text(step.description)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function ContactCardsSection({ section }: { section: CmsSection }) {
  const channels = asArray(section.content, 'channels');

  if (channels.length === 0) return <SectionText section={section} />;

  return (
    <SectionShell tone="surface">
      <SectionHeading section={section} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel, index) => (
          <article key={`${text(channel.title) ?? index}`} className="rounded-lg border border-border bg-card p-5 shadow-panel">
            <IconBadge icon={channel.icon} />
            <h3 className="mt-5 text-lg font-semibold text-foreground">{text(channel.title)}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{text(channel.description)}</p>
            <p className="mt-5 break-words text-sm font-semibold text-primary">{text(channel.value)}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function LocationPanelSection({ section }: { section: CmsSection }) {
  const address = contentRecord(section.content, 'address');
  const hours = asArray(section.content, 'hours');
  const highlights = isMap(section.content) && Array.isArray(section.content.highlights) ? section.content.highlights.map(text).filter(Boolean) : [];

  return (
    <SectionShell>
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <SectionHeading section={section} />
        <article className="rounded-lg border border-border bg-card p-6 shadow-panel">
          {address ? (
            <div>
              <h3 className="text-xl font-semibold text-foreground">{text(address.name) ?? 'MedSphere Medical Center'}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">
                {[text(address.street), text(address.city), text(address.region)].filter(Boolean).join(', ')}
              </p>
            </div>
          ) : null}
          {hours.length > 0 ? (
            <dl className="mt-6 grid gap-3">
              {hours.map((item, index) => (
                <div key={`${text(item.label) ?? index}`} className="flex items-center justify-between gap-4 rounded-lg bg-surface px-4 py-3 text-sm">
                  <dt className="text-muted">{text(item.label)}</dt>
                  <dd className="font-semibold text-foreground">{text(item.value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {highlights.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {highlights.map((highlight) => (
                <span key={highlight} className="rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                  {highlight}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </div>
    </SectionShell>
  );
}

function SectionText({ section }: { section: CmsSection }) {
  const imageUrl = safeImageSrc(section.imageUrl);

  if (!section.title && !section.subtitle && !section.body) {
    return null;
  }

  return (
    <SectionShell>
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionHeading section={section} />
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-80 w-full rounded-lg object-cover shadow-panel" loading="lazy" decoding="async" />
        ) : null}
      </div>
    </SectionShell>
  );
}

function CtaSection({ section }: { section: CmsSection }) {
  const actions = asArray(section.content, 'actions');

  if (!section.title && !section.body && actions.length === 0) {
    return null;
  }

  return (
    <SectionShell tone="dark">
      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <SectionHeading section={section} dark />
        <Actions actions={actions.length ? actions : [{ label: 'Contact us', href: '/contact', style: 'primary' }]} dark />
      </div>
    </SectionShell>
  );
}

function FaqSection({ section }: { section: CmsSection }) {
  const items = contentItems(section.content);

  if (items.length === 0) {
    return null;
  }

  return (
    <SectionShell tone="surface">
      <SectionHeading section={section} />
      <div className="mt-8 grid gap-3">
        {items.map((item, index) => (
          <details key={`${text(item.question) ?? index}`} className="group rounded-lg border border-border bg-card p-5 shadow-panel">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground">
              <span>{text(item.question) || 'Question'}</span>
              <ChevronRight className="h-5 w-5 text-muted transition group-open:rotate-90" aria-hidden="true" />
            </summary>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{text(item.answer) || ''}</p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function TestimonialsSection({ section }: { section: CmsSection }) {
  const items = asArray(section.content, 'testimonials').length ? asArray(section.content, 'testimonials') : contentItems(section.content);

  if (items.length === 0) {
    return null;
  }

  return (
    <SectionShell>
      <SectionHeading section={section} center />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <blockquote key={`${text(item.author) ?? text(item.name) ?? index}`} className="rounded-lg border border-border bg-card p-6 shadow-panel">
            <p className="text-sm leading-7 text-muted">{text(item.quote) || text(item.body) || ''}</p>
            <footer className="mt-5 border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground">{text(item.author) || text(item.name) || 'Patient'}</p>
              {text(item.role) ? <p className="mt-1 text-xs text-muted">{text(item.role)}</p> : null}
            </footer>
          </blockquote>
        ))}
      </div>
    </SectionShell>
  );
}

function StatsSection({ section }: { section: CmsSection }) {
  const items = asArray(section.content, 'stats').length ? asArray(section.content, 'stats') : contentItems(section.content);

  if (items.length === 0) {
    return null;
  }

  return (
    <SectionShell>
      <SectionHeading section={section} center />
      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <div key={`${text(item.label) ?? index}`} className="rounded-lg border border-border bg-card p-6 text-center shadow-panel">
            <dd className="text-4xl font-semibold text-foreground">{numberText(item.value) || '0'}</dd>
            <dt className="mt-2 text-sm font-semibold text-primary">{text(item.label) || 'Metric'}</dt>
            {text(item.description) ? <p className="mt-3 text-sm leading-6 text-muted">{text(item.description)}</p> : null}
          </div>
        ))}
      </dl>
    </SectionShell>
  );
}

function TextSectionByDisplay({ section }: { section: CmsSection }) {
  const display = contentText(section.content, 'display');

  if (display === 'service-cards') return <ServiceCardsSection section={section} />;
  if (display === 'doctor-cards' || display === 'doctor-directory') return <DoctorCardsSection section={section} />;
  if (display === 'department-cards') return <DepartmentCardsSection section={section} />;
  if (display === 'timeline') return <TimelineSection section={section} />;
  if (display === 'contact-cards') return <ContactCardsSection section={section} />;
  if (display === 'location-panel') return <LocationPanelSection section={section} />;
  if (display === 'feature-grid' || display === 'feature-list' || display === 'support-features') {
    return <FeatureGridSection section={section} items={asArray(section.content, 'features')} />;
  }
  if (display === 'values') {
    return <FeatureGridSection section={section} items={asArray(section.content, 'values')} tone="surface" />;
  }

  return <SectionText section={section} />;
}

export function CmsSectionRenderer({ section }: { section: CmsSection }) {
  if (section.type === 'HERO') return <HeroSection section={section} />;
  if (section.type === 'CTA') return <CtaSection section={section} />;
  if (section.type === 'FAQ') return <FaqSection section={section} />;
  if (section.type === 'TESTIMONIALS') return <TestimonialsSection section={section} />;
  if (section.type === 'STATS') return <StatsSection section={section} />;
  return <TextSectionByDisplay section={section} />;
}

interface CmsSectionsProps {
  sections: CmsSection[];
  fallbackTitle: string;
  fallbackBody?: string;
  renderFallback?: boolean;
}

export default function CmsSections({ sections, fallbackTitle, fallbackBody, renderFallback = false }: CmsSectionsProps) {
  const visibleSections = sections.filter((section) => section.isVisible);

  if (visibleSections.length === 0) {
    if (!renderFallback) {
      return null;
    }

    return (
      <CmsSectionRenderer
        section={{
          id: 'fallback',
          pageId: 'fallback',
          type: 'HERO',
          title: fallbackTitle,
          subtitle: null,
          body: fallbackBody ?? null,
          imageUrl: null,
          content: null,
          sortOrder: 0,
          isVisible: true,
          createdAt: '',
          updatedAt: '',
        }}
      />
    );
  }

  return visibleSections.map((section) => <CmsSectionRenderer key={section.id} section={section} />);
}
