import { usePublicCmsBanners } from '@/features/cms/hooks/useCms';
import { ArrowRight } from 'lucide-react';
import { safeHref, safeImageSrc } from '@/utils/safeUrl';

export default function PublicBannerStrip() {
  const bannersQuery = usePublicCmsBanners();
  const banners = bannersQuery.data ?? [];

  if (bannersQuery.isLoading || banners.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-white/10 bg-cobalt-900 text-white" aria-label="Announcements">
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 py-4 md:mx-auto md:grid md:max-w-6xl md:grid-cols-2 md:py-5 lg:grid-cols-3">
        {banners.map((banner) => {
          const imageUrl = safeImageSrc(banner.imageUrl);
          const linkUrl = safeHref(banner.linkUrl);

          return (
            <article key={banner.id} className="flex min-h-28 min-w-[18rem] gap-4 rounded-lg border border-white/12 bg-white/10 p-4 shadow-soft backdrop-blur md:min-h-32 md:min-w-0">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-white/10 object-cover ring-1 ring-white/20 sm:h-20 sm:w-20" loading="eager" decoding="async" />
              ) : null}
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white">{banner.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/72">{banner.message}</p>
                {linkUrl ? (
                  <a href={linkUrl} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-med-200 hover:text-white">
                    <span>Learn more</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
