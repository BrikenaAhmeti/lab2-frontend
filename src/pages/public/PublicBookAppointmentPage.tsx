import BookingWizard from '@/features/appointments/components/BookingWizard';
import PublicPageShell from '@/features/public/components/PublicPageShell';
import { PublicPageIntro } from '@/features/public/components/PublicStaticSections';

export default function PublicBookAppointmentPage() {
  return (
    <PublicPageShell
      slug="book-appointment"
      fallbackTitle="Book a Patient Appointment"
      fallbackBody="Choose a clinical service, pick an available time, and share patient details so the care team can confirm the visit."
    >
      <PublicPageIntro
        eyebrow="Appointments"
        title="Book a patient visit with the right care team."
        body="Patients can choose a department, clinical service, doctor or care provider, and available time before confirming."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <BookingWizard mode="public" />
        </div>
      </section>
    </PublicPageShell>
  );
}
