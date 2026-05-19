import { useAppSelector } from '@/app/hooks';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import BookingWizard from '../components/BookingWizard';
import { resolvePatientId, type BookingMode } from '../hooks/useAppointments';

interface BookAppointmentPageProps {
  mode: BookingMode;
}

export default function BookAppointmentPage({ mode }: BookAppointmentPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const patientId = mode === 'patient' ? resolvePatientId(user) : undefined;
  const root = mode === 'patient' ? '/patient' : '/receptionist';
  const label = mode === 'patient' ? 'Patient' : 'Receptionist';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Book Appointment' }]} />
      <BookingWizard mode={mode} patientId={patientId} />
    </div>
  );
}
