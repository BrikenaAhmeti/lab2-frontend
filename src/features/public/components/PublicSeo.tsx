import { useEffect } from 'react';

const siteUrl = ((import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || 'https://medsphere.vercel.app').replace(/\/+$/, '');
const socialImageUrl = `${siteUrl}/medsphere-social.png`;
const logoUrl = `${siteUrl}/medsphere.png`;
const publicRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const defaultSocialAlt = 'MedSphere healthcare management and patient care platform preview';

const publicPageDescriptions: Record<string, string> = {
  home: 'MedSphere connects patients and care teams through online appointment booking, departments, doctors, clinical services, records, lab results, billing, and secure healthcare portals.',
  about: 'Learn how MedSphere organizes modern healthcare access, patient communication, clinical workflows, diagnostics, billing, and role-based care operations.',
  departments: 'Browse MedSphere departments and care areas, then move from the right department to matching clinical services, doctors, and appointment options.',
  doctors: 'Find published MedSphere doctor profiles by specialty, department, and care focus before choosing the right appointment path.',
  services: 'Explore MedSphere clinical services by department, review visit details, and prepare for appointment booking with the right care team.',
  'book-appointment': 'Book a patient appointment with MedSphere by choosing a doctor or care provider, selecting a clinical service, and confirming an available visit time.',
  contact: 'Contact the MedSphere team for questions about appointments, patient registration, care routing, departments, and public healthcare services.',
};

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
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, siteName);
    upsertMeta('meta[property="og:image"]', { property: 'og:image' }, socialImageUrl);
    upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, socialImageUrl);
    upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type' }, 'image/png');
    upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, '1200');
    upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, '630');
    upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, defaultSocialAlt);
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, 'summary_large_image');
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, pageTitle);
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, pageDescription);
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, socialImageUrl);
    upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, defaultSocialAlt);
    upsertMeta('meta[itemprop="name"]', { itemprop: 'name' }, pageTitle);
    upsertMeta('meta[itemprop="description"]', { itemprop: 'description' }, pageDescription);
    upsertMeta('meta[itemprop="image"]', { itemprop: 'image' }, socialImageUrl);
    upsertLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
    upsertLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: canonicalUrl });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: canonicalUrl });
    upsertJsonLd('public-page-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      image: socialImageUrl,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: siteName,
        url: `${siteUrl}/`,
      },
      publisher: {
        '@type': 'Organization',
        name: siteName,
        url: `${siteUrl}/`,
        logo: {
          '@type': 'ImageObject',
          url: logoUrl,
          width: 399,
          height: 386,
        },
      },
    });
  }, [defaultDescription, description, siteName, slug, title]);

  return null;
}
