import PublicPageShell from '@/features/public/components/PublicPageShell';
import { PublicHomeStaticSections } from '@/features/public/components/PublicStaticSections';

export default function PublicHomePage() {
  return (
    <PublicPageShell
      slug="home"
      fallbackTitle="MedSphere"
      fallbackBody="Modern care, organized clearly."
      showBanners
    >
      <PublicHomeStaticSections />
    </PublicPageShell>
  );
}
