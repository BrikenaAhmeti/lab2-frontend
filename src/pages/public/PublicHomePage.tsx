import PublicPageShell from '@/features/public/components/PublicPageShell';

export default function PublicHomePage() {
  return (
    <PublicPageShell
      slug="home"
      fallbackTitle="MedSphere"
      fallbackBody="Modern care, organized clearly."
      showBanners
    />
  );
}
