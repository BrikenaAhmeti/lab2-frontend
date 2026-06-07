import BookingWizard from '@/features/appointments/components/BookingWizard';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import { PublicPageIntro } from '@/features/public/components/PublicStaticSections';

export default function PublicBookAppointmentPage() {
  return (
    <PublicPageShell
      slug="book-appointment"
      fallbackTitle="Book a Patient Appointment"
      fallbackBody="Choose a doctor or care provider, pick an available time, and share patient details so the care team can confirm the visit."
    >
      <PublicPageIntro
        eyebrow="Appointments"
        title="Book a patient visit with the right care team."
        body="Patients can start with a doctor or care provider, see the linked department, choose a clinical service, and confirm an available time."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <BookingWizard mode="public" />
        </div>
      </section>
    </PublicPageShell>
  );
}
