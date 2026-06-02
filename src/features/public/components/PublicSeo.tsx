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
    const pageDescription = description?.trim() || defaultDescription;
    const path = slug && slug !== 'home' ? `/${slug}` : '/';
    const url = `${window.location.origin}${path}`;

    document.title = pageTitle;
    upsertMeta('meta[name="description"]', { name: 'description' }, pageDescription);
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, pageTitle);
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, pageDescription);
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, 'website');
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, url);
  }, [defaultDescription, description, siteName, slug, title]);

  return null;
}
