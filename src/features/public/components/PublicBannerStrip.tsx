import { usePublicCmsBanners } from '@/features/cms/hooks/useCms';

export default function PublicBannerStrip() {
  const bannersQuery = usePublicCmsBanners();
  const banners = bannersQuery.data ?? [];

  if (bannersQuery.isLoading || banners.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border bg-card" aria-label="Announcements">
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 md:grid-cols-2">
        {banners.map((banner) => (
          <article key={banner.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
            {banner.imageUrl ? (
              <img src={banner.imageUrl} alt="" className="h-16 w-20 rounded-lg object-cover" loading="lazy" decoding="async" />
            ) : null}
            <div>
              <h2 className="text-sm font-semibold text-foreground">{banner.title}</h2>
              <p className="mt-1 text-sm text-muted">{banner.message}</p>
              {banner.linkUrl ? (
                <a href={banner.linkUrl} className="mt-2 inline-flex text-sm font-medium text-primary">
                  Learn more
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
