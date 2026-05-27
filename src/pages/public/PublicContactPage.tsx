import PublicContactForm from '@/features/contact/components/PublicContactForm';
import PublicPageShell from '@/features/public/components/PublicPageShell';

export default function PublicContactPage() {
  return (
    <PublicPageShell
      slug="contact"
      fallbackTitle="Contact"
      fallbackBody="Send a question to the MedSphere team."
    >
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PublicContactForm />
        </div>
      </section>
    </PublicPageShell>
  );
}
