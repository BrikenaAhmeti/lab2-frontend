import type { ReactNode } from 'react';
import FeedbackMessage from '@/ui/molecules/FeedbackMessage';
import { getApiErrorMessage } from '@/features/staff/hooks/useStaff';
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

  return (
    <PublicLayout>
      <PublicSeo title={page?.metaTitle || page?.title || fallbackTitle} description={page?.metaDescription} slug={slug} />
      {showBanners ? <PublicBannerStrip /> : null}
      {pageQuery.isError ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <FeedbackMessage
            type="error"
            message={getApiErrorMessage(pageQuery.error, 'CMS page content could not be loaded.')}
          />
        </section>
      ) : null}
      <CmsSections sections={page?.sections ?? []} fallbackTitle={fallbackTitle} fallbackBody={fallbackBody} />
      {children}
    </PublicLayout>
  );
}
