import { useEffect } from 'react';

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);

  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

function upsertJsonLd(id: string, data: unknown) {
  let element = document.getElementById(id) as HTMLScriptElement | null;

  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }

  element.text = JSON.stringify(data);
}

function pathFromSlug(slug?: string) {
  if (!slug || slug === 'home') return '/';
  return `/${slug.replace(/^\/+/, '')}`;
}

interface PublicSeoProps {
  title?: string | null;
  description?: string | null;
  slug?: string;
  siteName: string;
  defaultDescription: string;
}

export default function PublicSeo({ title, description, slug, siteName, defaultDescription }: PublicSeoProps) {
  useEffect(() => {
    const cleanTitle = title?.trim() || siteName;
    const pageTitle = cleanTitle === siteName ? siteName : `${cleanTitle} | ${siteName}`;
    const pageDescription = description?.trim() || publicPageDescriptions[slug ?? 'home'] || defaultDescription;
    const path = pathFromSlug(slug);
    const canonicalUrl = `${siteUrl}${path}`;

    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description' }, pageDescription);
    upsertMeta('meta[name="robots"]', { name: 'robots' }, publicRobots);
    upsertMeta('meta[name="googlebot"]', { name: 'googlebot' }, publicRobots);
    upsertMeta('meta[name="application-name"]', { name: 'application-name' }, siteName);
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, 'en_US');
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, pageTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, pageDescription);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  }, [defaultDescription, description, siteName, slug, title]);

  return null;
}
