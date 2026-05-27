import PublicPageShell from '@/features/public/components/PublicPageShell';

export default function PublicCmsPage() {
  return (
    <PublicPageShell
      slug="about"
      fallbackTitle="About MedSphere"
      fallbackBody="Care information from the MedSphere content team."
    />
  );
}
