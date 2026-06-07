import PublicPageShell from '@/features/public/components/PublicPageShell';
import { PublicAboutStaticSections } from '@/features/public/components/PublicStaticSections';

export default function PublicCmsPage() {
  return (
    <PublicPageShell
      slug="about"
      fallbackTitle="About MedSphere"
      fallbackBody="Care information from the MedSphere content team."
    >
      <PublicAboutStaticSections />
    </PublicPageShell>
  );
}
