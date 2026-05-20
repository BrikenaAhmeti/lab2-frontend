import { useAppSelector } from '@/app/hooks';
import type { AppointmentType } from '@/lib/api/appointments-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import BookingWizard from '../components/BookingWizard';
import { resolvePatientId, type BookingMode } from '../hooks/useAppointments';
import { useLocation } from 'react-router-dom';

interface BookAppointmentPageProps {
  mode: BookingMode;
}

export default function BookAppointmentPage({ mode }: BookAppointmentPageProps) {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const state = location.state as { appointmentType?: AppointmentType; patient?: PatientRecord } | null;
  const patientId = mode === 'patient' ? resolvePatientId(user) : undefined;
  const root = mode === 'patient' ? '/patient' : '/receptionist';
  const label = mode === 'patient' ? 'Patient' : 'Receptionist';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Book Appointment' }]} />
      <BookingWizard
        mode={mode}
        patientId={patientId}
        appointmentType={state?.appointmentType}
        initialPatient={mode === 'receptionist' ? state?.patient : null}
      />
    </div>
  );
}
