import BookingWizard from '@/features/appointments/components/BookingWizard';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import { PublicPageIntro } from '@/features/public/components/PublicStaticSections';

export default function PublicBookAppointmentPage() {
  return (
    <PublicPageShell
      slug="book-appointment"
      fallbackTitle="Book an Appointment"
      fallbackBody="Choose a service, pick an available time, and share your contact details so the care team can confirm your visit."
    >
      <PublicPageIntro
        eyebrow="Appointments"
        title="Choose a service, pick a time, and share the details once."
        body="A focused booking flow helps patients move from service selection to confirmation with less friction."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <BookingWizard mode="public" />
        </div>
      </section>
    </PublicPageShell>
  );
}
