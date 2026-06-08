import { useLocation } from 'react-router-dom';
import { useResolvedPatientSession } from '@/features/auth/hooks/useResolvedPatientSession';
import type { AppointmentType } from '@/lib/api/appointments-api';
import type { PatientRecord } from '@/lib/api/patients-api';
import Breadcrumbs from '@/ui/molecules/Breadcrumbs';
import BookingWizard from '../components/BookingWizard';
import { type BookingMode } from '../hooks/useAppointments';

interface BookAppointmentPageProps {
  mode: BookingMode;
}

export default function BookAppointmentPage({ mode }: BookAppointmentPageProps) {
  const location = useLocation();
  const state = location.state as { appointmentType?: AppointmentType; patient?: PatientRecord } | null;
  const patientSession = useResolvedPatientSession(mode === 'patient');
  const patientId = mode === 'patient' ? patientSession.patientId : undefined;
  const root = mode === 'patient' ? '/patient' : '/receptionist';
  const label = mode === 'patient' ? 'Patient' : 'Receptionist';

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label, to: root }, { label: 'Book Appointment' }]} />
      <BookingWizard
        mode={mode}
        patientId={patientId}
        patientResolving={mode === 'patient' && patientSession.isResolving && !patientId}
        appointmentType={state?.appointmentType}
        initialPatient={mode === 'receptionist' ? state?.patient : patientSession.patient}
      />
    </div>
  );
}
