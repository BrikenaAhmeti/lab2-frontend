import type { CmsSection } from '@/lib/api/cms-api';

type ContentMap = Record<string, unknown>;

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

function contentItems(content: unknown) {
  const value = isMap(content) ? content.items : content;
  return Array.isArray(value) ? value.filter(isMap) : [];
}

function contentText(content: unknown, key: string) {
  return isMap(content) ? text(content[key]) : null;
}

function SectionText({ section }: { section: CmsSection }) {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {section.title ? <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2> : null}
        {section.subtitle ? <p className="mt-2 max-w-3xl text-base text-muted">{section.subtitle}</p> : null}
        {section.body ? <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-muted">{section.body}</p> : null}
      </div>
    </section>
  );
}

function HeroSection({ section }: { section: CmsSection }) {
  const imageUrl = section.imageUrl || '/medsphere-logo.png';

  return (
    <section className="relative overflow-hidden bg-foreground text-white">
      <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 bg-foreground/75" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold md:text-5xl">{section.title || 'MedSphere'}</h1>
          {section.subtitle ? <p className="mt-5 text-lg text-white/85">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-white/75">{section.body}</p> : null}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ section }: { section: CmsSection }) {
  const href = contentText(section.content, 'linkUrl') || '/contact';
  const label = contentText(section.content, 'linkLabel') || 'Contact us';

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          {section.title ? <h2 className="text-2xl font-semibold">{section.title}</h2> : null}
          {section.body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/85">{section.body}</p> : null}
        </div>
        <a className="inline-flex rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-foreground" href={href}>
          {label}
        </a>
      </div>
    </section>
  );
}

function FaqSection({ section }: { section: CmsSection }) {
  const items = contentItems(section.content);

  return (
    <section className="bg-surface/70">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {section.title ? <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2> : null}
        <div className="mt-5 grid gap-3">
          {items.map((item, index) => (
            <details key={`${text(item.question) ?? index}`} className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer font-medium text-foreground">{text(item.question) || 'Question'}</summary>
              <p className="mt-3 text-sm leading-6 text-muted">{text(item.answer) || ''}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section }: { section: CmsSection }) {
  const items = contentItems(section.content);

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {section.title ? <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2> : null}
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <blockquote key={`${text(item.name) ?? index}`} className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm leading-6 text-muted">{text(item.quote) || text(item.body) || ''}</p>
              <footer className="mt-4 text-sm font-medium text-foreground">{text(item.name) || 'Patient'}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ section }: { section: CmsSection }) {
  const items = contentItems(section.content);

  return (
    <section className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {section.title ? <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2> : null}
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {items.map((item, index) => (
            <div key={`${text(item.label) ?? index}`} className="rounded-lg border border-border bg-background p-5">
              <dt className="text-sm text-muted">{text(item.label) || 'Metric'}</dt>
              <dd className="mt-2 text-3xl font-semibold text-foreground">{numberText(item.value) || '0'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CmsSectionRenderer({ section }: { section: CmsSection }) {
  if (section.type === 'HERO') return <HeroSection section={section} />;
  if (section.type === 'CTA') return <CtaSection section={section} />;
  if (section.type === 'FAQ') return <FaqSection section={section} />;
  if (section.type === 'TESTIMONIALS') return <TestimonialsSection section={section} />;
  if (section.type === 'STATS') return <StatsSection section={section} />;
  return <SectionText section={section} />;
}

interface CmsSectionsProps {
  sections: CmsSection[];
  fallbackTitle: string;
  fallbackBody?: string;
}

export default function CmsSections({ sections, fallbackTitle, fallbackBody }: CmsSectionsProps) {
  const visibleSections = sections.filter((section) => section.isVisible);

  if (visibleSections.length === 0) {
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
