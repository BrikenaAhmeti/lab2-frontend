import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/ui/atoms/Button';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { cmsQueryKeys, usePublicCmsPage } from '@/features/cms/hooks/useCms';
import type { CmsPage, CmsSection } from '@/lib/api/cms-api';
import { env } from '@/config/env';
import { safeHref, safeImageSrc } from '@/utils/safeUrl';

interface LivePreviewPaneProps {
  page: CmsPage | undefined;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function textValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function contentItems(content: unknown) {
  const value = asRecord(content).items ?? content;
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
}

function SectionPreview({ section }: { section: CmsSection }) {
  const content = asRecord(section.content);
  const items = contentItems(section.content);

  if (section.type === 'HERO') {
    const imageUrl = safeImageSrc(section.imageUrl);

    return (
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        {imageUrl ? <img src={imageUrl} alt="" className="h-40 w-full object-cover" loading="lazy" decoding="async" /> : null}
        <div className="p-4">
          <h3 className="text-2xl font-semibold text-foreground">{section.title}</h3>
          {section.subtitle ? <p className="mt-2 text-sm text-muted">{section.subtitle}</p> : null}
          {section.body ? <p className="mt-3 text-sm leading-6 text-foreground">{section.body}</p> : null}
        </div>
      </section>
    );
  }

  if (section.type === 'FAQ') {
    return (
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{section.title || 'FAQ'}</h3>
        {items.map((item, index) => (
          <details key={index} className="rounded-lg border border-border bg-surface p-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">{textValue(item, 'question')}</summary>
            <p className="mt-2 text-sm text-muted">{textValue(item, 'answer')}</p>
          </details>
        ))}
      </section>
    );
  }

  if (section.type === 'STATS') {
    return (
      <section>
        <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xl font-semibold text-foreground">{textValue(item, 'value')}</p>
              <p className="text-xs text-muted">{textValue(item, 'label')}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === 'TESTIMONIALS') {
    return (
      <section>
        <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        <div className="mt-3 grid gap-2">
          {items.map((item, index) => (
            <blockquote key={index} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-sm text-foreground">{textValue(item, 'quote')}</p>
              <footer className="mt-2 text-xs text-muted">{textValue(item, 'author')}</footer>
            </blockquote>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === 'CTA') {
    const buttonLabel = textValue(content, 'buttonLabel') || 'Open';
    const linkUrl = safeHref(textValue(content, 'linkUrl'));

    return (
      <section className="rounded-xl border border-border bg-primary/10 p-4">
        <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        {section.body ? <p className="mt-2 text-sm text-muted">{section.body}</p> : null}
        {linkUrl ? (
          <a
            href={linkUrl}
            className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {buttonLabel}
          </a>
        ) : null}
      </section>
    );
  }

  const imageUrl = safeImageSrc(section.imageUrl);

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
      {section.subtitle ? <p className="mt-1 text-sm text-muted">{section.subtitle}</p> : null}
      {section.body ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">{section.body}</p> : null}
      {imageUrl ? <img src={imageUrl} alt="" className="mt-3 max-h-48 w-full rounded-lg object-cover" loading="lazy" decoding="async" /> : null}
    </section>
  );
}

export default function LivePreviewPane({ page }: LivePreviewPaneProps) {
  const queryClient = useQueryClient();
  const slug = page?.slug ?? '';
  const previewQuery = usePublicCmsPage(slug);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const socket = io(env.CMS_SOCKET_URL);

    socket.on('cms:content-updated', (payload: { slug?: string }) => {
      if (payload.slug === slug) {
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publicPage(slug) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, slug]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Live Preview</h2>
          <p className="mt-1 text-sm text-muted">{slug ? `/${slug}` : 'No slug selected'}</p>
        </div>
        <Button size="sm" variant="secondary" disabled={!slug || previewQuery.isFetching} onClick={() => previewQuery.refetch()}>
          Refresh
        </Button>
      </div>

      {previewQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-36 animate-pulse rounded-xl bg-surface" />
          <div className="h-24 animate-pulse rounded-xl bg-surface" />
        </div>
      ) : null}

      {previewQuery.isError ? <FeedbackMessage type="error" message="Public preview is unavailable" /> : null}

      {!previewQuery.isLoading && !previewQuery.isError && previewQuery.data ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <header>
            <h3 className="text-xl font-semibold text-foreground">{previewQuery.data.title}</h3>
            {previewQuery.data.metaDescription ? (
              <p className="mt-1 text-sm text-muted">{previewQuery.data.metaDescription}</p>
            ) : null}
          </header>
          {previewQuery.data.sections?.length ? (
            <div className="space-y-4">
              {previewQuery.data.sections.map((section) => (
                <SectionPreview key={section.id} section={section} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface/60 px-4 py-8 text-center text-sm text-muted">
              No public sections
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
