import PublicContactForm from '@/features/contact/components/PublicContactForm';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import {
  PublicContactStaticSections,
  PublicPageIntro,
} from '@/features/public/components/PublicStaticSections';

export default function PublicContactPage() {
  return (
    <PublicPageShell
      slug="contact"
      fallbackTitle="Contact"
      fallbackBody="Send a question to the MedSphere team."
    >
      <PublicPageIntro
        eyebrow="Contact"
        title="Reach the team from a clearer contact page."
        body="Use the public form for general questions, routing requests, or help getting started with patient registration."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <PublicContactForm />
        </div>
      </section>
      <PublicContactStaticSections />
    </PublicPageShell>
  );
}
