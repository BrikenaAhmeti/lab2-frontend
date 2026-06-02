import type { ReactNode } from 'react';
import { usePublicCmsPage } from '@/features/cms/hooks/useCms';
import CmsSections from './CmsSectionRenderer';
import PublicBannerStrip from './PublicBannerStrip';
import PublicLayout from './PublicLayout';
import PublicSeo from './PublicSeo';
import { defaultPublicSiteSettings, usePublicSiteSettings } from '../hooks/usePublicSiteSettings';

interface PublicPageShellProps {
  slug: string;
  fallbackTitle: string;
  fallbackBody?: string;
  showBanners?: boolean;
  children?: ReactNode;
}

export default function PublicPageShell({
  slug,
  fallbackTitle,
  fallbackBody,
  showBanners = false,
  children,
}: PublicPageShellProps) {
  const pageQuery = usePublicCmsPage(slug);
  const siteSettingsQuery = usePublicSiteSettings();
  const page = pageQuery.data;
  const siteSettings = siteSettingsQuery.data ?? defaultPublicSiteSettings;
  const cmsSections = pageQuery.isSuccess ? page?.sections ?? [] : [];
  const fallbackSeoTitle = slug === 'home' ? siteSettings.facilityName : fallbackTitle;

  return (
    <PublicLayout siteSettings={siteSettings}>
      <PublicSeo
        title={page?.metaTitle || page?.title || fallbackSeoTitle}
        description={page?.metaDescription}
        slug={slug}
        siteName={siteSettings.facilityName}
        defaultDescription={siteSettings.description}
      />
      {showBanners ? <PublicBannerStrip /> : null}
      <CmsSections sections={cmsSections} fallbackTitle={fallbackTitle} fallbackBody={fallbackBody} />
      {children}
    </PublicLayout>
  );
}
