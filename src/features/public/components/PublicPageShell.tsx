import type { ReactNode } from 'react';
import { usePublicCmsPage } from '@/features/cms/hooks/useCms';
import CmsSections from './CmsSectionRenderer';
import PublicBannerStrip from './PublicBannerStrip';
import PublicLayout from './PublicLayout';
import PublicSeo from './PublicSeo';

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
  const page = pageQuery.data;
  const cmsSections = pageQuery.isSuccess ? page?.sections ?? [] : [];

  return (
    <PublicLayout>
      <PublicSeo title={page?.metaTitle || page?.title || fallbackTitle} description={page?.metaDescription} slug={slug} />
      {showBanners ? <PublicBannerStrip /> : null}
      <CmsSections sections={cmsSections} fallbackTitle={fallbackTitle} fallbackBody={fallbackBody} />
      {children}
    </PublicLayout>
  );
}
