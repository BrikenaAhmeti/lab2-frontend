import { usePublicCmsBanners } from '@/features/cms/hooks/useCms';
import { ArrowRight } from 'lucide-react';

export default function PublicBannerStrip() {
  const bannersQuery = usePublicCmsBanners();
  const banners = bannersQuery.data ?? [];

  if (bannersQuery.isLoading || banners.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-white/10 bg-cobalt-900 text-white" aria-label="Announcements">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <article key={banner.id} className="flex min-h-32 gap-4 rounded-lg border border-white/12 bg-white/10 p-4 shadow-soft backdrop-blur">
            {banner.imageUrl ? (
              <img src={banner.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-white/20" loading="lazy" decoding="async" />
            ) : null}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">{banner.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/72">{banner.message}</p>
              {banner.linkUrl ? (
                <a href={banner.linkUrl} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-med-200 hover:text-white">
                  <span>Learn more</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
